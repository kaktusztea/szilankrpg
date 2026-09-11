import type { Tulajdonsagok, Fortely } from '../../engine/types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, ModositoSor, PróbaEnyhítés } from '../../engine/data-types';
import { PRÓBA_IMMUNITÁS_KÜSZÖB } from '../../ui-constants';
import {
  probaLehetetlen as probaLehetetlenKözös,
  probaBiztosSiker as probaBiztosSikerKözös,
} from './proba-common';

/**
 * Képzettségpróba tiszta kalkulációs logika (§37.2) — a popup UI nélkül,
 * hogy tesztelhető és a Misztikus/Tulajdonságok screen-ekből is használható legyen.
 */

// Képzettségpróba célszámok (engine_spec §37.2, md/030_06_01) — elnevezés csak 21-ig.
export const NEHÉZSÉGEK: { érték: number; label: string }[] = [
  { érték: 6, label: 'Könnyű' },
  { érték: 9, label: 'Átlagos' },
  { érték: 12, label: 'Nehéz' },
  { érték: 15, label: 'N. nehéz' },
  { érték: 18, label: 'Rendkívüli' },
  { érték: 21, label: 'Emberfeletti' },
];
// 21 felett nincs elnevezés (max 30), a picker lenyitható részében jelenik meg.
export const NEHÉZSÉGEK_EXTRA = [24, 27, 30];

export const MIND_TULAJDONSÁG: (keyof Tulajdonsagok)[] = [
  'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység',
];

// Domináns tulajdonság display név (nagybetűs, pl. "Ügyesség") → séma kulcs (kisbetűs).
export function tulKulcs(display: string): keyof Tulajdonsagok {
  return display.toLowerCase() as keyof Tulajdonsagok;
}
export function tulLabel(kulcs: string): string {
  return kulcs.charAt(0).toUpperCase() + kulcs.slice(1);
}
function nehézségLabel(érték: number): string {
  return NEHÉZSÉGEK.find(n => n.érték === érték)?.label ?? '';
}
export function nehézségDisplay(érték: number): string {
  const l = nehézségLabel(érték);
  return l ? `${érték} (${l})` : `${érték}`;
}

/** Képzettségpróba lehetetlen: Tulajdonság + szint + max k10 (10) < célszám. */
export function probaLehetetlen(tulÉrték: number, szint: number, célszám: number): boolean {
  return probaLehetetlenKözös(tulÉrték + szint, 10, célszám);
}

/** Képzettségpróba biztos siker: Tulajdonság + szint + min k10 (1) ≥ célszám. */
export function probaBiztosSiker(tulÉrték: number, szint: number, célszám: number): boolean {
  return probaBiztosSikerKözös(tulÉrték + szint, célszám);
}

/** Fortély név → felvett (max) fok. Többszörös fortélynél a legmagasabb példány foka. */
export function buildFortélyFokok(fortélyok: Fortely[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const f of fortélyok) m[f.név] = Math.max(m[f.név] ?? 0, f.fok);
  return m;
}

/**
 * Képzettség-kiterjesztés fok → próba Előny/Hátrány szint (md/030_08_01).
 * Normál 0.fok: Hátrány-2. Erős 0.fok: nem dobható. 1.fok: 0, 2.fok: Előny+1, 3.fok: Előny+2.
 */
export function kiterjesztésElőnyHátrány(típus: 'normál' | 'erős', fok: number): { szint: number; tiltott: boolean } {
  if (fok <= 0) return típus === 'erős' ? { szint: 0, tiltott: true } : { szint: -2, tiltott: false };
  return { szint: Math.min(fok - 1, 2), tiltott: false };
}

/**
 * Több kiterjesztő fortély összesített Előny/Hátrány (md/030_08_01 "Speciális: Több fortély").
 * - Több hiányzó Normál: Hátrány-2 NEM halmozódik.
 * - Bármelyik Erős hiányzik (0.fok): tiltott.
 * - Előny: min(bónuszok), kivéve ha az alacsonyabb maxfokú → magasabb számít.
 */
export function calcMultiKiterjesztésEH(
  selectedKits: KiterjesztesEntry[],
  fortélyFokok: Record<string, number>,
): { szint: number; tiltott: boolean } {
  if (selectedKits.length === 0) return { szint: 0, tiltott: false };
  if (selectedKits.length === 1) {
    const k = selectedKits[0];
    return kiterjesztésElőnyHátrány(k.típus, fortélyFokok[k.fortély] ?? 0);
  }

  // Check erős tiltás
  for (const k of selectedKits) {
    if (k.típus === 'erős' && (fortélyFokok[k.fortély] ?? 0) <= 0) {
      return { szint: 0, tiltott: true };
    }
  }

  // Check normál hátrány (nem halmozódik)
  let vanHiányzóNormál = false;
  for (const k of selectedKits) {
    if (k.típus === 'normál' && (fortélyFokok[k.fortély] ?? 0) <= 0) {
      vanHiányzóNormál = true;
      break;
    }
  }
  if (vanHiányzóNormál) return { szint: -2, tiltott: false };

  // Előny kalkuláció: min(bónuszok), de ha alacsonyabb maxfokú → magasabb számít
  const bónuszok = selectedKits.map(k => {
    const fok = fortélyFokok[k.fortély] ?? 0;
    const bónusz = Math.min(fok - 1, 2); // 1.fok=0, 2.fok=1, 3.fok=2
    const maxolt = fok >= k.maxfok;
    return { bónusz, maxolt };
  }).filter(b => b.bónusz >= 0);

  if (bónuszok.length === 0) return { szint: 0, tiltott: false };

  // Sort by bónusz ascending
  bónuszok.sort((a, b) => a.bónusz - b.bónusz);

  // Az alacsonyabb számít, KIVÉVE ha az maxfokú → következő számít
  for (const b of bónuszok) {
    if (!b.maxolt) return { szint: b.bónusz, tiltott: false };
  }
  // Mind maxfokú → a legmagasabb bónusz érvényes
  return { szint: bónuszok[bónuszok.length - 1].bónusz, tiltott: false };
}

/** Képzettségpróba sikeres, ha Tulajdonság + Képzettség szint + k10 ≥ célszám. */
export function probaSiker(tulÉrték: number, szint: number, k10: number, célszám: number): boolean {
  return tulÉrték + szint + k10 >= célszám;
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

/** Helyettesítő képzettség effektív szintje: FLOOR(szint / 3), max 5 (md/030_06_01). */
export function helyettesítésSzint(szint: number): number {
  return Math.min(5, Math.floor(szint / 3));
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
): number {
  const bázis = helyettesítőSzint != null ? helyettesítésSzint(helyettesítőSzint) : szint;
  return bázis + vállalás + szitModÖsszeg;
}

/** Összetett próba célszámai: elsődleges + N db másodlagos (célszám - 3). */
export function összetettCélszámok(nehézség: number, másodlagosDb: number): { label: string; célszám: number }[] {
  return [
    { label: 'Elsődleges', célszám: nehézség },
    ...Array.from({ length: másodlagosDb }, () => ({ label: 'Másodlagos', célszám: nehézség - 3 })),
  ];
}
