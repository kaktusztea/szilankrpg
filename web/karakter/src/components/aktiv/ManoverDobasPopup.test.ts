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
  it('parses "E (M*)" → [M, E] (M is present in string)', () => {
    expect(parseFázisok('E (M*)')).toEqual(['M', 'E']);
  });
  it('parses "E" → [E]', () => {
    expect(parseFázisok('E')).toEqual(['E']);
  });
});

describe('fázisSikeres', () => {
  it('M: "nem" (miss) = manőver continues (sikeres)', () => {
    expect(fázisSikeres('M', 'nem', 'aktív')).toBe(true);
  });
  it('M: "igen" (hit) = manőver fails', () => {
    expect(fázisSikeres('M', 'igen', 'aktív')).toBe(false);
  });
  it('V: "igen" (hit) = manőver continues', () => {
    expect(fázisSikeres('V', 'igen', 'aktív')).toBe(true);
  });
  it('V: "nem" (miss) = manőver fails', () => {
    expect(fázisSikeres('V', 'nem', 'aktív')).toBe(false);
  });
  it('E: "igen" (reached) = manőver succeeds', () => {
    expect(fázisSikeres('E', 'igen', 'aktív')).toBe(true);
  });
  it('E: "nem" (not reached) = manőver fails', () => {
    expect(fázisSikeres('E', 'nem', 'aktív')).toBe(false);
  });
  it('pending = always false', () => {
    expect(fázisSikeres('M', 'pending', 'aktív')).toBe(false);
    expect(fázisSikeres('V', 'pending', 'aktív')).toBe(false);
    expect(fázisSikeres('E', 'pending', 'aktív')).toBe(false);
  });
});
