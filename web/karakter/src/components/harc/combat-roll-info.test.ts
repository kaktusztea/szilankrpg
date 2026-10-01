import { describe, it, expect } from 'vitest';
import { collectDobásInfo, netElőnySzint, sebzésPáncélDelta, type DobásHatás } from './combat-roll-info';
import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { SebzésjellegPáncélMátrix } from '../../engine/data-types';

// Minimal fixtures - only the fields collectDobásInfo touches for the taktika path.
function makeData(): GameData {
  return {
    harciHelyzetek: [],
    statuszok: [],
    fortelySummaries: [],
    konstansok: { fegyver_erő_követelmény_hátrány: -1 },
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

describe('collectDobásInfo - Erő-követelmény (md/064_02_06)', () => {
  const karakterGyenge = { fortélyok: [], tulajdonságok: { erő: 1 } } as unknown as Karakter;
  const karakterErős = { fortélyok: [], tulajdonságok: { erő: 3 } } as unknown as Karakter;
  const nehézFegyver = { név: 'Alabárd', erő_követelmény: 2 };
  const sessionNincsTaktika = { aktív_helyzetek: [], aktív_taktikák: [], aktív_státuszok: [], fegyverfogás: 'egykezes' } as unknown as Session;

  it('Hátrány-1 a Támadó dobásra, ha a karakter Ereje a követelmény alatt van', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterGyenge, makeData(), nehézFegyver);
    const h = info.téHatások.find(x => x.forrás.includes('Erő hiány'));
    expect(h).toBeDefined();
    expect(h!.forrás).toBe('Alabárd\n(Erő hiány)');
    expect(h!.operátor).toBe('hátrány');
    expect(h!.érték).toBe(-1);
  });

  it('nincs büntetés, ha a karakter Ereje eléri a követelményt', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterErős, makeData(), nehézFegyver);
    expect(info.téHatások.find(x => x.forrás.includes('Erő hiány'))).toBeUndefined();
  });

  it('nincs büntetés, ha nincs átadva aktív fegyver', () => {
    const info = collectDobásInfo(sessionNincsTaktika, karakterGyenge, makeData());
    expect(info.téHatások.find(x => x.forrás.includes('Erő hiány'))).toBeUndefined();
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