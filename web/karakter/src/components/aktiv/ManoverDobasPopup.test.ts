import { describe, it, expect } from 'vitest';
import { parseFázisok, fázisSikeres, rontottVFázis } from './manover-dobas-calc';
import type { FázisEredmény } from './manover-dobas-calc';

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

describe('rontottVFázis (sikertelen V → VÉ csökkentés, md/066_04)', () => {
  const P = (s: string) => parseFázisok(s);
  const E = (...e: FázisEredmény[]) => e;

  it('aktív mód, V rontott (nem), van V-dobás → true', () => {
    expect(rontottVFázis(P('M,V,E'), E('nem', 'nem', 'pending'), 'aktív', true)).toBe(true);
  });
  it('V talált (igen) → false', () => {
    expect(rontottVFázis(P('M,V,E'), E('nem', 'igen', 'pending'), 'aktív', true)).toBe(false);
  });
  it('nincs V-dobás → false (nincs k20 a VÉ-csökkentéshez)', () => {
    expect(rontottVFázis(P('M,V,E'), E('nem', 'nem', 'pending'), 'aktív', false)).toBe(false);
  });
  it('passzív mód → false (engem támadnak, nem én dobok V-t)', () => {
    expect(rontottVFázis(P('M,V,E'), E('nem', 'nem', 'pending'), 'passzív', true)).toBe(false);
  });
  it('nincs V fázis (csak E) → false', () => {
    expect(rontottVFázis(P('E'), E('nem'), 'aktív', true)).toBe(false);
  });
  it('rontott Megakasztás (M nem) NEM okoz VÉ-csökkentést, ha V nem fut (md/066_04 🔆)', () => {
    // M-only fázissor: a V hiányzik, így a rontott M-re sem jár VÉ-csökkentés.
    expect(rontottVFázis(P('M'), E('nem'), 'aktív', true)).toBe(false);
  });
});
