import { describe, it, expect } from 'vitest';
import { toggleHelyzet, GYENGÉBB_KÉZ } from './helyzet-toggle';

describe('toggleHelyzet', () => {
  it('bekapcsol, ha nincs benne', () => {
    expect(toggleHelyzet([], GYENGÉBB_KÉZ)).toEqual([GYENGÉBB_KÉZ]);
  });

  it('kikapcsol, ha benne van', () => {
    expect(toggleHelyzet([GYENGÉBB_KÉZ], GYENGÉBB_KÉZ)).toEqual([]);
  });

  it('más helyzeteket érintetlenül hagy be-/kikapcsoláskor', () => {
    expect(toggleHelyzet(['Roham'], GYENGÉBB_KÉZ)).toEqual(['Roham', GYENGÉBB_KÉZ]);
    expect(toggleHelyzet(['Roham', GYENGÉBB_KÉZ], GYENGÉBB_KÉZ)).toEqual(['Roham']);
  });

  it('nem hoz létre duplikátumot (idempotens bekapcsolás eltávolít)', () => {
    // Ha valahogy már kétszer szerepelne, a kikapcsolás MINDET eltávolítja.
    expect(toggleHelyzet([GYENGÉBB_KÉZ, GYENGÉBB_KÉZ], GYENGÉBB_KÉZ)).toEqual([]);
  });
});
