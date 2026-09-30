import { describe, it, expect } from 'vitest';
import type { Karakter, TavfegyverAlap } from '../../engine/types';
import { calcLöveskitérésCélszám, calcAkrobatikaÉrték, weaponToLöveskitérésKategória, osztóToLöveskitérésKategória, tavHatótáv } from './helpers';

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

  it('clamps to the easiest (last) row beyond the table max - out-of-range is decided by Hatótáv, not here', () => {
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
    expect(weaponToLöveskitérésKategória(def({ név: 'Kharei nyílpuska', Osztó: 4, harcmodor: 'Lövészet' }))).toBe('íjak');
    expect(weaponToLöveskitérésKategória(def({ név: 'Tőr', Osztó: 2, harcmodor: 'Hajítás' }))).toBe('korlátosan_alkalmas');
    expect(weaponToLöveskitérésKategória(def({ név: 'Nyílpuska', Osztó: 5, harcmodor: 'Lövészet' }))).toBe('nyílpuskák');
  });
  it('maps mágikus by Osztó (Mágiatáv I Osztó 1 → nem_alkalmas_tárgyak)', () => {
    expect(weaponToLöveskitérésKategória(def({ név: 'Mágiatáv I', Osztó: 1, kategória: 'mágikus' }))).toBe('nem_alkalmas_tárgyak');
    expect(weaponToLöveskitérésKategória(def({ név: 'Mágiatáv IV', Osztó: 4, kategória: 'mágikus' }))).toBe('íjak');
  });
});

describe('tavHatótáv', () => {
  const def = (p: Partial<TavfegyverAlap>) => p as TavfegyverAlap;
  it('fix hatótáv (erő_szorzó 0) → a bázis', () => {
    expect(tavHatótáv(def({ hatótáv_bázis: 50, hatótáv_erő_szorzó: 0 }))).toBe(50);
    expect(tavHatótáv(def({ hatótáv_bázis: 120, hatótáv_erő_szorzó: 0 }))).toBe(120);
  });
  it('Erő-függő (erő_szorzó > 0) → Infinity (támadó Ereje ismeretlen → nincs range-gát)', () => {
    expect(tavHatótáv(def({ hatótáv_bázis: 20, hatótáv_erő_szorzó: 5 }))).toBe(Infinity);
    expect(tavHatótáv(def({ hatótáv_bázis: 5, hatótáv_erő_szorzó: 1 }))).toBe(Infinity);
  });
  it('bázis 0 → Infinity (pl. Mágiatáv: nincs range-korlát)', () => {
    expect(tavHatótáv(def({ hatótáv_bázis: 0, hatótáv_erő_szorzó: 0 }))).toBe(Infinity);
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
