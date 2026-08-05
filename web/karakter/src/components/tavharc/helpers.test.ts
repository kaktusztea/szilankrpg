import { describe, it, expect } from 'vitest';
import type { Karakter, Session, TavharcSzorzok } from '../../engine/types';
import {
  calcCÉ, calcVÉ, calcSzorzóÖsszeg, calcÚjratöltésEnyhítés, calcTámadásLabel,
  type SzorzóState,
} from './helpers';

describe('calcCÉ', () => {
  it('sums every input component', () => {
    expect(calcCÉ({
      céAlap: 10, önuralom: 3, CM: 2, harcmodorCÉ: -1,
      fegyverCÉ: 4, mfCÉ: 1, idea: 2, fortélyCÉ: 5,
    })).toBe(26);
  });
});

describe('calcVÉ', () => {
  it('multiplies cell by the multiplier when szorzóÖsszeg >= 1', () => {
    expect(calcVÉ(3, 5)).toBe(15);
    expect(calcVÉ(1, 5)).toBe(5); // boundary: exactly 1 → multiply
  });

  it('subtracts |szorzóÖsszeg| from cell when below 1', () => {
    expect(calcVÉ(0, 5)).toBe(5);
    expect(calcVÉ(-2, 5)).toBe(3);
    expect(calcVÉ(0.5, 5)).toBe(4.5);
  });
});

describe('calcSzorzóÖsszeg', () => {
  const szorzok = {
    célpont_mozgás: [{ id: 1, szorzó: 2 }],
    lövész_mozgás: [{ id: 1, szorzó: -1 }],
    célpont_méret: [{ id: 1, szorzó: 1 }],
    észlelhetőség: [{ id: 1, szorzó: 3 }],
    szél: [{ id: 1, szorzó: -2 }],
  } as unknown as TavharcSzorzok;

  it('adds the matching entry from each category', () => {
    const state: SzorzóState = { célMozgásId: 1, lövészMozgásId: 1, méretId: 1, észlelhetőségId: 1, szélId: 1 };
    expect(calcSzorzóÖsszeg(szorzok, state)).toBe(2 - 1 + 1 + 3 - 2);
  });

  it('treats an unmatched id as 0', () => {
    const state: SzorzóState = { célMozgásId: 99, lövészMozgásId: 99, méretId: 99, észlelhetőségId: 99, szélId: 99 };
    expect(calcSzorzóÖsszeg(szorzok, state)).toBe(0);
  });
});

describe('calcÚjratöltésEnyhítés', () => {
  const withFortély = (fok: number) => ({ fortélyok: [{ név: 'Nyílpuska újratöltés fejlesztése', fok }] }) as unknown as Karakter;

  it('is 0 when the reload situation is not active', () => {
    const session = { aktív_helyzetek: [] } as unknown as Session;
    expect(calcÚjratöltésEnyhítés(session, withFortély(3))).toBe(0);
  });

  it('returns the fortély fok when the reload situation is active', () => {
    const session = { aktív_helyzetek: ['Nyílpuska újratöltés'] } as unknown as Session;
    expect(calcÚjratöltésEnyhítés(session, withFortély(3))).toBe(3);
  });

  it('is 0 when active but the fortély is missing', () => {
    const session = { aktív_helyzetek: ['Nyílpuska újratöltés'] } as unknown as Session;
    expect(calcÚjratöltésEnyhítés(session, { fortélyok: [] } as unknown as Karakter)).toBe(0);
  });
});

describe('calcTámadásLabel', () => {
  const base = { harcmodorSzint: 4, gyorsaság: 2, sebesség: 3, újratöltésEnyhítés: 0, alapTámadás: '1/2x' };

  it('normal case: 1 + floor(harckeret / sebesség)', () => {
    // harckeret = 4 + 2 = 6, sebesség 3 → 1 + 2 = 3
    expect(calcTámadásLabel(base)).toBe('3x');
  });

  it('harckeret <= 0 → 1x', () => {
    expect(calcTámadásLabel({ ...base, harcmodorSzint: 0, gyorsaság: 0 })).toBe('1x');
  });

  it('sebesség <= 0 without reload help → falls back to alapTámadás', () => {
    expect(calcTámadásLabel({ ...base, sebesség: 0, újratöltésEnyhítés: 0 })).toBe('1/2x');
  });

  it('sebesség <= 0 with reload help (>=1) → 1x', () => {
    expect(calcTámadásLabel({ ...base, sebesség: 0, újratöltésEnyhítés: 1 })).toBe('1x');
  });
});
