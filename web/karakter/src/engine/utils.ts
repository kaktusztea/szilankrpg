import type { FegyverAlap, Session, Karakter, Kepzettseg } from './types';
import type { GameData } from './data-loader';
import { képzKulcs, képzettségNév, HARCMODOR_ID } from './azonosito';

/** Fegyver definíció keresése név alapján (case-insensitive) */
export function lookupFegyver(fegyverek: FegyverAlap[], alap: string): FegyverAlap | undefined {
  const lower = alap.toLowerCase();
  return fegyverek.find(d => d.név.toLowerCase() === lower);
}

/** Képzettség szintje hivatkozási kulcs alapján ("lexikum", "harcmodor/kardvívás"), vagy 0 ha nincs felvéve. */
export function képzettségSzint(karakter: Karakter, kulcs: string): number {
  return karakter.képzettségek.find(k => képzKulcs(k) === kulcs)?.szint ?? 0;
}

/** Fortély foka id alapján, vagy 0 ha nincs felvéve. */
export function fortélyFok(karakter: Karakter, id: string): number {
  return karakter.fortélyok.find(f => f.id === id)?.fok ?? 0;
}

/** Több közelharci harcmodor szintjének összege; `elemek`: harcmodor-elemek (pl. "kardvívás"). */
export function harcmodorÖsszeg(karakter: Karakter, elemek: string[]): number {
  return elemek.reduce((s, e) => s + képzettségSzint(karakter, `${HARCMODOR_ID}/${e}`), 0);
}

/** Érték szorítása [min, max] tartományba. */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

/**
 * String feltétel kiértékelése prefix:érték formátumban.
 * Használható: alapeset.ts, aktiv-calc, AktivScreen - mindenhol ahol
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
export function describeKepChange(prev: Kepzettseg[], next: Kepzettseg[], data: Pick<GameData, 'kepzettsegDefs'>): string {
  const név = (k: Kepzettseg) => képzettségNév(k, data);
  const same = (a: Kepzettseg) => (b: Kepzettseg) => képzKulcs(a) === képzKulcs(b);
  if (next.length > prev.length) {
    const added = next.find(n => !prev.some(same(n)));
    if (added) return `Képzettség: ${név(added)} 0→${added.szint}`;
  } else if (next.length < prev.length) {
    const removed = prev.find(k => !next.some(same(k)));
    if (removed) return `Képzettség: ${név(removed)} ${removed.szint}→0❌`;
  } else {
    const changed = next.find(n => { const old = prev.find(same(n)); return old && old.szint !== n.szint; });
    if (changed) { const old = prev.find(same(changed))!; return `Képzettség: ${név(changed)} ${old.szint}→${changed.szint}`; }
  }
  return '';
}
