import { describe, it, expect } from 'vitest';
import { calcSzitModÖsszeg } from '../tulajdonsagok/kepzettseg-proba-calc';
import { szitModSentinelLehetetlen } from './manover-dobas-calc';
import type { ModositoTabla } from '../../engine/data-types';

// A sentinel data-driven (konstansok.yaml → manőver.sentinel_nem_kísérelhető = 99); a tesztben literál.
const SENTINEL = 99;

/**
 * A Manőver dobás popup a képzettségpróba `calcSzitModÖsszeg` fn-jét használja
 * ÜRES próba-enyhítés listával (manőverhez nincs enyhítés). Ez az önteszt rögzíti,
 * hogy single + multi táblák összege enyhítés nélkül helyes.
 */
describe('manőver helyzetfüggő módosítók összege (enyhítés nélkül)', () => {
  const táblák: ModositoTabla[] = [
    { kategória: 'Fegyver', mód: 'single', sorok: [
      { érték: -2, leírás: 'Tőrkard' },
      { érték: 2, leírás: 'Zúzófegyver' },
    ] },
    { kategória: 'Körülmény', mód: 'multi', sorok: [
      { érték: -3, leírás: 'A' },
      { érték: 1, leírás: 'B' },
    ] },
  ];

  it('semmi kiválasztva → 0', () => {
    expect(calcSzitModÖsszeg(táblák, {}, { Körülmény: [false, false] }, [])).toBe(0);
  });

  it('single kiválasztás (Zúzófegyver +2) → 2', () => {
    expect(calcSzitModÖsszeg(táblák, { Fegyver: 1 }, { Körülmény: [false, false] }, [])).toBe(2);
  });

  it('multi két toggle (-3 + 1) + single (-2) → -4', () => {
    expect(calcSzitModÖsszeg(táblák, { Fegyver: 0 }, { Körülmény: [true, true] }, [])).toBe(-4);
  });

  it('negatív érték NEM enyhül üres enyhítés listával', () => {
    expect(calcSzitModÖsszeg(táblák, {}, { Körülmény: [true, false] }, [])).toBe(-3);
  });
});

/**
 * A 99 „nem kísérelhető meg" sentinel a dobó-oldali modellben JELZÉS, nem aritmetikai érték.
 * Regresszió: ha a 99-et vakon a dobáshoz adnánk, +99 bónusz = biztos siker lenne (az ellenkezője).
 */
describe('szitModSentinelLehetetlen (99 sentinel)', () => {
  const táblák: ModositoTabla[] = [
    { kategória: 'Saját fegyver alkalmassága', mód: 'single', sorok: [
      { érték: 2, leírás: 'Alkalmas' },
      { érték: -2, leírás: 'Nem alkalmas' },
      { érték: SENTINEL, leírás: 'Nem kísérelhető meg' },
    ] },
    { kategória: 'Egyéb', mód: 'multi', sorok: [
      { érték: 1, leírás: 'A' },
      { érték: SENTINEL, leírás: 'Tiltó' },
    ] },
  ];

  it('nincs 99 kiválasztva → false', () => {
    expect(szitModSentinelLehetetlen(táblák, { 'Saját fegyver alkalmassága': 0 }, { Egyéb: [true, false] }, SENTINEL)).toBe(false);
  });

  it('single: a 99-es sor kiválasztva → true', () => {
    expect(szitModSentinelLehetetlen(táblák, { 'Saját fegyver alkalmassága': 2 }, { Egyéb: [false, false] }, SENTINEL)).toBe(true);
  });

  it('multi: a 99-es sor bejelölve → true', () => {
    expect(szitModSentinelLehetetlen(táblák, { 'Saját fegyver alkalmassága': -1 }, { Egyéb: [false, true] }, SENTINEL)).toBe(true);
  });

  it('a 99 NEM adódik a dobás-összeghez (biztos-siker regresszió): a lehetetlen ág felel érte, nem az összeg', () => {
    // A popup: szitLehetetlen ? 0 : calcSzitModÖsszeg(...). Itt csak azt rögzítjük, hogy a sentinel
    // detektálható - a popup ennek alapján NEM dob (nem +99 bónuszt ad).
    expect(szitModSentinelLehetetlen(táblák, { 'Saját fegyver alkalmassága': 2 }, {}, SENTINEL)).toBe(true);
  });
});
