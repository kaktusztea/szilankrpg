import { describe, it, expect } from 'vitest';
import { evaluate, buildContext, filterFegyverRules } from './reactive';
import type { Rule } from './reactive';

describe('evaluate', () => {
  it('evaluates a simple rule', () => {
    const rules: Rule[] = [{ id: 'result', formula: 'a + b', inputs: ['a', 'b'] }];
    const ctx = new Map([['a', 3], ['b', 7]]);
    const results = evaluate(rules, ctx);
    expect(results.get('result')).toBe(10);
  });

  it('resolves dependencies in order', () => {
    const rules: Rule[] = [
      { id: 'sum', formula: 'a + b', inputs: ['a', 'b'] },
      { id: 'double', formula: 'sum * 2', inputs: ['sum'] },
    ];
    const ctx = new Map([['a', 2], ['b', 3]]);
    const results = evaluate(rules, ctx);
    expect(results.get('sum')).toBe(5);
    expect(results.get('double')).toBe(10);
  });

  it('handles unresolvable rules gracefully', () => {
    const rules: Rule[] = [{ id: 'x', formula: 'missing + 1', inputs: ['missing'] }];
    const ctx = new Map<string, number>();
    const results = evaluate(rules, ctx);
    expect(results.has('x')).toBe(false);
  });
});

describe('buildContext', () => {
  it('maps tulajdonságok with prefix', () => {
    const ctx = buildContext({ erő: 5, ügyesség: 3 }, 4, {
      harcérték_alap: { KÉ: 10 }, kp: { per_tsz: 50 }, arányok: { hm_limit: 60 },
    });
    expect(ctx.get('tulajdonságok.erő')).toBe(5);
    expect(ctx.get('tulajdonságok.ügyesség')).toBe(3);
    expect(ctx.get('tsz')).toBe(4);
    expect(ctx.get('konstansok.harcérték_alap.KÉ')).toBe(10);
    expect(ctx.get('konstansok.kp.per_tsz')).toBe(50);
  });

  it('includes extras', () => {
    const ctx = buildContext({}, 1, { harcérték_alap: {}, kp: {}, arányok: {} }, { bonus: 42 });
    expect(ctx.get('bonus')).toBe(42);
  });
});

describe('filterFegyverRules', () => {
  it('filters only fegyver-specific rules', () => {
    const rules: Rule[] = [
      { id: 'fegyver_TÉ', formula: 'x', inputs: ['x'] },
      { id: 'alap_KÉ', formula: 'y', inputs: ['y'] },
      { id: 'fegyver_SP', formula: 'z', inputs: ['z'] },
    ];
    const filtered = filterFegyverRules(rules);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['fegyver_TÉ', 'fegyver_SP']);
  });
});
