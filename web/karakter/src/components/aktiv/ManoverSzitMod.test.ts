import { describe, it, expect } from 'vitest';
import { calcSzitModÖsszeg } from '../tulajdonsagok/kepzettseg-proba-calc';
import type { ModositoTabla } from '../../engine/data-types';

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
