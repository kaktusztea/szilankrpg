import { describe, it, expect } from 'vitest';
import { validateKarakter, isValidKarakter, sémaVerzióHiba, KARAKTER_SÉMA_VERZIÓ } from './validate';
import { validKarakter } from '../__tests__/karakter-fixture';

describe('validateKarakter', () => {
  const valid = validKarakter();

  it('accepts valid schema', () => {
    expect(validateKarakter(valid)).toEqual({ valid: true });
    expect(isValidKarakter(valid)).toBe(true);
  });
  it('rejects null', () => {
    const r = validateKarakter(null);
    expect(r.valid).toBe(false);
  });
  it('rejects wrong schema version', () => {
    const r = validateKarakter({ ...valid, schema_version: 1 });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toEqual([sémaVerzióHiba(1)]);   // csak a verzió-hiba, mező-lista nélkül
  });
  it('rejects missing top-level fields', () => {
    const { fortélyok, ...noFort } = valid;
    const r = validateKarakter(noFort);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toContain('fortélyok');
  });
  it('rejects missing session fields', () => {
    const { session, ...rest } = valid;
    const incomplete = { ...rest, session: { szilánk: 1 } };
    const r = validateKarakter(incomplete);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.missing).toContain('session.té_dobások');
  });
});

describe('sémaVerzióHiba', () => {
  it('aktuális verzió → null; eltérő → a felhasználói üzenet (3 sor)', () => {
    expect(sémaVerzióHiba(KARAKTER_SÉMA_VERZIÓ)).toBeNull();
    expect(sémaVerzióHiba(2)).toBe(`Betöltendő karakter séma verzió: v2\nAktuális verzió: v${KARAKTER_SÉMA_VERZIÓ}\nElavult verzió, kreáld újra a karaktert.`);
  });
});
