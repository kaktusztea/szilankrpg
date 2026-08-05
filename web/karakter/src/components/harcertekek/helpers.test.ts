import { describe, it, expect } from 'vitest';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { calcMaxHM, calcMaxAszimmetria, getHarcmodorok } from './helpers';

const data = {
  konstansok: {
    fegyver_kategória_harcmodor: { kardvívó: 'Kardvívás', romboló: 'Kardvívás', közelharci: 'Közelharc' },
    hm_aszimmetria_osztó: 3,
  },
  fortelySummaries: [
    { név: 'Támadó fokozás', csoport: 'harci' },
    { név: 'Mesterfegyver', csoport: 'harci' },
    { név: 'Meditáció', csoport: 'misztikus' },
  ],
} as unknown as GameData;

describe('getHarcmodorok', () => {
  it('returns the de-duplicated harcmodor names', () => {
    expect(getHarcmodorok(data)).toEqual(['Kardvívás', 'Közelharc']);
  });
});

describe('calcMaxHM', () => {
  it('sums harci fortély fokok (excl. Mesterfegyver) + harcmodor szintek + Alakzatharc', () => {
    const k = {
      fortélyok: [
        { név: 'Támadó fokozás', fok: 3 },
        { név: 'Mesterfegyver', fok: 2 },  // excluded
        { név: 'Meditáció', fok: 1 },       // not harci → excluded
      ],
      képzettségek: [
        { név: 'Kardvívás', szint: 4 },
        { név: 'Közelharc', szint: 2 },
        { név: 'Alakzatharc', szint: 1 },
      ],
    } as unknown as Karakter;
    // 3 (fortély) + (4+2) harcmodor + 1 alakzatharc = 10
    expect(calcMaxHM(data, k)).toBe(10);
  });
});

describe('calcMaxAszimmetria', () => {
  it('is floor(tsz / hm_aszimmetria_osztó)', () => {
    expect(calcMaxAszimmetria(data, 10)).toBe(3); // floor(10/3)
    expect(calcMaxAszimmetria(data, 2)).toBe(0);
  });
});
