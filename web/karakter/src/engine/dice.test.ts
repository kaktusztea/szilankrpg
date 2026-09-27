import { describe, it, expect } from 'vitest';
import { rollDie, rollK20, rollK10, clampEHSzint, k20P } from './dice';

describe('dice', () => {
  it('rollDie stays within [1, sides]', () => {
    for (let i = 0; i < 1000; i++) {
      const r = rollDie(6);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
      expect(Number.isInteger(r)).toBe(true);
    }
  });

  it('rollK20 in [1, 20], rollK10 in [1, 10]', () => {
    for (let i = 0; i < 1000; i++) {
      const a = rollK20();
      const b = rollK10();
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(20);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(10);
    }
  });

  it('clampEHSzint a [-2, +2] tartományra szorít', () => {
    expect(clampEHSzint(0)).toBe(0);
    expect(clampEHSzint(2)).toBe(2);
    expect(clampEHSzint(-2)).toBe(-2);
    expect(clampEHSzint(5)).toBe(2);
    expect(clampEHSzint(-7)).toBe(-2);
  });

  it('k20P: 10/20 → 2, páratlan → 0, páros → 1 (harcszimulacio.spec.md §4)', () => {
    expect(k20P(10)).toBe(2);
    expect(k20P(20)).toBe(2);
    expect(k20P(5)).toBe(0);
    expect(k20P(19)).toBe(0);
    expect(k20P(16)).toBe(1);
    expect(k20P(2)).toBe(1);
  });
});
