import { describe, it, expect } from 'vitest';
import type { GameData } from '../engine/data-loader';
import { buildFegyverGroups } from './fegyver-groups';

const data = {
  fegyverek: [
    { név: 'Hosszúkard', kategória: 'kardvívó' },
    { név: 'Rövidkard', kategória: 'kardvívó' },
    { név: 'Csatabárd', kategória: 'romboló' },
    { név: 'Kispajzs', kategória: 'pajzs' },   // pajzs → kizárva
  ],
} as unknown as GameData;

describe('buildFegyverGroups', () => {
  it('kategóriánként csoportosít a FEGYVER_KATEGORIAK sorrendben, pajzs kizárva', () => {
    const groups = buildFegyverGroups(data, f => f.név, new Set());
    expect(groups.map(g => g.label)).toEqual(['kardvívó', 'romboló']); // sorrend + üres csoport nincs
    expect(groups[0].items).toEqual([
      { value: 'Hosszúkard', label: 'Hosszúkard' },
      { value: 'Rövidkard', label: 'Rövidkard' },
    ]);
  });

  it('a felvett értékeket kizárja (case-insensitive)', () => {
    const groups = buildFegyverGroups(data, f => f.név, new Set(['hosszúkard']));
    const kardvivo = groups.find(g => g.label === 'kardvívó');
    expect(kardvivo?.items.map(i => i.value)).toEqual(['Rövidkard']);
  });

  it('dedupol, ha getValue több rekordot ugyanarra az értékre képez le', () => {
    const dupData = {
      fegyverek: [
        { név: 'Hosszúkard A', kategória: 'kardvívó' },
        { név: 'Hosszúkard B', kategória: 'kardvívó' },
      ],
    } as unknown as GameData;
    const groups = buildFegyverGroups(dupData, () => 'Hosszúkard', new Set());
    expect(groups[0].items).toEqual([{ value: 'Hosszúkard', label: 'Hosszúkard A' }]);
  });
});
