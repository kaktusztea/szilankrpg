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
