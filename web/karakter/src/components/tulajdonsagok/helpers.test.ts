import { describe, it, expect } from 'vitest';
import type { KepzettsegDef } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import {
  getDisplayName, findDef, sortKepzettsegSlotok, buildDefsByGroup, getAvailableNames,
} from './helpers';

const defs = [
  { név: 'Úszás', csoport: 'fizikai', többszörös: [] },
  { név: 'Nyelvtudás', csoport: 'szellemi', többszörös: ['Aszisz', 'Pyar'] },
  { név: 'Művészet', csoport: 'szellemi', többszörös: ['*'] },
  { név: 'Tradíció', csoport: 'misztikus', többszörös: ['*'] },
] as unknown as KepzettsegDef[];

describe('getDisplayName', () => {
  it('passes through Tradíció entries verbatim', () => {
    expect(getDisplayName('Tradíció: Dzsad', defs)).toBe('Tradíció: Dzsad');
  });
  it('prefixes a fixed-list sub-skill with its base name', () => {
    expect(getDisplayName('Aszisz', defs)).toBe('Nyelvtudás: Aszisz');
  });
  it('passes a freetext "Base:Sub" entry through as-is', () => {
    expect(getDisplayName('Művészet:Festészet', defs)).toBe('Művészet:Festészet');
  });
  it('returns single skills unchanged', () => {
    expect(getDisplayName('Úszás', defs)).toBe('Úszás');
  });
});

describe('findDef', () => {
  it('maps a Tradíció entry to the Tradíció def', () => {
    expect(findDef('Tradíció: Dzsad', defs)?.név).toBe('Tradíció');
  });
  it('maps a fixed-list sub-skill to its base def', () => {
    expect(findDef('Aszisz', defs)?.név).toBe('Nyelvtudás');
  });
  it('maps a freetext entry to its base def', () => {
    expect(findDef('Művészet:Festészet', defs)?.név).toBe('Művészet');
  });
  it('resolves a direct single-skill name', () => {
    expect(findDef('Úszás', defs)?.név).toBe('Úszás');
  });
  it('returns undefined for an unknown name', () => {
    expect(findDef('Nincsilyen', defs)).toBeUndefined();
  });
});

describe('sortKepzettsegSlotok', () => {
  it('orders Tradíció, then Arkánum, then Harcmodor, then alphabetically', () => {
    const slots = [
      { név: 'Úszás' }, { név: 'Harcmodor: Kard' },
      { név: 'Tradíció: X' }, { név: 'Arkánum: Y' },
    ] as unknown as KepzettsegSlot[];
    expect(sortKepzettsegSlotok(slots).map(s => s.név))
      .toEqual(['Tradíció: X', 'Arkánum: Y', 'Harcmodor: Kard', 'Úszás']);
  });
  it('does not mutate the input array', () => {
    const slots = [{ név: 'B' }, { név: 'A' }] as unknown as KepzettsegSlot[];
    sortKepzettsegSlotok(slots);
    expect(slots.map(s => s.név)).toEqual(['B', 'A']);
  });
});

describe('buildDefsByGroup', () => {
  it('groups defs by their csoport', () => {
    const map = buildDefsByGroup(defs);
    expect(map.get('szellemi')?.map(d => d.név)).toEqual(['Nyelvtudás', 'Művészet']);
    expect(map.get('fizikai')?.map(d => d.név)).toEqual(['Úszás']);
  });
});

describe('getAvailableNames', () => {
  it('excludes used fixed-list subs, offers a freetext prompt and remaining subs', () => {
    const byGroup = buildDefsByGroup(defs);
    const opts = getAvailableNames('szellemi', ['Aszisz'], byGroup);
    const values = opts.map(o => o.value);
    expect(values).toContain('Nyelvtudás:Pyar');   // Aszisz used → only Pyar remains
    expect(values).not.toContain('Nyelvtudás:Aszisz');
    expect(values).toContain('__prompt:Művészet');  // freetext always offered
  });
});
