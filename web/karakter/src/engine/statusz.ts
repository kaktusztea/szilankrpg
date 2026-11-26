/**
 * Felvett státusz (session.aktív_státuszok elem) kezelése: `"<id> (<fok>)"` vagy `"<id>: <alkategória> (<fok>)"`.
 * A hivatkozás a státusz `id`-je (statuszok.yaml); a megjelenítés a `név` + az alkategória olvasható címkéje.
 */
import type { StatuszEntry } from './data-types';
import type { AutoStátuszRekord, Session } from './types';

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

/** „Név: Alkategória-címke (fok)" - feliratokhoz, forrás-listákhoz. Szabad szövegnél a szöveg nem kerül a címkébe (a megjegyzésben van). */
export function státuszCímke(def: StatuszEntry | undefined, p: StátuszPéldány): string {
  const név = def?.név ?? p.id;
  const al = p.alkategória && !def?.szabad_szöveg ? `: ${alkategóriaCímke(def, p.alkategória)}` : '';
  return `${név}${al} (${p.fok})`;
}

/** A fok alcíme csak a fokszámot ismétli-e („N. fok"): ilyenkor a felirat a fokszám mellé nem írja ki. */
export function alcímCsakFok(f: { fok: number; alcím: string }): boolean {
  return f.alcím === `${f.fok}. fok`;
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

/**
 * Egy státusz-hatás sor megjelenítéshez kitöltve a felvett alkategóriával: az `alcél` a nyers értéket kapja (pl.
 * `képzettség:lexikum`), a `hatás_név` / `megjegyzés` az olvasható címkét (pl. „Érzék - Hátrány-2 (Látás)").
 */
export function hatásKitöltve<T extends { alcél?: string; megjegyzés?: string; hatás_név?: string }>(
  h: T, def: Pick<StatuszEntry, 'alkategória_címkék'> | undefined, al: string | undefined,
): T {
  if (!al) return h;
  const címke = alkategóriaCímke(def, al);
  return { ...h, alcél: alkategóriaKitölt(h.alcél, al), megjegyzés: alkategóriaKitölt(h.megjegyzés, címke), hatás_név: alkategóriaKitölt(h.hatás_név, címke) };
}

/**
 * Automatikus státusz-forrás (Akadály → `fizikai`, ÉP → `sérült`) egy lépése a cél-fok változásakor. md/082: egy
 * státuszból egy fok aktív, a magasabb érvényes - ezért a kézi fok (`alatta`) nem vész el: az érvényes fok
 * max(alatta, célFok), a forrás megszűnésekor (célFok = 0) a kézi fok áll vissza. Ha a státusz a legutóbbi lépés óta
 * kézzel változott (a jelenlegi fok ≠ `rekord.fok`), a jelenlegi fok az új `alatta`.
 * Változatlan állapotnál ugyanazt a tömböt adja vissza (a hívó ebből látja, hogy nincs mit írni).
 */
export function autoStátuszLépés(
  aktív: string[], id: string, célFok: number, rekord: AutoStátuszRekord | undefined,
): { aktív: string[]; rekord: AutoStátuszRekord | undefined } {
  const jelenlegi = aktív.map(parseStátusz).find(p => p?.id === id && !p.alkategória)?.fok ?? 0;
  const alatta = rekord && rekord.fok === jelenlegi ? rekord.alatta : jelenlegi;
  const fok = Math.max(alatta, célFok);
  const újRekord = célFok > 0 ? { fok, alatta } : undefined;
  if (fok === jelenlegi) return { aktív, rekord: újRekord };
  const többi = aktív.filter(s => parseStátusz(s)?.id !== id);
  return { aktív: fok > 0 ? [...többi, státuszKulcs({ id, fok })] : többi, rekord: újRekord };
}

/** A session-re alkalmazva (`auto_státuszok` nyilvántartással); változás nélkül ugyanazt a session-t adja. */
export function autoStátuszSession(prev: Session, id: string, célFok: number): Session {
  const rekordok = prev.auto_státuszok ?? {};   // older saves have no such field
  const { aktív, rekord } = autoStátuszLépés(prev.aktív_státuszok, id, célFok, rekordok[id]);
  const rekordVáltozott = (rekord?.fok ?? -1) !== (rekordok[id]?.fok ?? -1) || (rekord?.alatta ?? -1) !== (rekordok[id]?.alatta ?? -1);
  if (aktív === prev.aktív_státuszok && !rekordVáltozott) return prev;
  const { [id]: _régi, ...többiRekord } = rekordok;
  return { ...prev, aktív_státuszok: aktív, auto_státuszok: rekord ? { ...többiRekord, [id]: rekord } : többiRekord };
}
