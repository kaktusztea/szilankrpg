import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evalFormula, resolveSum, resolveSumWhere, resolveCount } from './reactive-parse';
import type { Context, ArrayContext, StringContext } from './reactive';

const makeCtx = (entries: Record<string, number> = {}): Context => new Map(Object.entries(entries));
const makeArrays = (entries: Record<string, Record<string, number | string>[]> = {}): ArrayContext => new Map(Object.entries(entries));
const makeStr = (entries: Record<string, string> = {}): StringContext => new Map(Object.entries(entries));

describe('evalFormula fuzz', () => {
  it('never throws on arbitrary arithmetic strings', () => {
    fc.assert(fc.property(fc.string(), (formula) => {
      // Should never throw — may return 0 or any number for invalid input
      expect(() => evalFormula(formula, makeCtx(), new Map(), makeArrays(), makeStr())).not.toThrow();
    }), { numRuns: 200 });
  });

  it('never throws with random context values', () => {
    fc.assert(fc.property(
      fc.dictionary(fc.string({ minLength: 1, maxLength: 8, unit: fc.constantFrom(...'abcdefghőúü_'.split('')) }), fc.integer({ min: -1000, max: 1000 })),
      (dict) => {
        const ctx = makeCtx(dict);
        const keys = Object.keys(dict);
        if (keys.length >= 2) {
          const formula = `${keys[0]} + ${keys[1]}`;
          const result = evalFormula(formula, ctx, new Map(), makeArrays(), makeStr());
          expect(typeof result).toBe('number');
        }
      }
    ), { numRuns: 100 });
  });

  it('arithmetic is consistent: a + b = b + a', () => {
    fc.assert(fc.property(fc.integer({ min: -10000, max: 10000 }), fc.integer({ min: -10000, max: 10000 }), (a, b) => {
      const ctx1 = makeCtx({ a, b });
      const ctx2 = makeCtx({ a, b });
      expect(evalFormula('a + b', ctx1, new Map(), makeArrays(), makeStr()))
        .toBe(evalFormula('b + a', ctx2, new Map(), makeArrays(), makeStr()));
    }), { numRuns: 100 });
  });

  it('floor always returns integer', () => {
    fc.assert(fc.property(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: 1, max: 100 }), (a, b) => {
      const ctx = makeCtx({ a, b });
      const result = evalFormula('floor(a / b)', ctx, new Map(), makeArrays(), makeStr());
      expect(Number.isInteger(result)).toBe(true);
    }), { numRuns: 100 });
  });
});

describe('resolveSum fuzz', () => {
  it('sum equals manual reduce for any array', () => {
    fc.assert(fc.property(
      fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 0, maxLength: 50 }),
      (values) => {
        const arrays = makeArrays({ items: values.map(v => ({ val: v })) });
        const result = Number(resolveSum('sum(items, val)', arrays));
        expect(result).toBe(values.reduce((s, v) => s + v, 0));
      }
    ), { numRuns: 100 });
  });
});

describe('resolveSumWhere fuzz', () => {
  it('sum_where with filter matches manual filter+sum', () => {
    fc.assert(fc.property(
      fc.array(fc.record({ val: fc.integer({ min: -100, max: 100 }), cat: fc.constantFrom(1, 2, 3) }), { minLength: 0, maxLength: 30 }),
      (items) => {
        const arrays = makeArrays({ arr: items });
        const result = Number(resolveSumWhere('sum_where(arr, val, cat, 2)', arrays));
        const expected = items.filter(i => i.cat === 2).reduce((s, i) => s + i.val, 0);
        expect(result).toBe(expected);
      }
    ), { numRuns: 100 });
  });
});

describe('resolveCount fuzz', () => {
  it('count matches array length', () => {
    fc.assert(fc.property(
      fc.array(fc.record({ x: fc.integer() }), { minLength: 0, maxLength: 100 }),
      (items) => {
        const arrays = makeArrays({ arr: items });
        expect(Number(resolveCount('count(arr)', arrays))).toBe(items.length);
      }
    ), { numRuns: 100 });
  });
});
