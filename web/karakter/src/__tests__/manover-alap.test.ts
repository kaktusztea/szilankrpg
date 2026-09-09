/**
 * Manőver Alap (MA) — engine_spec §14: MA = CEIL((HM_TÉ + HM_VÉ) / 10)
 * A kanonikus képlet a rules.json-ben él; ez a check a valódi szabály ellen fut.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluate, buildContext, type Rule } from '../engine/reactive';

const DATA_ROOT = resolve(__dirname, '../../../../data');

let rules: Rule[];

beforeAll(() => {
  rules = JSON.parse(readFileSync(resolve(DATA_ROOT, 'rules.json'), 'utf-8')).rules;
});

/** MA kiértékelése a valódi rules.json szabállyal. */
function ma(HM_TÉ: number, HM_VÉ: number): number | undefined {
  const ctx = buildContext({}, 1, { harcérték_alap: {}, kp: {}, arányok: {} }, { HM_TÉ, HM_VÉ });
  return evaluate(rules, ctx).get('manőver_alap');
}

describe('manőver_alap (MA)', () => {
  it('a HM összeg tizede, FELFELÉ kerekítve', () => {
    expect(ma(0, 0)).toBe(0);
    expect(ma(1, 0)).toBe(1);    // 0.1 → 1
    expect(ma(5, 5)).toBe(1);    // 10/10 = 1 (nincs túlkerekítés)
    expect(ma(6, 5)).toBe(2);    // 1.1 → 2
    expect(ma(20, 10)).toBe(3);  // 30/10 = 3
    expect(ma(21, 10)).toBe(4);  // 3.1 → 4
  });

  it('a TÉ és VÉ oldal szimmetrikusan számít', () => {
    expect(ma(12, 3)).toBe(ma(3, 12));
  });

  it('szabály létezik a rules.json-ben', () => {
    expect(rules.some(r => r.id === 'manőver_alap')).toBe(true);
  });
});
