import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeTÉ, computeVÉ, resolveNagyobbKisebb } from './shared';

describe('computeTÉ fuzz', () => {
  it('never throws and returns finite number', () => {
    fc.assert(fc.property(
      fc.integer({ min: -200, max: 200 }),
      fc.integer({ min: -100, max: 0 }),
      fc.integer({ min: -50, max: 50 }),
      fc.integer({ min: -20, max: 20 }),
      fc.integer({ min: 1, max: 5 }),
      fc.integer({ min: -30, max: 0 }),
      (base, levonás, taktika, fogás, támadások, többTám) => {
        const result = computeTÉ(base, levonás, taktika, fogás, támadások, többTám);
        expect(Number.isFinite(result)).toBe(true);
      }
    ), { numRuns: 200 });
  });

  it('többtám only applies when attacks > 1', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 200 }),
      fc.integer({ min: -30, max: 0 }),
      (base, többTám) => {
        const with1 = computeTÉ(base, 0, 0, 0, 1, többTám);
        const with2 = computeTÉ(base, 0, 0, 0, 2, többTám);
        expect(with1).toBe(base);
        expect(with2).toBe(base + többTám);
      }
    ), { numRuns: 50 });
  });
});

describe('computeVÉ fuzz', () => {
  it('result is always >= 0', () => {
    fc.assert(fc.property(
      fc.integer({ min: -100, max: 300 }),
      fc.integer({ min: -50, max: 50 }),
      fc.integer({ min: -100, max: 100 }),
      fc.integer({ min: 0, max: 200 }),
      (base, bónusz, taktika, csökkenés) => {
        const result = computeVÉ(base, bónusz, taktika, csökkenés);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 200 });
  });
});

describe('resolveNagyobbKisebb fuzz', () => {
  it('nagyobb always has >= pengehossz than kisebb', () => {
    fc.assert(fc.property(
      fc.float({ min: 0, max: 3, noNaN: true }),
      fc.float({ min: 0, max: 3, noNaN: true }),
      (jp, bp) => {
        const jobb = { Pengehossz: String(jp) };
        const bal = { Pengehossz: String(bp) };
        const result = resolveNagyobbKisebb(jobb, bal, { alap: 'J' }, { alap: 'B' });
        const nagyobbPenge = parseFloat(result.nagyobb.Pengehossz) || 0;
        const kisebbPenge = parseFloat(result.kisebb.Pengehossz) || 0;
        expect(nagyobbPenge).toBeGreaterThanOrEqual(kisebbPenge);
      }
    ), { numRuns: 100 });
  });
});
