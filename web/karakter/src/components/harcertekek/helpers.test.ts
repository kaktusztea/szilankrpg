import { describe, it, expect } from 'vitest';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { calcMaxHM, calcMaxAszimmetria, getHarcmodorok } from './helpers';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

const data = {
  konstansok: {
    fegyver_kategória_harcmodor: { kardvívó: 'Kardvívás', romboló: 'Kardvívás', közelharci: 'Közelharc' },
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
  // A formula a rules.json-ban él (`max_HM_aszimmetria`), az osztó a konstansokból jön:
  // ezért itt VALÓDI gamedatát használunk — így a teszt a bekötést is védi.
  const real = loadGameDataSync();
  const osztó = real.konstansok.hm_aszimmetria_osztó;

  it('floor(tsz / konstansok.hm_aszimmetria_osztó)', () => {
    expect(calcMaxAszimmetria(real, 10)).toBe(Math.floor(10 / osztó));
    expect(calcMaxAszimmetria(real, 21)).toBe(Math.floor(21 / osztó));
  });

  it('0, ha a TSz kisebb az osztónál', () => {
    expect(calcMaxAszimmetria(real, osztó - 1)).toBe(0);
  });
});
