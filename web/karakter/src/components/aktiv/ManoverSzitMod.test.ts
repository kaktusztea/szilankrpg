import { describe, it, expect } from 'vitest';
import { calcSzitModÖsszeg } from '../tulajdonsagok/kepzettseg-proba-calc';
import { szitModSentinelLehetetlen, szitModSentinelExtraId, szitModÁllapot, szitTáblákMódszerint } from './manover-dobas-calc';
import type { ModositoTabla, GameData } from '../../engine/data-types';

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

/**
 * Passzív letilt (immunis) sentinel (konstansok.yaml → manőver.sentinel_immunis = -99):
 * a fegyver a manőverre immunis (pl. Fegyvertörés-immunis) → a passzív félnek automatikus siker.
 * Ugyanazzal a detektorral fogható, mint a 99, csak a passzív táblákra és fordított kimenettel
 * (a popup a `szitImmunis` ágon a manőver-siker gombot rejti el, nem dob +érték bónuszt).
 */
describe('szitModSentinelLehetetlen (immunis -99 sentinel)', () => {
  const IMMUNIS = -99;
  const passzívTábla: ModositoTabla[] = [
    { kategória: 'A te fegyvered (törés ellen)', mód_oldal: 'passzív', mód: 'single', sorok: [
      { érték: IMMUNIS, leírás: 'Fegyver extra: Fegyvertörés-immunis', feltétel: 'fegyver_extra:fegyvertores_immunis' },
      { érték: -2, leírás: 'Fegyver extra: Lefegyverezhetőbb', feltétel: 'fegyver_extra:lefegyverezhetobb' },
    ] },
  ];

  it('az immunis sor kiválasztva → true (biztos védés a passzív félnek)', () => {
    expect(szitModSentinelLehetetlen(passzívTábla, { 'A te fegyvered (törés ellen)': 0 }, {}, IMMUNIS)).toBe(true);
  });

  it('a sima -2 sor kiválasztva → false (az dobásmódosító, nem sentinel)', () => {
    expect(szitModSentinelLehetetlen(passzívTábla, { 'A te fegyvered (törés ellen)': 1 }, {}, IMMUNIS)).toBe(false);
  });

  it('a -2 dobásmódosító NEM keverhető az immunis detektálással (külön sentinel-érték)', () => {
    // A -2-es sor valós dobásmódosító, az immunis sentinel -99 - a kettő nem ütközik.
    expect(calcSzitModÖsszeg(passzívTábla, { 'A te fegyvered (törés ellen)': 1 }, {}, [])).toBe(-2);
  });

  it('szitModSentinelExtraId: a kiválasztott immunis sor extra-id-je', () => {
    expect(szitModSentinelExtraId(passzívTábla, { 'A te fegyvered (törés ellen)': 0 }, {}, IMMUNIS))
      .toBe('fegyvertores_immunis');
  });

  it('szitModSentinelExtraId: nem-immunis sor kiválasztva → null', () => {
    expect(szitModSentinelExtraId(passzívTábla, { 'A te fegyvered (törés ellen)': 1 }, {}, IMMUNIS))
      .toBeNull();
  });
});

/**
 * szitTáblákMódszerint: a mód szerint szűri a táblákat (aktív = aktív-oldali + globális;
 * passzív = passzív-oldali). Regresszió: passzív extrák csak passzív módban, globálisok csak aktívban.
 */
describe('szitTáblákMódszerint', () => {
  const aktívTábla: ModositoTabla = { kategória: 'Fegyver', mód: 'single', sorok: [{ érték: 2, leírás: 'A' }] };
  const passzívTábla: ModositoTabla = { kategória: 'Törés ellen', mód_oldal: 'passzív', mód: 'single', sorok: [{ érték: -2, leírás: 'B' }] };
  const globális: ModositoTabla = { kategória: 'Körülmények', mód: 'single', sorok: [{ érték: 3, leírás: 'KM' }] };
  const data = { konstansok: { manőver: { globális_módosítók: [globális] } } } as unknown as GameData;

  it('aktív mód → aktív-oldali táblák + globálisok', () => {
    const r = szitTáblákMódszerint([aktívTábla, passzívTábla], 'aktív', data);
    expect(r.map(t => t.kategória)).toEqual(['Fegyver', 'Körülmények']);
  });
  it('passzív mód → csak a passzív-oldali táblák (globális nélkül)', () => {
    const r = szitTáblákMódszerint([aktívTábla, passzívTábla], 'passzív', data);
    expect(r.map(t => t.kategória)).toEqual(['Törés ellen']);
  });
  it('nincs helyzetfüggő módosító → aktívban csak a globálisok', () => {
    expect(szitTáblákMódszerint(undefined, 'aktív', data).map(t => t.kategória)).toEqual(['Körülmények']);
  });
});

/**
 * szitModÁllapot: egy helyen számol összeget + a két sentinel-ágat + az immunis-leírást.
 * A sentinelek data-driven (konstansok.yaml); a teszt-mock a kanonikus 99 / -99.
 */
describe('szitModÁllapot (orchestrator)', () => {
  const data = {
    konstansok: { manőver: { sentinel_nem_kísérelhető: 99, sentinel_immunis: -99 } },
    fegyverExtrák: { fegyvertores_immunis: { id: 'fegyvertores_immunis', név: 'Fegyvertörés-immunis', leírás: 'Hajlékony fegyver.' } },
  } as unknown as GameData;

  it('sima módosító → összeg, nincs sentinel', () => {
    const t: ModositoTabla[] = [{ kategória: 'X', mód: 'single', sorok: [{ érték: -2, leírás: 'a' }] }];
    expect(szitModÁllapot(t, { X: 0 }, {}, data)).toEqual({ összeg: -2, lehetetlen: false, immunis: false, immunisLeírás: '' });
  });
  it('99 sentinel → lehetetlen, összeg 0', () => {
    const t: ModositoTabla[] = [{ kategória: 'X', mód: 'single', sorok: [{ érték: 99, leírás: 'tilt' }] }];
    const r = szitModÁllapot(t, { X: 0 }, {}, data);
    expect(r.lehetetlen).toBe(true);
    expect(r.összeg).toBe(0);
  });
  it('-99 immunis sentinel → immunis + a katalógus-leírás feloldva', () => {
    const t: ModositoTabla[] = [{ kategória: 'X', mód_oldal: 'passzív', mód: 'single', sorok: [
      { érték: -99, leírás: 'Fegyver extra: Fegyvertörés-immunis', feltétel: 'fegyver_extra:fegyvertores_immunis' },
    ] }];
    const r = szitModÁllapot(t, { X: 0 }, {}, data);
    expect(r.immunis).toBe(true);
    expect(r.összeg).toBe(0);
    expect(r.immunisLeírás).toBe('Hajlékony fegyver.');
  });
});
