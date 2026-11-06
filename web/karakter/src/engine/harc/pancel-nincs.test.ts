/**
 * Bug 2026-11-06: armour structure "- nincs -" (páncél.alap = '') kept rongálódás / sisak / végtag → Harc fül SFÉ -3/-3
 * with "Páncél viselve: Igen". rules.json: sfé_fizikai / sfé_energia / páncél_MGT are gated on páncél_van.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { loadGameDataSync } from '../../__tests__/load-gamedata';
import { calcHarcComputed } from './harc-computed';
import type { Karakter } from '../types';

const data = loadGameDataSync();
const teszt2 = (): Karakter => JSON.parse(readFileSync(resolve(__dirname, '../../../../../data/karakter/test_karakter2.json'), 'utf-8'));

describe('páncél struktúra "nincs"', () => {
  it('SFÉ / MGT / merevvért = 0 even if worn and the leftover fields are set', () => {
    const k = teszt2();
    k.páncél = { ...k.páncél, alap: '', fémalapanyag: '', idea: 0 };   // what the "- nincs -" picker writes
    expect(k.páncél.rongálódás).toBeGreaterThan(0);                     // precondition: the leftover that used to leak
    const hc = calcHarcComputed(data, k, { ...k.session, aktív_páncél: true });
    expect([hc.sfé_fizikai, hc.sfé_energia]).toEqual([0, 0]);
    expect(hc.páncélMGT).toBe(0);
    expect(hc.merevvértBüntetés).toBe(0);
  });

  it('with a structure the armour still counts (no regression)', () => {
    const k = teszt2();
    const hc = calcHarcComputed(data, k, { ...k.session, aktív_páncél: true });
    expect(hc.sfé_fizikai).not.toBe(0);
    expect(hc.páncélMGT).toBeGreaterThan(0);
  });
});
