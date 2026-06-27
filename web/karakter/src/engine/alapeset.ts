import type { Session, Karakter } from './types';
import { evaluateFeltétel } from './utils';

export interface AktívAlapeset {
  fortély_név: string;
  hatástext: string[];
  módosítók: { cél: string; mód?: string; típus?: string; érték: number; feltétel: string; megjegyzés?: string }[];
}

/**
 * Kiértékeli az összes fortély 0.fokát (Alapeset).
 * Aktív ha: karakter NEM rendelkezik a fortéllyal ÉS feltétel teljesül.
 */
export function evaluateAlapesetek(
  fortelyDefs: { név: string; fokok: { fok: number; hatás: string[]; módosítók: any[] }[] }[],
  karakter: Karakter,
  session: Session,
  aktívFeltételek?: Set<string>
): AktívAlapeset[] {
  const kFort = new Set(karakter.fortélyok.map(f => f.név));
  const result: AktívAlapeset[] = [];

  for (const def of fortelyDefs) {
    if (kFort.has(def.név)) continue;
    const fok0 = def.fokok.find(f => f.fok === 0);
    if (!fok0 || (!fok0.hatás?.length && !fok0.módosítók?.length)) continue;

    if (!fok0.módosítók?.length) {
      result.push({ fortély_név: def.név, hatástext: fok0.hatás || [], módosítók: [] });
    } else {
      const aktív = fok0.módosítók.filter((m: any) => {
        if (!m.feltétel) return true;
        if (aktívFeltételek) return aktívFeltételek.has(m.feltétel);
        return evaluateFeltétel(m.feltétel, session, karakter);
      });
      if (aktív.length > 0) {
        result.push({ fortély_név: def.név, hatástext: fok0.hatás || [], módosítók: aktív });
      }
    }
  }
  return result;
}
