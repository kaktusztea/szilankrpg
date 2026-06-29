import { describe, it, expect } from 'vitest';
import { findMfFok, getMfBónusz } from './mf-utils';
import type { Karakter, FegyverAlap } from './types';

const karakter = {
  fortélyok: [
    { név: 'Mesterfegyver', fok: 2, spec_típus: '', spec_elem: 'Hosszúkard' },
    { név: 'Mesterfegyver', fok: 1, spec_típus: '', spec_elem: 'Rövidkard' },
  ],
} as unknown as Karakter;

const fegyverek: FegyverAlap[] = [
  { Fegyver: 'Hosszúkard (1K)', Alapnév: 'Hosszúkard' } as unknown as FegyverAlap,
  { Fegyver: 'Rövidkard', Alapnév: '' } as unknown as FegyverAlap,
];

describe('findMfFok', () => {
  it('finds by Alapnév', () => {
    expect(findMfFok(karakter, fegyverek, 'Hosszúkard (1K)')).toBe(2);
  });
  it('finds by Fegyver name directly', () => {
    expect(findMfFok(karakter, fegyverek, 'Rövidkard')).toBe(1);
  });
  it('returns 0 if not found', () => {
    expect(findMfFok(karakter, fegyverek, 'Buzogány')).toBe(0);
  });
});

describe('getMfBónusz', () => {
  const konstansok = {
    mesterfegyver_bónuszok: [
      { fok: 1, TÉ: 3, VÉ: 3, SP: 0 },
      { fok: 2, TÉ: 5, VÉ: 5, SP: 1 },
      { fok: 3, TÉ: 8, VÉ: 8, SP: 2 },
    ],
  };

  it('returns matching fok bonuses', () => {
    const result = getMfBónusz(konstansok, 2);
    expect(result.TÉ).toBe(5);
    expect(result.VÉ).toBe(5);
    expect(result.SP).toBe(1);
  });
  it('returns zeros for unknown fok', () => {
    expect(getMfBónusz(konstansok, 0)).toEqual({ TÉ: 0, VÉ: 0, SP: 0 });
  });
});
