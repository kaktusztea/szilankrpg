import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { interpolateFokDef } from './taktika-helpers';

describe('interpolateFokDef fuzz', () => {
  it('interpolated values scale linearly', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 5 }),
      fc.integer({ min: -20, max: -1 }),
      fc.integer({ min: 1, max: 20 }),
      fc.integer({ min: 3, max: 10 }),
      (baseFok, téPerFok, véPerFok, targetFok) => {
        const fokok = [{ fok: baseFok, TÉ: téPerFok * baseFok, VÉ: véPerFok * baseFok }];
        if (targetFok === baseFok) return; // skip trivial case
        const result = interpolateFokDef(fokok, targetFok, true);
        if (result) {
          expect(result.fok).toBe(targetFok);
          // Should scale from last entry
          const expectedTÉ = Math.round((téPerFok * baseFok / baseFok) * targetFok);
          const expectedVÉ = Math.round((véPerFok * baseFok / baseFok) * targetFok);
          expect(result.TÉ).toBe(expectedTÉ);
          expect(result.VÉ).toBe(expectedVÉ);
        }
      }
    ), { numRuns: 100 });
  });

  it('never throws on empty fokok', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 20 }),
      fc.boolean(),
      (fok, hasBővítés) => {
        const result = interpolateFokDef([], fok, hasBővítés);
        expect(result).toBeUndefined();
      }
    ), { numRuns: 50 });
  });
});
