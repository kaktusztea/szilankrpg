import { describe, it, expect } from 'vitest';
import { nextDuplicateName, generateIdLeíró } from './file-ops';

describe('nextDuplicateName', () => {
  it('first duplicate of a base name → v2', () => {
    expect(nextDuplicateName('Példa', ['Példa'])).toBe('Példa v2');
  });

  it('picks max existing vN + 1 when duplicating the base again', () => {
    // "Példa" and "Példa v2" already exist → duplicating "Példa" must yield v3, not v2
    expect(nextDuplicateName('Példa', ['Példa', 'Példa v2'])).toBe('Példa v3');
  });

  it('duplicating an already-suffixed name uses the same base', () => {
    expect(nextDuplicateName('Példa v2', ['Példa', 'Példa v2'])).toBe('Példa v3');
  });

  it('handles gaps / highest wins', () => {
    expect(nextDuplicateName('Példa', ['Példa', 'Példa v5'])).toBe('Példa v6');
  });

  it('base need not exist; only suffixed variants present', () => {
    expect(nextDuplicateName('Példa v3', ['Példa v3'])).toBe('Példa v4');
  });

  it('does not match a different base', () => {
    expect(nextDuplicateName('Példa', ['Példabeszéd v9'])).toBe('Példa v2');
  });
});

describe('generateIdLeíró', () => {
  it('slugifies the name (lowercase, spaces → dashes) and appends the tsz', () => {
    expect(generateIdLeíró('Von Agabor', 10)).toBe('von-agabor-10tsz');
  });

  it('collapses runs of whitespace into a single dash', () => {
    expect(generateIdLeíró('A  B\tC', 2)).toBe('a-b-c-2tsz');
  });

  it('falls back to "új-karakter" for an empty name', () => {
    expect(generateIdLeíró('', 3)).toBe('új-karakter-3tsz');
  });
});
