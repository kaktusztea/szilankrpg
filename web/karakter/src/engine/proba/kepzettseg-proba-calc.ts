import type { Tulajdonsagok, Fortely } from '../types';
import type { KiterjesztesEntry } from '../data-loader';
import type { ModositoTabla, ModositoSor, PróbaEnyhítés, PróbaKonstansok } from '../data-types';
import { PRÓBA_IMMUNITÁS_KÜSZÖB } from '../../ui-constants';
import { helyettesítésSzint } from './proba-common';

/**
 * Képzettségpróba tiszta kalkulációs logika (§37.2) - a popup UI nélkül,
 * hogy tesztelhető és a Misztikus/Tulajdonságok screen-ekből is használható legyen.
 */

export const MIND_TULAJDONSÁG: (keyof Tulajdonsagok)[] = [
  'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység',
];

/** Fortély-id → felvett (max) fok. Többszörös fortélynél a legmagasabb példány foka. */
export function buildFortélyFokok(fortélyok: Fortely[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const f of fortélyok) m[f.id] = Math.max(m[f.id] ?? 0, f.fok);
  return m;
}

/** Kiterjesztés-negálás kulcs egy (képzettség, kiterjesztő fortély) párra. */
export function negálásKulcs(képzettségNév: string, fortélyNév: string): string {
  return `${képzettségNév}|${fortélyNév}`;
}

/**
 * Egy kiterjesztő fortély EFFEKTÍV foka egy adott képzettségnél, a manuális negálást
 * figyelembe véve.
 * - Nem negált (auto): a valós felvett fok (`fortélyFokok`).
 * - Negált: az automatikus „legalább 1× felvéve?" kiértékelés ellentettje →
 *   felvéve (>0) → 0 (mintha hiányozna); hiányzik (0) → 1 (mintha 1. fokon meglenne).
 * A negálás csak többszörösen felvehető fortélyoknál értelmezett (a hívó `többszörösNevek`-kel szűr).
 */
export function effektívKiterjesztésFok(
  fortélyFokok: Record<string, number>,
  képzettségNév: string,
  fortélyNév: string,
  negáltKulcsok: ReadonlySet<string>,
): number {
  const auto = fortélyFokok[fortélyNév] ?? 0;
  if (!negáltKulcsok.has(negálásKulcs(képzettségNév, fortélyNév))) return auto;
  return auto > 0 ? 0 : 1;
}

/**
 * A `fortélyFokok` map egy adott képzettséghez igazított („effektív") változata: a képzettség
 * kiterjesztő fortélyainál a negálást alkalmazza. A calc (`calcMultiKiterjesztésMod`) ezt kapja,
 * így a manuális felülbírálás VALÓDI (nem csak színez).
 */
export function effektívFortélyFokok(
  fortélyFokok: Record<string, number>,
  képzettségNév: string,
  kitek: KiterjesztesEntry[],
  negáltKulcsok: ReadonlySet<string>,
): Record<string, number> {
  const eff = { ...fortélyFokok };
  for (const k of kitek) {
    eff[k.fortély] = effektívKiterjesztésFok(fortélyFokok, képzettségNév, k.fortély, negáltKulcsok);
  }
  return eff;
}

/** Static extension modifier constants (konstansok.próba.képzettség.kiterjesztés_*). */
export interface KiterjesztésKonstansok { hiány: number; fokbónusz: number }

/**
 * Képzettség-kiterjesztés fok → static modifier on the skill check (md/030_08_01).
 * Normál 0.fok: -hiány. Erős 0.fok: not rollable. 1.fok: +0, from 2.fok: +fokbónusz per level.
 */
export function kiterjesztésMódosító(
  típus: 'normál' | 'erős', fok: number, k: KiterjesztésKonstansok,
): { mod: number; tiltott: boolean } {
  if (fok <= 0) return típus === 'erős' ? { mod: 0, tiltott: true } : { mod: -k.hiány, tiltott: false };
  return { mod: (fok - 1) * k.fokbónusz, tiltott: false };
}

/**
 * Combined static modifier of several extension fortélyok (md/030_08_01 "Speciális: Több fortély").
 * - Several missing Normál: the penalty does NOT stack.
 * - Any Erős missing (0.fok): not rollable.
 * - Bonus: the lowest one counts, unless that one is at its max level → the next higher counts.
 */
