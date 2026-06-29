import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateKarakter } from './validate';

describe('validateKarakter fuzz', () => {
  it('never throws on arbitrary objects', () => {
    fc.assert(fc.property(fc.anything(), (input) => {
      const result = validateKarakter(input);
      expect(typeof result).toBe('boolean');
    }), { numRuns: 300 });
  });

  it('accepts objects matching schema shape', () => {
    fc.assert(fc.property(
      fc.record({
        schema_version: fc.constant(2),
        név: fc.string(),
        tsz: fc.integer({ min: 1, max: 20 }),
        tulajdonságok: fc.dictionary(fc.string(), fc.integer()),
        képzettségek: fc.array(fc.record({ név: fc.string(), szint: fc.integer() })),
        fortélyok: fc.array(fc.record({ név: fc.string(), fok: fc.integer() })),
        fortélyok_speciális: fc.dictionary(fc.string(), fc.anything()),
        hátterek: fc.dictionary(fc.string(), fc.anything()),
        fegyverek: fc.array(fc.record({ alap: fc.string() })),
        páncél: fc.dictionary(fc.string(), fc.anything()),
        napló: fc.array(fc.string()),
      }),
      (obj) => {
        expect(validateKarakter(obj)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  it('rejects non-object primitives', () => {
    fc.assert(fc.property(
      fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
      (input) => {
        expect(validateKarakter(input)).toBe(false);
      }
    ), { numRuns: 50 });
  });
});
