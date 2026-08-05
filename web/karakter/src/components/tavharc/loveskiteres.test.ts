import { describe, it, expect } from 'vitest';
import type { Karakter } from '../../engine/types';
import { calcLöveskitérésCélszám, calcAkrobatikaÉrték, defaultLöveskitérésKategória } from './helpers';

// Íjak tábla (md/073): 5m→21, 10m→18, 15m→15, 20m→12, 25m→9
const íjak = [
  { max_táv: 5, célszám: 21 },
  { max_táv: 10, célszám: 18 },
  { max_táv: 15, célszám: 15 },
  { max_táv: 20, célszám: 12 },
  { max_táv: 25, célszám: 9 },
];

describe('calcLöveskitérésCélszám', () => {
  it('returns the first row where távolság <= max_táv (closer = higher)', () => {
    expect(calcLöveskitérésCélszám(íjak, 1)).toBe(21);
    expect(calcLöveskitérésCélszám(íjak, 5)).toBe(21);   // boundary
    expect(calcLöveskitérésCélszám(íjak, 6)).toBe(18);
    expect(calcLöveskitérésCélszám(íjak, 25)).toBe(9);
  });

  it('returns null beyond the maximum range (hatótávon kívül)', () => {
    expect(calcLöveskitérésCélszám(íjak, 26)).toBeNull();
  });

  it('returns null for a missing table', () => {
    expect(calcLöveskitérésCélszám(undefined, 3)).toBeNull();
  });
});

describe('calcAkrobatikaÉrték', () => {
  const base = (fortélyok: { név: string }[]) => ({
    képzettségek: [{ név: 'Akrobatika', szint: 4 }],
    tulajdonságok: { gyorsaság: 3 },
    fortélyok,
  }) as unknown as Karakter;

  it('sums Akrobatika + Gyorsaság', () => {
    expect(calcAkrobatikaÉrték(base([]))).toBe(7);
  });

  it('adds +2 with the Lövéskitérés fejlesztése fortély', () => {
    expect(calcAkrobatikaÉrték(base([{ név: 'Lövéskitérés fejlesztése' }]))).toBe(9);
  });

  it('treats missing Akrobatika as 0', () => {
    const k = { képzettségek: [], tulajdonságok: { gyorsaság: 2 }, fortélyok: [] } as unknown as Karakter;
    expect(calcAkrobatikaÉrték(k)).toBe(2);
  });
});

describe('defaultLöveskitérésKategória', () => {
  it('maps harcmodor to the incoming weapon category', () => {
    expect(defaultLöveskitérésKategória('Íjászat')).toBe('íjak');
    expect(defaultLöveskitérésKategória('Lövészet')).toBe('nyílpuskák');
    expect(defaultLöveskitérésKategória('Hajítás')).toBe('dobófegyverek');
    expect(defaultLöveskitérésKategória(undefined)).toBe('dobófegyverek');
  });
});