export function calcMultiKiterjesztésMod(
  selectedKits: KiterjesztesEntry[],
  fortélyFokok: Record<string, number>,
  k: KiterjesztésKonstansok,
): { mod: number; tiltott: boolean } {
  if (selectedKits.length === 0) return { mod: 0, tiltott: false };
  const fokOf = (e: KiterjesztesEntry) => fortélyFokok[e.fortély] ?? 0;
  if (selectedKits.length === 1) return kiterjesztésMódosító(selectedKits[0].típus, fokOf(selectedKits[0]), k);

  if (selectedKits.some(e => e.típus === 'erős' && fokOf(e) <= 0)) return { mod: 0, tiltott: true };
  if (selectedKits.some(e => e.típus === 'normál' && fokOf(e) <= 0)) return { mod: -k.hiány, tiltott: false };

  const bónuszok = selectedKits
    .map(e => ({ bónusz: (fokOf(e) - 1) * k.fokbónusz, maxolt: fokOf(e) >= e.maxfok }))
    .sort((a, b) => a.bónusz - b.bónusz);
  // The lowest counts, EXCEPT when it is maxed → the next one counts; all maxed → the highest.
  const első = bónuszok.find(b => !b.maxolt) ?? bónuszok[bónuszok.length - 1];
  return { mod: első.bónusz, tiltott: false };
}

/**
 * Egy szituációs módosító sor effektív értéke: a negatív értékeket a képzettséghez
 * tartozó próba-enyhítések csökkentik; az immunitás küszöböt elérő enyhítés kinullázza.
 * `immunis`: a UI ezt jelzi külön (áthúzott érték).
 */
export function enyhítettSorRészletes(
  próbaEnyhítések: PróbaEnyhítés[], kategória: string, sor: ModositoSor,
): { érték: number; immunis: boolean } {
  const raw = sor.érték;
  if (raw >= 0) return { érték: raw, immunis: false };
  const enyhítés = próbaEnyhítések
    .filter(e => e.kategória === kategória && (e.sorok.length === 0 || e.sorok.includes(sor.leírás)))
    .reduce((max, e) => Math.max(max, e.érték), 0);
  if (enyhítés >= PRÓBA_IMMUNITÁS_KÜSZÖB) return { érték: 0, immunis: true };
  return { érték: Math.min(0, raw + enyhítés), immunis: false };
}

/** Egy szituációs módosító sor effektív értéke (lásd `enyhítettSorRészletes`). */
function enyhítettSor(próbaEnyhítések: PróbaEnyhítés[], kategória: string, sor: ModositoSor): number {
  return enyhítettSorRészletes(próbaEnyhítések, kategória, sor).érték;
}

/** A kiválasztott szituációs módosítók összege (single + multi táblák). */
export function calcSzitModÖsszeg(
  módosítóTáblák: ModositoTabla[],
  szitMods: Record<string, number>,
  multiMods: Record<string, boolean[]>,
  próbaEnyhítések: PróbaEnyhítés[],
): number {
  return módosítóTáblák.reduce((sum, t) => {
    if (t.mód === 'multi') {
      const flags = multiMods[t.kategória];
      if (!flags) return sum;
      return sum + t.sorok.reduce((s, sor, i) => s + (flags[i] ? enyhítettSor(próbaEnyhítések, t.kategória, sor) : 0), 0);
    }
    const idx = szitMods[t.kategória];
    if (idx == null || idx < 0) return sum;
    return sum + enyhítettSor(próbaEnyhítések, t.kategória, t.sorok[idx]);
  }, 0);
}

/**
 * A próbához adódó effektív képzettség szint: (saját vagy helyettesítő) szint
 * + vállalás + szituációs módosítók.
 */
export function calcEffSzint(
  szint: number,
  helyettesítőSzint: number | null,
  vállalás: number,
  szitModÖsszeg: number,
  helyettesítés: PróbaKonstansok['helyettesítés'],
): number {
  const bázis = helyettesítőSzint != null ? helyettesítésSzint(helyettesítőSzint, helyettesítés) : szint;
  return bázis + vállalás + szitModÖsszeg;
}

