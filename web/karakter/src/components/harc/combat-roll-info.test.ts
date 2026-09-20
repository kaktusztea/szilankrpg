import { describe, it, expect } from 'vitest';
import { collectDobásInfo, netElőnySzint, type DobásHatás } from './combat-roll-info';
import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

// Minimal fixtures — only the fields collectDobásInfo touches for the taktika path.
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

describe('collectDobásInfo — nem-fokozatos taktika strukturált hatás', () => {
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

describe('netElőnySzint — előjeles összegzés (Math.abs nélkül)', () => {
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
