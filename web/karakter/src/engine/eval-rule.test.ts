import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evalRule, type Rule } from './reactive';

// The real rules.json: evalRule replaced the hand-written TS copies of these formulas (refactor phase 4).
const RULES: Rule[] = (JSON.parse(readFileSync(resolve(__dirname, '../../../../data/rules.json'), 'utf-8')) as { rules: Rule[] }).rules;

describe('evalRule', () => {
  it('manőver_pont = ceil(harcmodor_összeg * 2 / tsz)', () => {
    for (const harcmodor_összeg of [0, 7, 12, 25, 40]) {
      for (const tsz of [1, 3, 5, 10]) {
        expect(evalRule(RULES, 'manőver_pont', { harcmodor_összeg, tsz })).toBe(Math.ceil(harcmodor_összeg * 2 / tsz));
      }
    }
  });

  it('páncél_lefedettség = páncél_van ? 50 + végtag*10 + sisak*10 : 0', () => {
    for (const páncél_van of [0, 1]) for (const v of [0, 2, 4]) for (const sisak of [0, 1]) {
      expect(evalRule(RULES, 'páncél_lefedettség', { páncél_van, páncél_végtagvédettség: v, páncél_sisak: sisak }))
        .toBe(páncél_van ? 50 + v * 10 + sisak * 10 : 0);
    }
  });

  it('unknown rule id throws', () => {
    expect(() => evalRule(RULES, 'nincs_ilyen_szabály', {})).toThrow(/unknown rules.json rule/);
  });

  it('a missing declared input throws (the formula engine would silently read it as 0)', () => {
    expect(() => evalRule(RULES, 'manőver_pont', { harcmodor_összeg: 10 })).toThrow(/missing input\(s\) tsz/);
  });
});
