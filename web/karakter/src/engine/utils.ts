import type { FegyverAlap, Session, Karakter, Kepzettseg } from './types';
import type { GameData } from './data-loader';
import { képzKulcs, képzettségNév, képzettségSzint, HARCMODOR_ID } from './azonosito';

/** Fegyver definíció keresése név alapján (case-insensitive) */
export function lookupFegyver(fegyverek: FegyverAlap[], alap: string): FegyverAlap | undefined {
  const lower = alap.toLowerCase();
  return fegyverek.find(d => d.név.toLowerCase() === lower);
}

/** Több közelharci harcmodor szintjének összege; `elemek`: harcmodor-elemek (pl. "kardvívás"). */
export function harcmodorÖsszeg(karakter: Karakter, elemek: string[]): number {
  return elemek.reduce((s, e) => s + képzettségSzint(karakter.képzettségek, `${HARCMODOR_ID}/${e}`), 0);
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

/** Extrapolált fokDef interpoláció: ha a keresett fok nincs a fokok listában de van fortély_bővítés. */
export function interpolateFokDef<T extends { fok: number }>(fokok: T[], fok: number, hasBővítés: boolean): T | undefined {
  const found = fokok.find(f => f.fok === fok);
  if (found) return found;
  if (!hasBővítés || fokok.length === 0) return undefined;
  const utolsó = fokok[fokok.length - 1];
  // Lineáris extrapoláció az utolsó definiált fokból: minden numerikus mező arányosan skálázódik
  const result: Record<string, unknown> = { fok };
  for (const [k, v] of Object.entries(utolsó)) {
    if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') result[k] = Math.round((v / utolsó.fok) * fok);
  }
  return result as T;
}

/** Idea-szint harcérték-hatása (a fegyver_idea_tabla egy sora). */
export type IdeaHatás = { TÉ: number; VÉ: number; SP: number };
export type IdeaTabla = Record<string, { TÉ: number; VÉ: number; SP: number; sebesség: number; súly: number }>;

/**
 * A felvett fegyverpéldány Idea-hatásának DELTÁJA a `idea_default`-hoz képest (Modell 2, §16).
 * A v2 harcértékek a `idea_default` hatását MÁR tartalmazzák, ezért csak a példány-Idea ettől való
 * ELTÉRÉSÉT adjuk hozzá: `IDEA[példány] − IDEA[default]` (TÉ/VÉ/SP). Default példánynál (idea =
 * idea_default) a delta 0. Ismeretlen szint → 0-hatás (a tábla tartományán kívül nincs módosító).
 */
export function ideaDelta(példányIdea: number, ideaDefault: number, tábla: IdeaTabla | undefined): IdeaHatás {
  if (!tábla) return { TÉ: 0, VÉ: 0, SP: 0 };
  const p = tábla[String(példányIdea)] ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const d = tábla[String(ideaDefault)] ?? { TÉ: 0, VÉ: 0, SP: 0 };
  return { TÉ: p.TÉ - d.TÉ, VÉ: p.VÉ - d.VÉ, SP: p.SP - d.SP };
}

/** Pajzs fegyver név összerakása a karakter pajzs méretéből. */
export function buildPajzsFegyverNév(karakter: Karakter): string | null {
  if (!karakter.pajzs?.méret) return null;
  return karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs';
}
