import { describe, it, expect } from 'vitest';
import type { KepzettsegDef } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import {
  getDisplayName, findDef, sortKepzettsegSlotok, buildDefsByGroup, getAvailableNames,
} from './helpers';

// A képzettségeket hivatkozási KULCS azonosítja ("úszás", "nyelvtudás/aszisz", "tradíció/Dzsad") - 2026-10-17.
const defs = [
  { id: 'úszás', név: 'Úszás', csoport: 'fizikai', többszörös: [] },
  { id: 'nyelvtudás', név: 'Nyelvtudás', csoport: 'szellemi', többszörös: ['Aszisz', 'Pyar'] },
  { id: 'művészet', név: 'Művészet', csoport: 'szellemi', többszörös: ['*'] },
  { id: 'tradíció', név: 'Tradíció', csoport: 'misztikus', többszörös: [] },
  { id: 'arkánum_y', név: 'Arkánum: Y', csoport: 'misztikus', többszörös: [] },
  { id: 'harcmodor', név: 'Harcmodor', csoport: 'harci', többszörös: ['Kardvívás'] },
] as unknown as KepzettsegDef[];

describe('getDisplayName', () => {
  it('Tradíció: "Tradíció: <elem>"', () => {
    expect(getDisplayName('tradíció/Dzsad', defs)).toBe('Tradíció: Dzsad');
  });
  it('fixed-list sub-skill: "Alapnév: elem"', () => {
    expect(getDisplayName('nyelvtudás/Aszisz', defs)).toBe('Nyelvtudás: Aszisz');
  });
  it('harcmodor: "Harcmodor: <elem neve>"', () => {
    expect(getDisplayName('harcmodor/kardvívás', defs)).toBe('Harcmodor: Kardvívás');
  });
  it('single skill: a def neve', () => {
    expect(getDisplayName('úszás', defs)).toBe('Úszás');
  });
});

describe('findDef', () => {
  it('többszörös / Tradíció: az alap def', () => {
    expect(findDef('tradíció/Dzsad', defs)?.név).toBe('Tradíció');
    expect(findDef('nyelvtudás/Aszisz', defs)?.név).toBe('Nyelvtudás');
    expect(findDef('művészet/Festészet', defs)?.név).toBe('Művészet');
  });
  it('egyszerű: id szerint; ismeretlen → undefined', () => {
    expect(findDef('úszás', defs)?.név).toBe('Úszás');
    expect(findDef('nincsilyen', defs)).toBeUndefined();
  });
});

describe('sortKepzettsegSlotok', () => {
  const slot = (id: string, elem = '') => ({ id, elem, szint: 1 }) as KepzettsegSlot;
  it('Tradíció, Arkánum, Harcmodor, majd név szerint', () => {
    const slots = [slot('úszás'), slot('harcmodor', 'kardvívás'), slot('tradíció', 'X'), slot('arkánum_y')];
    expect(sortKepzettsegSlotok(slots, defs).map(s => s.id)).toEqual(['tradíció', 'arkánum_y', 'harcmodor', 'úszás']);
  });
  it('does not mutate the input array', () => {
    const slots = [slot('úszás'), slot('nyelvtudás', 'Aszisz')];
    sortKepzettsegSlotok(slots, defs);
    expect(slots.map(s => s.id)).toEqual(['úszás', 'nyelvtudás']);
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
  it('a felvett elemek kimaradnak, szabad szöveges → prompt; a value hivatkozási kulcs', () => {
    const opts = getAvailableNames('szellemi', ['nyelvtudás/Aszisz'], buildDefsByGroup(defs));
    const values = opts.map(o => o.value);
    expect(values).toContain('nyelvtudás/Pyar');
    expect(values).not.toContain('nyelvtudás/Aszisz');
    expect(values).toContain('__prompt:művészet');
    expect(opts.find(o => o.value === 'nyelvtudás/Pyar')?.label).toBe('Nyelvtudás: Pyar');
  });
});
