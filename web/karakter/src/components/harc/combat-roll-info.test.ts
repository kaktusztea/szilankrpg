import { describe, it, expect } from 'vitest';
import { collectDobásInfo, netElőnySzint, sebzésPáncélDelta, célPáncélSpDelta, type DobásHatás } from './combat-roll-info';
import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { SebzésjellegPáncélMátrix, FegyverExtraDef } from '../../engine/data-types';

// Minimal fixtures - only the fields collectDobásInfo touches for the taktika path.
function makeData(): GameData {
  return {
    harciHelyzetek: [],
    statuszok: [],
    fortelySummaries: [],
    taktikak: [
      {
        // Non-fokozatos taktika with structured Hátrány-2 on sebzésdobás (Visszafogott shape).
        // Note: generated JSON uses the 'hatás' key (not 'operátor') for taktika hatások.
        név: 'Visszafogott',
        feltétel_kulcs: 'taktika:visszafogott',
        fokozatos: false,
        módosítók: { TÉ: -10 },
        hatások: [{ hatás: 'hátrány', érték: -2, cél: 'sebzésdobás', megjegyzés: 'Sebzésdobás: Hátrány-2' }],
        kombó_mód: 'whitelist',
        kombó_lista: [],
      },
    ],
  } as unknown as GameData;
}

const session = {
  aktív_helyzetek: [],
  aktív_taktikák: [{ név: 'Visszafogott' }],
  aktív_státuszok: [],
  fegyverfogás: 'egykezes',
} as unknown as Session;

const karakter = { fortélyok: [] } as unknown as Karakter;

describe('collectDobásInfo - nem-fokozatos taktika strukturált hatás', () => {
  it('a Visszafogott Hátrány-2 eljut a sebzésHatások közé (hatás kulcs feldolgozás)', () => {
    const info = collectDobásInfo(session, karakter, makeData());
    const h = info.sebzésHatások.find(x => x.forrás === 'Visszafogott');
    expect(h).toBeDefined();
    expect(h!.operátor).toBe('hátrány');
    expect(h!.érték).toBe(-2);
    expect(h!.cél).toBe('sebzésdobás');
  });

  it('a nettó előny/hátrány szint -2 (Hátrány-2)', () => {
    const info = collectDobásInfo(session, karakter, makeData());
    expect(netElőnySzint(info.sebzésHatások)).toBe(-2);
  });
});

describe('netElőnySzint - előjeles összegzés (Math.abs nélkül)', () => {
  it('előny (+), hátrány (−), enyhít (+) előjeles értékei nettósítva', () => {
    const hatások: DobásHatás[] = [
      { forrás: 'a', cél: 'té_dobás', operátor: 'előny', érték: 2 },
      { forrás: 'b', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'c', cél: 'té_dobás', operátor: 'enyhít', érték: 1 },
    ];
    expect(netElőnySzint(hatások)).toBe(2); // 2 + (−1) + 1 = 2
  });

  it('clamp [-2,+2]: három Hátrány−1 → −2', () => {
    const hatások: DobásHatás[] = [
      { forrás: 'a', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'b', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
      { forrás: 'c', cél: 'té_dobás', operátor: 'hátrány', érték: -1 },
    ];
    expect(netElőnySzint(hatások)).toBe(-2);
  });
});

describe('sebzésPáncélDelta', () => {
  const mátrix: SebzésjellegPáncélMátrix = {
    matrix: {
      'vágó-íves': { csupasz: 3, puha: 2, bor: 0, lanc: -2, merev: -4 },
    },
    struktúra_osztály: { lemez: 'merev' },
  };

  it('lookup: jelleg × osztály → SP delta', () => {
    expect(sebzésPáncélDelta(mátrix, 'vágó-íves', 'merev')).toBe(-4);
    expect(sebzésPáncélDelta(mátrix, 'vágó-íves', 'csupasz')).toBe(3);
  });

  it('ismeretlen jelleg vagy hiányzó jelleg → 0', () => {
    expect(sebzésPáncélDelta(mátrix, 'zúzó', 'merev')).toBe(0);
    expect(sebzésPáncélDelta(mátrix, undefined, 'merev')).toBe(0);
  });
});

describe('célPáncélSpDelta', () => {
  const defs: Record<string, FegyverExtraDef> = {
    panceltalant_jobban_sebez: {
      id: 'panceltalant_jobban_sebez', név: 'Páncéltalant jobban sebez',
      feltétel: [{ típus: 'cél_páncél', érték: 'vérttelen' }],
      hatás: [{ cél: 'SP', mód: 'flat', érték: 3 }],
    },
    // VÉ-hatású cél_páncél extra - NEM SP, tehát figyelmen kívül hagyandó.
    pocsek_vedekezo: {
      id: 'pocsek_vedekezo', név: 'Pocsék védekező',
      feltétel: [{ típus: 'cél_páncél', érték: 'páncélos' }],
      hatás: [{ cél: 'VÉ', mód: 'override', érték: 0 }],
    },
  };
  const extrák = [{ id: 'panceltalant_jobban_sebez' }, { id: 'pocsek_vedekezo' }];

  it('vérttelen (csupasz) cél → +3 SP', () => {
    expect(célPáncélSpDelta(extrák, defs, 'csupasz')).toBe(3);
  });
  it('páncélos (nem csupasz) cél → 0 (a VÉ-hatás nem SP)', () => {
    expect(célPáncélSpDelta(extrák, defs, 'lanc')).toBe(0);
    expect(célPáncélSpDelta(extrák, defs, 'merev')).toBe(0);
  });
  it('nincs extra → 0', () => {
    expect(célPáncélSpDelta(undefined, defs, 'csupasz')).toBe(0);
  });
});
