import { describe, it, expect } from 'vitest';
import { validateKarakter } from './validate';

describe('validateKarakter', () => {
  const valid = {
    schema_version: 2,
    név: 'Teszt',
    tsz: 4,
    tulajdonságok: { erő: 3 },
    képzettségek: [],
    fortélyok: [],
    fortélyok_speciális: {},
    hátterek: {},
    fegyverek: [],
    páncél: {},
    napló: [],
  };

  it('accepts valid schema', () => {
    expect(validateKarakter(valid)).toBe(true);
  });
  it('rejects null', () => {
    expect(validateKarakter(null)).toBe(false);
  });
  it('rejects wrong schema version', () => {
    expect(validateKarakter({ ...valid, schema_version: 1 })).toBe(false);
  });
  it('rejects missing fields', () => {
    const { fortélyok, ...noFort } = valid;
    expect(validateKarakter(noFort)).toBe(false);
  });
});
