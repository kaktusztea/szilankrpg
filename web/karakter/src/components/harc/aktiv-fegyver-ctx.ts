import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';

/** Egy fegyver kiszámolt harcértékei (a useHarcComputed eredményéből). */
interface FegyverResult {
  fegyver_név: string;
  TÉ: number;
  VÉ: number;
  támadások: number;
}

/** A HarcScreen header boxaihoz szükséges rész a computed értékekből. */
interface ComputedRész<R extends FegyverResult> {
  fegyverResults: R[];
  kétkezesResult: R | null;
  fogásResult: { VÉ_bónusz: number; TÉ_büntetés: number } | null;
  pajzsVÉ: number;
  pajzsFegyverNév: string | null;
}

/** Az aktív (jobb kéz) fegyver megjelenített neve; puszta kéz, ha nincs kiválasztva. */
export function aktívJobbFegyverNév(karakter: Karakter, session: Session, data: GameData): string {
  const idx = session.aktív_fegyver_index;
  const fp = idx >= 0 ? karakter.fegyverek[idx] : null;
  if (!fp) return 'Puszta kéz';
  return lookupFegyver(data.fegyverek, fp.alap)?.Fegyver ?? 'Puszta kéz';
}

/**
 * Melyik fegyver harcértékei kerülnek a Harc fül fejlécébe, és milyen extrákkal?
 * Prioritás: kétkezes harc → fegyverfogás → pajzs (index -2) → aktív jobb kéz.
 * `null`, ha az adott fegyverhez nincs kiszámolt eredmény.
 */
export function resolveAktívFegyverContext<R extends FegyverResult>(
  hc: ComputedRész<R>,
  karakter: Karakter,
  session: Session,
  data: GameData,
): { result: R; veBónusz: number; téExtra: number } | null {
  if (hc.kétkezesResult) {
    return { result: hc.kétkezesResult, veBónusz: hc.pajzsVÉ, téExtra: 0 };
  }

  const jobbNév = aktívJobbFegyverNév(karakter, session, data);

  if (hc.fogásResult) {
    // Fegyverfogásnál a jobb kéz fegyvere a mérvadó; ha nincs találat, az első eredmény
    const r = hc.fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? hc.fegyverResults[0];
    return r ? { result: r, veBónusz: hc.fogásResult.VÉ_bónusz, téExtra: hc.fogásResult.TÉ_büntetés } : null;
  }

  if (session.aktív_fegyver_index === -2) {   // -2 = pajzs mint fegyver
    const r = hc.fegyverResults.find(fr => fr.fegyver_név === (hc.pajzsFegyverNév ?? ''));
    return r ? { result: r, veBónusz: hc.pajzsVÉ, téExtra: 0 } : null;
  }

  const r = hc.fegyverResults.find(fr => fr.fegyver_név === jobbNév);
  return r ? { result: r, veBónusz: hc.pajzsVÉ, téExtra: 0 } : null;
}
