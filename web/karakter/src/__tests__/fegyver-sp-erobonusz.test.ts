/**
 * fegyver_SP erőbónusz-arány - engine_spec §8, §16:
 *   SP = alap + FLOOR(min(erő, Erőlimit) × (1 + fortély erőbónusz-arány)) + MF + fortély
 * (pl. Taktikafókusz: Roham → Roham taktikánál "erőbónusz duplázódik", arány 1).
 * A kanonikus képlet a rules.json-ben él; ez a check a valódi szabály ellen fut.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluate, buildContext, type Rule } from '../engine/reactive';

const DATA_ROOT = resolve(__dirname, '../../../../data');

let rules: Rule[];

beforeAll(() => {
  rules = JSON.parse(readFileSync(resolve(DATA_ROOT, 'rules.json'), 'utf-8')).rules
    .filter((r: Rule) => r.id === 'fegyver_SP');
});

function sp(erő: number, limit: number, arány: number): number | undefined {
  const ctx = buildContext({ erő }, 1, { harcérték_alap: {}, kp: {}, arányok: {} }, {
    fegyver_alap_SP: 5, fegyver_erőbónusz_limit: limit,
    fegyver_fortély_SP_erőbónusz_arány: arány, fegyver_mf_SP: 0, fegyver_fortély_SP: 0,
  });
  return evaluate(rules, ctx).get('fegyver_SP');
}

describe('fegyver_SP erőbónusz-arány', () => {
  it('arány 0: a sima erőbónusz (változatlan viselkedés)', () => {
    expect(sp(3, 99, 0)).toBe(5 + 3);
  });

  it('arány 1: az erőbónusz duplázódik', () => {
    expect(sp(3, 99, 1)).toBe(5 + 6);
  });

  it('a duplázás a limitált erőbónuszra vonatkozik', () => {
    expect(sp(4, 2, 1)).toBe(5 + 4);  // min(4, 2) = 2 → ×2 = 4
  });
});
