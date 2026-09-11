import { describe, it, expect } from 'vitest';
import { parseFázisok, fázisSikeres } from './ManoverDobasPopup';
import type { FázisEredmény } from './ManoverDobasPopup';

describe('parseFázisok', () => {
  it('parses "M,V,E" → [M, V, E]', () => {
    expect(parseFázisok('M,V,E')).toEqual(['M', 'V', 'E']);
  });
  it('parses "V,E" → [V, E]', () => {
    expect(parseFázisok('V,E')).toEqual(['V', 'E']);
  });
  it('parses "E (M*)" → [E, M] (megőrzi a stringbeli sorrendet, * eldobva)', () => {
    expect(parseFázisok('E (M*)')).toEqual(['E', 'M']);
  });
  it('parses "M*,E" → [M, E]', () => {
    expect(parseFázisok('M*,E')).toEqual(['M', 'E']);
  });
  it('parses "E" → [E]', () => {
    expect(parseFázisok('E')).toEqual(['E']);
  });
});

describe('fázisSikeres', () => {
  it('ellenfél akaszt: "nem" (elhibázta) = manőver siker', () => {
    expect(fázisSikeres('nem', 'ellenfél')).toBe(true);
  });
  it('ellenfél akaszt: "igen" (talált) = manőver kudarc', () => {
    expect(fázisSikeres('igen', 'ellenfél')).toBe(false);
  });
  it('én cselekvő (Távoltartás-M / V / E): "igen" (talált/elért) = siker', () => {
    expect(fázisSikeres('igen', 'én')).toBe(true);
  });
  it('én cselekvő: "nem" = kudarc', () => {
    expect(fázisSikeres('nem', 'én')).toBe(false);
  });
  it('pending = mindig false', () => {
    expect(fázisSikeres('pending', 'ellenfél')).toBe(false);
    expect(fázisSikeres('pending', 'én')).toBe(false);
  });
});
