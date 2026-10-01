import { describe, it, expect } from 'vitest';
import type { Karakter, TavfegyverAlap } from '../../engine/types';
import { calcLöveskitérésCélszám, calcAkrobatikaÉrték, weaponToLöveskitérésKategória, osztóToLöveskitérésKategória, tavHatótáv, buildOpciók } from './loveskiteres-calc';

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

describe('buildOpciók', () => {
  const tf = (p: Partial<TavfegyverAlap>) => p as TavfegyverAlap;
  const tavfegyverek = [
    tf({ név: 'Hosszú íj', Osztó: 4 }),
    tf({ név: 'Hajítótőr', Osztó: 2 }),
    tf({ név: 'Parittya', Osztó: 3 }),        // maradék (nem kiemelt, nem mágikus)
    tf({ név: 'Mágiatáv I', Osztó: 1, kategória: 'mágikus' }),
    tf({ név: '🔆 Kő', Osztó: 2 }),           // improvizált
  ];

  it('kiemelt fegyverek a KIEMELT sorrendben, elöl', () => {
    const opciók = buildOpciók(tavfegyverek);
    const nevek = opciók.filter(o => !o.separator).map(o => o.név);
    // Hajítótőr a KIEMELT-ben Hosszú íj elé kerül (KIEMELT sorrend), nem ábécé szerint.
    expect(nevek.indexOf('Hajítótőr')).toBeLessThan(nevek.indexOf('Hosszú íj'));
    expect(nevek[0]).toBe('Hajítótőr');
  });

  it('kategóriát az Osztó adja (nem a harcmodor)', () => {
    const hosszúÍj = buildOpciók(tavfegyverek).find(o => o.név === 'Hosszú íj');
    expect(hosszúÍj?.kategória).toBe('íjak'); // Osztó 4
  });

  it('mágikus és maradék csoportok separatorral, improvizált a végén', () => {
    const opciók = buildOpciók(tavfegyverek);
    expect(opciók.some(o => o.separator)).toBe(true);
    // Az improvizált 🔆 tárgy a lista végén, Infinity hatótávval (nincs range-gát).
    const kő = opciók.find(o => o.név === '🔆 Kő');
    expect(kő?.hatótáv).toBe(Infinity);
    // A fix "🔆 Korlátosan alkalmas fegyver" gyűjtő-opció is jelen van.
    expect(opciók.some(o => o.név === '🔆 Korlátosan alkalmas fegyver')).toBe(true);
  });
});
