import type { FegyverAlap, Session, Karakter } from './types';

/** Fegyver definíció keresése név alapján (case-insensitive) */
export function lookupFegyver(fegyverek: FegyverAlap[], alap: string): FegyverAlap | undefined {
  const lower = alap.toLowerCase();
  return fegyverek.find(d => d.Fegyver.toLowerCase() === lower);
}

/**
 * String feltétel kiértékelése prefix:érték formátumban.
 * Használható: alapeset.ts, HatasPoolCalc, AktivScreen — mindenhol ahol
 * aktívFeltételek Set nem áll rendelkezésre.
 */
export function evaluateFeltétel(feltétel: string, session: Session, karakter: Karakter): boolean {
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

/** Undo leírás generálás képzettség változáshoz */
export function describeKepChange(prev: { név: string; szint: number }[], next: { név: string; szint: number }[]): string {
  if (next.length > prev.length) {
    const added = next.find(n => !prev.some(k => k.név === n.név));
    if (added) return `Képzettség: ${added.név} 0→${added.szint}`;
  } else if (next.length < prev.length) {
    const removed = prev.find(k => !next.some(n => n.név === k.név));
    if (removed) return `Képzettség: ${removed.név} ${removed.szint}→0❌`;
  } else {
    const changed = next.find(n => { const old = prev.find(k => k.név === n.név); return old && old.szint !== n.szint; });
    if (changed) { const old = prev.find(k => k.név === changed.név)!; return `Képzettség: ${changed.név} ${old.szint}→${changed.szint}`; }
  }
  return '';
}
