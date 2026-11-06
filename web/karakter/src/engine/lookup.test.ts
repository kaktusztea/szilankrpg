import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { lookupFegyver, lookupTávfegyver, taktikaDef, helyzetDef, státuszDef, fortélyDef, képzettségDef, eseményDef } from './lookup';
import type { FegyverAlap, TavfegyverAlap } from './types';
import type { GameData } from './data-types';

const fegyverek = [{ név: 'Kard, hosszú' }, { név: 'Puszta kéz' }, { név: 'KARD, HOSSZÚ', extra: 'second' }] as unknown as FegyverAlap[];

describe('engine/lookup', () => {
  it('weapon names are case-insensitive, unknown → undefined, first match wins', () => {
    expect(lookupFegyver(fegyverek, 'kard, HOSSZÚ')).toBe(fegyverek[0]);
    expect(lookupFegyver(fegyverek, 'puszta kéz')?.név).toBe('Puszta kéz');
    expect(lookupFegyver(fegyverek, 'nincs ilyen')).toBeUndefined();
    expect(lookupFegyver(fegyverek, '')).toBeUndefined();
  });

  it('index is per array: a different array is indexed separately', () => {
    const other = [{ név: 'Íj, rövid' }] as unknown as TavfegyverAlap[];
    expect(lookupTávfegyver(other, 'íj, RÖVID')).toBe(other[0]);
    expect(lookupFegyver(fegyverek, 'íj, rövid')).toBeUndefined();
  });

  it('names case-insensitive, ids exact', () => {
    const data = {
      taktikak: [{ név: 'Támadó' }], harciHelyzetek: [{ név: 'Belharc' }], statuszok: [{ név: 'Félelem' }],
      fortelySummaries: [{ id: 'harci_akrobatika' }], kepzettsegDefs: [{ id: 'akrobatika' }], esemenyek: [{ id: 'kinzas' }],
    } as unknown as GameData;
    expect(taktikaDef(data, 'támadó')?.név).toBe('Támadó');
    expect(helyzetDef(data, 'BELHARC')?.név).toBe('Belharc');
    expect(státuszDef(data, 'félelem')?.név).toBe('Félelem');
    expect(fortélyDef(data, 'harci_akrobatika')).toBeDefined();
    expect(fortélyDef(data, 'Harci_akrobatika')).toBeUndefined();
    expect(képzettségDef(data, 'akrobatika')).toBeDefined();
    expect(eseményDef(data, 'kinzas')).toBeDefined();
  });
});

// Guard: the case-insensitive name index must never merge two real entries (silent wrong lookup otherwise).
const duplikáltKulcsok = (rows: Record<string, unknown>[], key: string, ci: boolean): string[] => {
  const keys = rows.map(r => (ci ? String(r[key]).toLowerCase() : String(r[key])));
  return keys.filter((k, i) => keys.indexOf(k) !== i);
};

describe('duplikáltKulcsok (negative cases of the data guard)', () => {
  it('flags names that differ only in case when case-insensitive', () => {
    expect(duplikáltKulcsok([{ név: 'Támadó' }, { név: 'támadó' }, { név: 'Roham' }], 'név', true)).toEqual(['támadó']);
  });
  it('flags exact duplicate ids', () => {
    expect(duplikáltKulcsok([{ id: 'a' }, { id: 'b' }, { id: 'a' }], 'id', false)).toEqual(['a']);
  });
  it('ids stay exact: case variants are distinct', () => {
    expect(duplikáltKulcsok([{ id: 'a' }, { id: 'A' }], 'id', false)).toEqual([]);
  });
});

describe('data tables: lookup keys are unique', () => {
  const T = resolve(__dirname, '../../../../data/tables');
  const load = (f: string) => JSON.parse(readFileSync(resolve(T, f), 'utf-8'));
  const cases: [string, string, boolean][] = [
    ['fegyverek_v2.json', 'név', true], ['tavfegyverek_v2.json', 'név', true], ['taktikak.json', 'név', true],
    ['harci_helyzetek.json', 'név', true], ['statuszok.json', 'név', true], ['fortelyok.json', 'id', false],
    ['kepzettsegek.json', 'id', false], ['esemenyek.json', 'id', false],
  ];
  for (const [file, key, ci] of cases) {
    it(`${file} ${key}${ci ? ' (lowercase)' : ''}`, () => {
      const raw = load(file);
      const rows: Record<string, string>[] = Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) as Record<string, string>[]);
      expect(rows.length).toBeGreaterThan(0);
      expect(duplikáltKulcsok(rows, key, ci)).toEqual([]);
    });
  }
});
