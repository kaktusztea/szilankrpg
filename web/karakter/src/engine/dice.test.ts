import { describe, it, expect } from 'vitest';
import { rollDie, rollK20, rollK10 } from './dice';

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
});
