import type { Session, Karakter } from './types';

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
  session: Session
): AktívAlapeset[] {
  const kFort = new Set(karakter.fortélyok.map(f => f.név));
  const result: AktívAlapeset[] = [];

  for (const def of fortelyDefs) {
    if (kFort.has(def.név)) continue;
    const fok0 = def.fokok.find(f => f.fok === 0);
    if (!fok0 || (!fok0.hatás?.length && !fok0.módosítók?.length)) continue;

    if (!fok0.módosítók?.length) {
      // Csak hatástext, mindig aktív
      result.push({ fortély_név: def.név, hatástext: fok0.hatás || [], módosítók: [] });
    } else {
      const aktív = fok0.módosítók.filter((m: any) => !m.feltétel || evaluateFeltétel(m.feltétel, session, karakter));
      if (aktív.length > 0) {
        result.push({ fortély_név: def.név, hatástext: fok0.hatás || [], módosítók: aktív });
      }
    }
  }
  return result;
}

function evaluateFeltétel(feltétel: string, session: Session, karakter: Karakter): boolean {
  const i = feltétel.indexOf(':');
  if (i === -1) return true;
  const prefix = feltétel.slice(0, i);
  const érték = feltétel.slice(i + 1);

  switch (prefix) {
    case 'fegyverfogás':
      return session.fegyverfogás === érték;
    case 'fegyver':
      return (karakter.fegyverek[session.aktív_fegyver_index]?.alap?.toLowerCase() ?? '') === érték.toLowerCase();
    case 'harci_helyzet':
      return session.aktív_helyzetek.includes(érték);
    case 'szituáció':
      return session.aktív_helyzetek.includes(érték);
    case 'taktika':
      return session.aktív_taktikák.some(t => t.név === érték);
    case 'páncél':
      return session.aktív_páncél;
    default:
      return false;
  }
}
