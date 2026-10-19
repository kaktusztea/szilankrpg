import { describe, it, expect } from 'vitest';
import { fegyverÁr } from './fegyver-ar-calc';

// A md/068_01_05 alapanyag + idea szorzó-táblái (a chip ezeket teszi az ár_alap-ra).
const K = {
  alapanyag_ár_szorzó: { fa: 0.1, kő: 0.1, acél: 1, bronz: 0.5, abbitacél: 10, mithrill: 100, feketeacél: 100, lunír: 100000 },
  ár_szorzó_idea: [
    { idea: -5, ár_szorzó: 0.05 },
    { idea: 0, ár_szorzó: 1 },
    { idea: 1, ár_szorzó: 2 },
    { idea: 3, ár_szorzó: 7 },
    { idea: 5, ár_szorzó: 13 },
  ],
};

describe('fegyverÁr', () => {
  it('hosszúkard: ár_alap 1 × acél × idea(0) = 1x (md kalibráció)', () => {
    expect(fegyverÁr(1, 'acél', 0, K)).toBe(1);
  });

  it('fa bot: ár_alap 2 × fa(0.1) × idea(0) = 0.2x', () => {
    expect(fegyverÁr(2, 'fa', 0, K)).toBeCloseTo(0.2);
  });

  it('mithrill kard: ár_alap 1 × mithrill(100) × idea(0) = 100x', () => {
    expect(fegyverÁr(1, 'mithrill', 0, K)).toBe(100);
  });

  it('Mara-sequor: ár_alap 1 × feketeacél(100) × idea(3→7) = 700x', () => {
    expect(fegyverÁr(1, 'feketeacél', 3, K)).toBe(700);
  });

  it('ár_alap null (fixed fegyver, nincs ár-modell) → null', () => {
    expect(fegyverÁr(null, 'acél', 0, K)).toBeNull();
  });

  it('ismeretlen anyag/idea → semleges 1 szorzó (elavult localStorage érték)', () => {
    expect(fegyverÁr(1, 'ismeretlen', 42, K)).toBe(1);
  });
});
