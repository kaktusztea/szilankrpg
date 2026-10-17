import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from '../__tests__/load-gamedata';
import { validKarakter } from '../__tests__/karakter-fixture';
import { fortélyPróbaBónuszok } from './effekt';
import type { Karakter } from './types';

/** Fortély szituációs próba-bónuszai (§42): kapcsolható sorok a próba-popupban, valós adaton. */
describe('fortélyPróbaBónuszok', () => {
  const data = loadGameDataSync();
  const kar = (fortélyok: [string, number][]) =>
    ({ ...validKarakter(), fortélyok: fortélyok.map(([név, fok]) => ({ id: data.fortelySummaries.find(d => d.név === név)!.id, fok, elem: '' })) }) as Karakter;
  const kép = (k: Karakter, név: string) => fortélyPróbaBónuszok(k, data, ['képzettségpróba'],
    a => a === `képzettség:${data.kepzettsegDefs.find(d => d.név === név)!.id}`);
  const tul = (k: Karakter, kulcs: string, érzék = false) =>
    fortélyPróbaBónuszok(k, data, érzék ? ['tulajdonságpróba', 'érzék_próba'] : ['tulajdonságpróba'],
      a => a === `tulajdonság:${kulcs}` || (érzék && a.startsWith('érzék:')));

  it('Fakír (2): Fájdalomtűrés +4, a szituáció a feliratban; más képzettségre nem', () => {
    const k = kar([['Fakír', 2]]);
    expect(kép(k, 'Fájdalomtűrés')).toEqual([{ érték: 4, leírás: 'Fakír (2): Fájdalomtűrés próba kínzás esetén' }]);
    expect(kép(k, 'Lexikum')).toEqual([]);
  });

  it('Futás (1): Edzettség és Gyorsaság külön soron; Emberentúli látás csak az érzékenységnél', () => {
    const k = kar([['Futás', 1], ['Emberentúli látás', 1]]);
    expect(tul(k, 'edzettség').map(b => b.érték)).toEqual([1]);
    expect(tul(k, 'gyorsaság').map(b => b.érték)).toEqual([1]);
    expect(tul(k, 'érzékenység', true).map(b => b.leírás)).toEqual(['Emberentúli látás (1): Látás Tulajdonságpróba']);
    expect(tul(k, 'ügyesség')).toEqual([]);
  });

  it('Vezető (csoportos érték, szöveges) és Mechanika (kiterjesztés) nem ad flat próba-bónuszt', () => {
    expect(kép(kar([['Vezető: Nyomozó', 2]]), 'Nyomozás')).toEqual([]);
    expect(kép(kar([['Mechanika', 2]]), 'Zárnyitás')).toEqual([]);
  });
});
