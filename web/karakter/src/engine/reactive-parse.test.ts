import { describe, it, expect } from 'vitest';
import { evalFormula, resolveSum, resolveSumLookup, resolveSumWhere, resolveCount, resolveLookup } from './reactive-parse';
import type { Context, ArrayContext, StringContext } from './reactive';

function makeCtx(entries: Record<string, number> = {}): Context {
  return new Map(Object.entries(entries));
}
function makeArrays(entries: Record<string, Record<string, number | string>[]> = {}): ArrayContext {
  return new Map(Object.entries(entries));
}
function makeStr(entries: Record<string, string> = {}): StringContext {
  return new Map(Object.entries(entries));
}

describe('resolveSum', () => {
  it('sums a field across array items', () => {
    const arrays = makeArrays({ items: [{ val: 3 }, { val: 7 }, { val: 2 }] });
    expect(resolveSum('sum(items, val)', arrays)).toBe('12');
  });
  it('returns 0 for empty array', () => {
    expect(resolveSum('sum(empty, x)', makeArrays())).toBe('0');
  });
});

describe('resolveSumLookup', () => {
  it('looks up values from a table and sums them', () => {
    const arrays = makeArrays({
      fegyverek: [{ típus: 'kard' }, { típus: 'balta' }],
      súlyok: [{ név: 'kard', súly: 2 }, { név: 'balta', súly: 5 }],
    });
    expect(resolveSumLookup('sum_lookup(fegyverek, típus, súlyok, név, súly)', arrays)).toBe('7');
  });
});

describe('resolveSumWhere', () => {
  it('sums only filtered items', () => {
    const arrays = makeArrays({ arr: [{ val: 10, cat: 1 }, { val: 20, cat: 2 }, { val: 5, cat: 1 }] });
    expect(resolveSumWhere('sum_where(arr, val, cat, 1)', arrays)).toBe('15');
  });
});

describe('resolveCount', () => {
  it('counts array length', () => {
    const arrays = makeArrays({ items: [{}, {}, {}] });
    expect(resolveCount('count(items)', arrays)).toBe('3');
  });
  it('returns 0 for missing array', () => {
    expect(resolveCount('count(missing)', makeArrays())).toBe('0');
  });
});

describe('resolveLookup', () => {
  it('finds value by numeric key', () => {
    const arrays = makeArrays({ tábla: [{ szint: 1, kp: 3 }, { szint: 2, kp: 8 }] });
    const ctx = makeCtx({ aktuális_szint: 2 });
    expect(resolveLookup('lookup(tábla, szint, aktuális_szint, kp)', ctx, new Map(), arrays, makeStr())).toBe('8');
  });
  it('finds value by string context', () => {
    const arrays = makeArrays({ tábla: [{ név: 'alma', érték: 42 }] });
    const strCtx = makeStr({ kulcs: 'alma' });
    expect(resolveLookup('lookup(tábla, név, kulcs, érték)', makeCtx(), new Map(), arrays, strCtx)).toBe('42');
  });
});

describe('evalFormula', () => {
  it('evaluates arithmetic', () => {
    expect(evalFormula('3 + 4 * 2', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(11);
  });
  it('resolves context variables', () => {
    const ctx = makeCtx({ erő: 5, ügyesség: 3 });
    expect(evalFormula('erő + ügyesség', ctx, new Map(), makeArrays(), makeStr())).toBe(8);
  });
  it('uses floor/ceil/min/max', () => {
    expect(evalFormula('floor(7 / 2)', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(3);
    expect(evalFormula('ceil(7 / 2)', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(4);
    expect(evalFormula('min(3, 7)', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(3);
    expect(evalFormula('max(3, 7)', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(7);
  });
  it('handles if()', () => {
    const ctx = makeCtx({ x: 5 });
    expect(evalFormula('if(x > 3, 10, 0)', ctx, new Map(), makeArrays(), makeStr())).toBe(10);
    expect(evalFormula('if(x > 10, 10, 0)', ctx, new Map(), makeArrays(), makeStr())).toBe(0);
  });
  it('uses results map', () => {
    const results = new Map([['alap_KÉ', 15]]);
    const ctx = makeCtx({ bónusz: 3 });
    expect(evalFormula('alap_KÉ + bónusz', ctx, results, makeArrays(), makeStr())).toBe(18);
  });
  it('returns 0 on invalid formula', () => {
    expect(evalFormula('???invalid!!!', makeCtx(), new Map(), makeArrays(), makeStr())).toBe(0);
  });
});
