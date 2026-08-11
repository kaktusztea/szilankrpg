import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateKarakter, isValidKarakter } from './validate';

describe('validateKarakter fuzz', () => {
  it('never throws on arbitrary objects', () => {
    fc.assert(fc.property(fc.anything(), (input) => {
      const result = validateKarakter(input);
      expect(typeof result).toBe('object');
      expect('valid' in result).toBe(true);
    }), { numRuns: 300 });
  });

  it('rejects non-object primitives', () => {
    fc.assert(fc.property(
      fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
      (input) => {
        expect(isValidKarakter(input)).toBe(false);
      }
    ), { numRuns: 50 });
  });
});
