/**
 * Egységes effekt-precedencia (engine_spec §42.3) - egyetlen harcérték-célra.
 *
 * A §42.3 sorrend: additív (flat+scaled) → szorzó → override → max_limit → (kocka: előny/hátrány,
 * itt nem numerikus) → letilt/szöveges (nem számol). Kerekítés: FLOOR minden nem-egész köztesnél.
 *
 * Ez a §42 3. fázisának izolált, tesztelhető magja. JELENLEG csak ott hívjuk, ahol a teljes
 * korreláció (saját + ellenfél érintett statisztikái) ismert - pl. a Sebzés popup SP-oldalán, ahol
 * az „Ellenfél páncél" választó megadja a hiányzó cél-páncél infót. Ahol az infó hiányos, NEM
 * alkalmazzuk (warning + „Extrák" jelzés helyettesíti).
 */

import type { ExtraFeltétel, ExtraHatás, FegyverExtraDef } from '../../engine/data-types';
import type { ExtraKontextus } from './extrak-info-calc';
import { extraFeltételTeljesül } from './extrak-info-calc';

/** Egy célra ható effektek a §42.3 precedencia szerint alkalmazva a bázisértékre. */
export function alkalmazEffektek(bázis: number, hatások: ExtraHatás[]): number {
  let additív = 0;
  let szorzó = 1;
  let override: number | null = null;
  let maxLimit: number | null = null;

  for (const h of hatások) {
    if (typeof h.érték !== 'number') continue; // letilt/szöveges: nem numerikus, kihagyva
    switch (h.mód) {
      case 'flat':
      case 'scaled': // scaled forrás-arány már feloldva a hívónál; itt additív számként érkezik
        additív += h.érték; break;
      case 'szorzó': szorzó *= h.érték; break;
      case 'override': override = h.érték; break;
      case 'max_limit': maxLimit = maxLimit === null ? h.érték : Math.min(maxLimit, h.érték); break;
    }
  }

  let érték = override !== null ? override : Math.floor((bázis + additív) * szorzó);
  if (maxLimit !== null) érték = Math.min(érték, maxLimit);
  return érték;
}

/**
 * Az aktív fegyver extrái közül azok hatásai egy adott CÉLRA, amelyek feltételei a jelen
 * kontextusban TELJESÜLNEK (nem `km`, nem `inaktív`). A hatás-al-feltételt (`feltétel`) is nézi.
 */
export function aktívHatásokCélra(
  fegyverExtrák: { id: string }[] | undefined,
  extraDefs: Record<string, FegyverExtraDef> | undefined,
  ctx: ExtraKontextus,
  cél: string,
): ExtraHatás[] {
  if (!fegyverExtrák?.length || !extraDefs) return [];
  const ki: ExtraHatás[] = [];
  for (const { id } of fegyverExtrák) {
    const def = extraDefs[id];
    if (!def?.hatás?.length) continue;
    const manőverReleváns = !!ctx.aktívManőver && def.hatás.some(h => h.feltétel === `manőver:${ctx.aktívManőver}`);
    // A top-level feltételeknek maradéktalanul teljesülniük kell (KM/inaktív → nem alkalmazzuk).
    if (!feltételekBiztosanTeljesülnek(def.feltétel, ctx, manőverReleváns)) continue;
    for (const h of def.hatás) {
      if (h.cél !== cél) continue;
      // Hatás-al-feltétel (pl. "manőver:<id>"): csak ha az aktív manőverre illik.
      if (h.feltétel && h.feltétel !== `manőver:${ctx.aktívManőver ?? ''}`) continue;
      ki.push(h);
    }
  }
  return ki;
}

/** Minden top-level feltétel BIZTOSAN teljesül (nincs hamis és nincs bizonytalan/KM tag). */
function feltételekBiztosanTeljesülnek(feltételek: ExtraFeltétel[] | undefined, ctx: ExtraKontextus, manőverReleváns: boolean): boolean {
  if (!feltételek?.length) return true;
  return feltételek.every(f => extraFeltételTeljesül(f, ctx, manőverReleváns) === true);
}

/**
 * Az adott CÉLRA ható azon extrák nevei, amelyek státusza a jelen kontextusban BIZONYTALAN (KM):
 * a hatás érinti a célt (pl. VÉ), de valamelyik feltétele nem eldönthető (pl. hiányzik az ellenfél
 * páncél-infó). Ezekre a hívó WARNING-ot ad - NEM alkalmazza a hatást (hiányos korreláció).
 */
export function hiányzóInfósExtrák(
  fegyverExtrák: { id: string }[] | undefined,
  extraDefs: Record<string, FegyverExtraDef> | undefined,
  ctx: ExtraKontextus,
  cél: string,
): string[] {
  if (!fegyverExtrák?.length || !extraDefs) return [];
  const nevek: string[] = [];
  for (const { id } of fegyverExtrák) {
    const def = extraDefs[id];
    if (!def?.hatás?.some(h => h.cél === cél)) continue;
    if (!def.feltétel?.length) continue;
    const manőverReleváns = !!ctx.aktívManőver && def.hatás.some(h => h.feltétel === `manőver:${ctx.aktívManőver}`);
    const részek = def.feltétel.map(f => extraFeltételTeljesül(f, ctx, manőverReleváns));
    // Bizonytalan (KM), ha nincs hamis tag, de van legalább egy undefined.
    if (!részek.some(r => r === false) && részek.some(r => r === undefined)) nevek.push(def.név);
  }
  return nevek;
}
