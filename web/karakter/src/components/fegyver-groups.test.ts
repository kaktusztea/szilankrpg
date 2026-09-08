import { describe, it, expect } from 'vitest';
import type { GameData } from '../engine/data-loader';
import { buildFegyverGroups } from './fegyver-groups';

const data = {
  fegyverek: [
    { Fegyver: 'Hosszúkard', Alapnév: 'Hosszúkard', Kategória: 'kardvívó', MK_pár: false, 'Forgatás módja': 'egykezes' },
    { Fegyver: 'Rövidkard', Alapnév: 'Rövidkard', Kategória: 'kardvívó', MK_pár: false, 'Forgatás módja': 'egykezes' },
    { Fegyver: 'Csatabárd', Alapnév: 'Csatabárd', Kategória: 'romboló', MK_pár: false, 'Forgatás módja': 'egykezes' },
    { Fegyver: 'Kispajzs', Alapnév: 'Kispajzs', Kategória: 'pajzs', MK_pár: false, 'Forgatás módja': 'egykezes' },        // pajzs → kizárva
    { Fegyver: 'Pallos (2K)', Alapnév: 'Pallos', Kategória: 'kardvívó', MK_pár: true, 'Forgatás módja': 'kétkezes' },   // MK-pár kétkezes → kizárva
  ],
} as unknown as GameData;

describe('buildFegyverGroups', () => {
  it('kategóriánként csoportosít a FEGYVER_KATEGORIAK sorrendben, pajzs/MK-pár kizárva', () => {
    const groups = buildFegyverGroups(data, f => f.Fegyver, new Set());
    expect(groups.map(g => g.label)).toEqual(['kardvívó', 'romboló']); // sorrend + üres csoport nincs
    expect(groups[0].items).toEqual([
      { value: 'Hosszúkard', label: 'Hosszúkard' },
      { value: 'Rövidkard', label: 'Rövidkard' },
    ]);
  });

  it('a felvett értékeket kizárja (case-insensitive)', () => {
    const groups = buildFegyverGroups(data, f => f.Fegyver, new Set(['hosszúkard']));
    const kardvivo = groups.find(g => g.label === 'kardvívó');
    expect(kardvivo?.items.map(i => i.value)).toEqual(['Rövidkard']);
  });

  it('getValue = Alapnév esetén dedupol (fortély spec_elem szemantika)', () => {
    const dupData = {
      fegyverek: [
        { Fegyver: 'Hosszúkard A', Alapnév: 'Hosszúkard', Kategória: 'kardvívó', MK_pár: false, 'Forgatás módja': 'egykezes' },
        { Fegyver: 'Hosszúkard B', Alapnév: 'Hosszúkard', Kategória: 'kardvívó', MK_pár: false, 'Forgatás módja': 'egykezes' },
      ],
    } as unknown as GameData;
    const groups = buildFegyverGroups(dupData, f => f.Alapnév || f.Fegyver, new Set());
    expect(groups[0].items).toEqual([{ value: 'Hosszúkard', label: 'Hosszúkard' }]);
  });
});
