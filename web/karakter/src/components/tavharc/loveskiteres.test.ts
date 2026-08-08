import { describe, it, expect } from 'vitest';
import type { Karakter, TavfegyverAlap } from '../../engine/types';
import { calcLöveskitérésCélszám, calcAkrobatikaÉrték, weaponToLöveskitérésKategória, osztóToLöveskitérésKategória, parseHatótáv } from './helpers';

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

  it('clamps to the easiest (last) row beyond the table max — out-of-range is decided by Hatótáv, not here', () => {
    expect(calcLöveskitérésCélszám(íjak, 26)).toBe(9);
    expect(calcLöveskitérésCélszám(íjak, 999)).toBe(9);
  });

  it('returns null for a missing/empty table', () => {
    expect(calcLöveskitérésCélszám(undefined, 3)).toBeNull();
    expect(calcLöveskitérésCélszám([], 3)).toBeNull();
  });
});

describe('osztóToLöveskitérésKategória', () => {
  it('maps Osztó → category (md/078)', () => {
    expect(osztóToLöveskitérésKategória(1)).toBe('nem_alkalmas_tárgyak');
    expect(osztóToLöveskitérésKategória(2)).toBe('korlátosan_alkalmas');
    expect(osztóToLöveskitérésKategória(3)).toBe('dobófegyverek');
    expect(osztóToLöveskitérésKategória(4)).toBe('íjak');
    expect(osztóToLöveskitérésKategória(5)).toBe('nyílpuskák');
    expect(osztóToLöveskitérésKategória(6)).toBe('nyílpuskák'); // ≥5 → nyílpuskák
    expect(osztóToLöveskitérésKategória(0)).toBeNull();
  });
});

describe('weaponToLöveskitérésKategória', () => {
  const def = (p: Partial<TavfegyverAlap>) => p as TavfegyverAlap;
  it('maps by Osztó, not harcmodor (e.g. Kharei nyílpuska Osztó 4 → íjak)', () => {
    expect(weaponToLöveskitérésKategória(def({ Fegyver: 'Kharei nyílpuska', Osztó: '4', Harcmodor: 'Lövészet' }))).toBe('íjak');
    expect(weaponToLöveskitérésKategória(def({ Fegyver: 'Tőr', Osztó: '2', Harcmodor: 'Hajítás' }))).toBe('korlátosan_alkalmas');
    expect(weaponToLöveskitérésKategória(def({ Fegyver: 'Nyílpuska', Osztó: '5', Harcmodor: 'Lövészet' }))).toBe('nyílpuskák');
  });
  it('maps mágikus by Osztó (Mágiatáv I Osztó 1 → nem_alkalmas_tárgyak)', () => {
    expect(weaponToLöveskitérésKategória(def({ Fegyver: 'Mágiatáv I', Osztó: '1', Kategória: 'mágikus' }))).toBe('nem_alkalmas_tárgyak');
    expect(weaponToLöveskitérésKategória(def({ Fegyver: 'Mágiatáv IV', Osztó: '4', Kategória: 'mágikus' }))).toBe('íjak');
  });
});

describe('parseHatótáv', () => {
  it('parses a plain "Nm" range', () => {
    expect(parseHatótáv('50m')).toBe(50);
    expect(parseHatótáv('120m')).toBe(120);
    expect(parseHatótáv('10')).toBe(10);
  });
  it('returns Infinity for Erő-based formulas (attacker Erő unknown → no range gate)', () => {
    expect(parseHatótáv('20m + (Erő x 5)')).toBe(Infinity);
    expect(parseHatótáv('5-10m + Erő')).toBe(Infinity);
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
