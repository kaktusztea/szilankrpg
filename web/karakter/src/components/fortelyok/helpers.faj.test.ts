import { describe, it, expect } from 'vitest';
import { checkKövetelmények } from './helpers';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

/** `faj` követelmény-típus valós adaton: a faj `érzék_fortélyok` / `ajánlott_fortélyok` max_foka dönt. */
describe('checkKövetelmények - faj', () => {
  const data = loadGameDataSync();
  const hiány = (fortély: string, fok: number, faj: string) => {
    const def = data.fortelySummaries.find(f => f.név === fortély)!;
    const fokDef = def.fokok.find(f => f.fok === fok);
    return checkKövetelmények(fokDef, [], [], data, undefined, data.fajFortélyok[faj] ?? {}, def.id);
  };

  it('Természetes páncél (3): Sáskaharcos OK, Ork nem', () => {
    expect(hiány('Természetes páncél', 3, 'Sáskaharcos')).toEqual([]);
    expect(hiány('Természetes páncél', 1, 'Ork')).toEqual(['Faj Háttér (Természetes páncél ≥ 1. fok)']);
  });

  it('Infralátás: Ork 2. fokig, a 2. fok Khálnak nem', () => {
    expect(hiány('Infralátás', 2, 'Ork')).toEqual([]);
    expect(hiány('Infralátás', 1, 'Khál')).toHaveLength(1);
  });

  it('Természetes fegyver: Khál ajánlott (md), Sáskaharcos nem', () => {
    expect(hiány('Természetes fegyver', 1, 'Khál')).toEqual([]);
    expect(hiány('Természetes fegyver', 1, 'Sáskaharcos')).toHaveLength(1);
  });
});
