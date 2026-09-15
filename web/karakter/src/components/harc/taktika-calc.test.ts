import { describe, it, expect } from 'vitest';
import { calcTaktikaMods } from './taktika-calc';
import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

// Minimal GameData: Visszafogott non-fokozatos taktika (-10 TÉ) + a letilt fortély.
function makeData(): GameData {
  return {
    konstansok: { taktika_vé_eltolás_limit: 6 },
    taktikak: [
      { név: 'Visszafogott', feltétel_kulcs: 'taktika:visszafogott', fokozatos: false, módosítók: { TÉ: -10 } },
    ],
    fortelySummaries: [
      {
        név: 'Taktikafókusz: Visszafogott',
        fokok: [{ fok: 1, módosítók: [{ cél: 'TÉ', érték: 0, mód: 'letilt', forrás: '', arány: 0, feltétel: 'taktika:visszafogott' }] }],
      },
    ],
  } as unknown as GameData;
}

const session = { aktív_taktikák: [{ név: 'Visszafogott' }] } as unknown as Session;

describe('calcTaktikaMods — letilt taktika-módosító semlegesítés', () => {
  it('fortély nélkül a Visszafogott TÉ:-10 érvényesül', () => {
    const mods = calcTaktikaMods(session, makeData(), { fortélyok: [] } as unknown as Karakter);
    expect(mods['TÉ']).toBe(-10);
  });

  it('a letilt fortéllyal a taktika TÉ-je semlegesítődik (0), szám-függetlenül', () => {
    const k = { fortélyok: [{ név: 'Taktikafókusz: Visszafogott', fok: 1 }] } as unknown as Karakter;
    const mods = calcTaktikaMods(session, makeData(), k);
    expect(mods['TÉ']).toBe(0);
  });
});

describe('calcTaktikaMods — fokozatos ág + több cél halmozása', () => {
  function makeFokozatosData(): GameData {
    return {
      konstansok: { taktika_vé_eltolás_limit: 6 },
      taktikak: [
        // Fokozatos taktika, 1. fok: KÉ+2, TÉ+5, VÉ-3, SP+1 — mind a négy célt érinti.
        { név: 'Támadó', feltétel_kulcs: 'taktika:támadó', fokozatos: true,
          fokok: [{ fok: 1, KÉ: 2, TÉ: 5, VÉ: -3, SP: 1 }] },
      ],
      fortelySummaries: [],
    } as unknown as GameData;
  }
  const fokSession = { aktív_taktikák: [{ név: 'Támadó', fok: 1 }] } as unknown as Session;

  it('a fokozatos fok-def mind a négy célra alkalmazódik', () => {
    const mods = calcTaktikaMods(fokSession, makeFokozatosData(), { fortélyok: [] } as unknown as Karakter);
    expect(mods).toMatchObject({ KÉ: 2, TÉ: 5, VÉ: -3, SP: 1 });
  });

  it('a VÉ eltolás a limitre csordul (limit=6)', () => {
    const data = makeFokozatosData();
    (data.taktikak[0] as { fokok: { fok: number; VÉ: number }[] }).fokok[0].VÉ = -20;
    const mods = calcTaktikaMods(fokSession, data, { fortélyok: [] } as unknown as Karakter);
    expect(mods['VÉ']).toBe(-6);
  });
});
