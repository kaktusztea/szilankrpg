/**
 * Felvett státusz (session.aktív_státuszok elem) kezelése: `"<id> (<fok>)"` vagy `"<id>: <alkategória> (<fok>)"`.
 * A hivatkozás a státusz `id`-je (statuszok.yaml); a megjelenítés a `név` + az alkategória olvasható címkéje.
 */
import type { StatuszEntry } from './data-types';

export interface StátuszPéldány { id: string; alkategória?: string; fok: number }

const MINTA = /^([^:\s]+)(?:: (.+))? \((\d+)\)$/;

/** A session-bejegyzés felbontása; érvénytelen formátum → null. */
export function parseStátusz(s: string): StátuszPéldány | null {
  const m = s.match(MINTA);
  if (!m) return null;
  return { id: m[1], ...(m[2] ? { alkategória: m[2] } : {}), fok: parseInt(m[3]) };
}

/** A session-bejegyzés összeállítása. */
export function státuszKulcs(p: StátuszPéldány): string {
  return `${p.id}${p.alkategória ? `: ${p.alkategória}` : ''} (${p.fok})`;
}

/** Az alkategória olvasható címkéje (statuszok.json `alkategória_címkék`, pl. lexikum → Lexikum); nincs címke → az érték maga. */
export function alkategóriaCímke(def: Pick<StatuszEntry, 'alkategória_címkék'> | undefined, al: string): string {
  return def?.alkategória_címkék?.[al] ?? al;
}

/** „Név: Alkategória-címke (fok)" - feliratokhoz, forrás-listákhoz. */
export function státuszCímke(def: StatuszEntry | undefined, p: StátuszPéldány): string {
  const név = def?.név ?? p.id;
  return `${név}${p.alkategória ? `: ${alkategóriaCímke(def, p.alkategória)}` : ''} (${p.fok})`;
}

/** A hatás-sor futásidejű helyőrzőjének kitöltése a felvett alkategóriával (statuszok.json: `"{alkategória}"`). */
export function alkategóriaKitölt<T extends string | undefined>(s: T, al: string | undefined): T {
  return (s && al ? s.split('{alkategória}').join(al) : s) as T;
}

/** A felvett státuszok id-halmaza (feltétel-kiértékeléshez: `{típus: státusz, név: <id>}`). */
export function aktívStátuszIdk(aktívStátuszok: string[]): Set<string> {
  return new Set(aktívStátuszok.map(s => parseStátusz(s)?.id).filter((x): x is string => !!x));
}

/**
 * A felvételkor választható alkategóriák: a státusz alkategóriái, kivéve amit ugyanebből a státuszból már felvettek
 * (egy alkategória egyszer: pl. Érzékvesztés: Látás nem vehető fel kétszer, csak fokozható).
 */
export function választhatóAlkategóriák(def: StatuszEntry, aktívStátuszok: string[]): string[] {
  const foglalt = new Set(aktívStátuszok.map(parseStátusz).filter(p => p?.id === def.id).map(p => p!.alkategória));
  return (def.alkategóriák ?? []).filter(a => !foglalt.has(a));
}

/** Felvehető-e még a státusz: alkategóriásnál van szabad alkategória, egyébként (nem többszörös) még nincs felvéve. */
export function státuszFelvehető(def: StatuszEntry, aktívStátuszok: string[]): boolean {
  if (def.alkategóriák?.length) return választhatóAlkategóriák(def, aktívStátuszok).length > 0;
  return !aktívStátuszok.some(s => parseStátusz(s)?.id === def.id);
}
