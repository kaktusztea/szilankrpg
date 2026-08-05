import { describe, it, expect } from 'vitest';
import type { Karakter, Session } from './types';
import type { GameData } from './data-loader';
import { calcFortelyMods } from './fortely-mods';

const data = {
  fortelySummaries: [
    { név: 'A', fokok: [{ fok: 2, módosítók: [{ cél: 'TÉ', mód: 'flat', érték: 3, feltétel: 'x' }] }] },
    { név: 'B', fokok: [{ fok: 1, módosítók: [{ cél: 'VÉ', mód: 'scaled', forrás: 'kardvívás', arány: 0.5 }] }] },
    { név: 'C', session_toggle: true, fokok: [{ fok: 1, módosítók: [{ cél: 'TÉ', mód: 'flat', érték: 5 }] }] },
    // Not owned by the character → contributes via alapeset (fok 0)
    { név: 'Alap', fokok: [{ fok: 0, hatás: [], módosítók: [{ cél: 'SP', mód: 'flat', érték: 1, feltétel: 'af' }] }] },
  ],
} as unknown as GameData;

const karakter = {
  fortélyok: [{ név: 'A', fok: 2 }, { név: 'B', fok: 1 }, { név: 'C', fok: 1 }],
  képzettségek: [{ név: 'Kardvívás', szint: 4 }],
} as unknown as Karakter;

const alwaysTrue = () => true;

describe('calcFortelyMods', () => {
  it('applies flat and scaled mods; session-toggle mod counts when toggled on', () => {
    const session = { c: true } as unknown as Session;
    const mods = calcFortelyMods(karakter, session, data, new Set(), alwaysTrue);
    expect(mods.TÉ).toBe(3 + 5);          // A flat 3 + C flat 5
    expect(mods.VÉ).toBe(2);              // B scaled floor(4 * 0.5)
  });

  it('skips a session-toggle mod when the toggle is off', () => {
    const session = {} as unknown as Session; // C off
    const mods = calcFortelyMods(karakter, session, data, new Set(), alwaysTrue);
    expect(mods.TÉ).toBe(3);              // only A
  });

  it('gates a mod on the feltételTeljesül callback', () => {
    const session = { c: true } as unknown as Session;
    const feltételTeljesül = (f: unknown) => f !== 'x'; // block A's feltétel
    const mods = calcFortelyMods(karakter, session, data, new Set(), feltételTeljesül);
    expect(mods.TÉ).toBe(5);             // A blocked, C stays
  });

  it('merges alapeset flat mods for non-owned fortélyok when the feltétel is active', () => {
    const session = {} as unknown as Session;
    const withAf = calcFortelyMods(karakter, session, data, new Set(['af']), alwaysTrue);
    expect(withAf.SP).toBe(1);

    const withoutAf = calcFortelyMods(karakter, session, data, new Set(), alwaysTrue);
    expect(withoutAf.SP).toBe(0);
  });
});
