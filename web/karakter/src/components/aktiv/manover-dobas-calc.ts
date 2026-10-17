// Manőver dobás popup - pure (render-mentes) logika.
// Kiemelve a ManoverDobasPopup.tsx-ből (2026-09-11 refaktor): a komponens csak a
// dobás-folyamat state-jét és JSX-ét tartja, minden számítás/feltétel ide kerül.
// Ezekre a fn-ekre írt tesztek: Manover{Kovetelmeny,TeBontas,FazisFelirat,EredmenyHatas}.test.ts
import { HARCMODOR_ID, képzettségSzint, fortélyFok } from '../../engine/azonosito';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { ModositoTabla, ManoverKövetelmény } from '../../engine/data-types';
import { harcmodorÖsszeg } from '../../engine/utils';
import { lookupFegyver } from '../../engine/utils';
import { elsődlegesMód } from '../harc/fegyver-calc';
import { calcSzitModÖsszeg } from '../tulajdonsagok/kepzettseg-proba-calc';
import { buildAktívFeltételek } from '../../engine/feltetelek';

/** Harci helyzetek (nevek), amelyek Aktív módban könnyítik a manővert (§066_03). */
const MEGLEPETÉS = 'Meglepetés';
const ORVTÁMADÁS = 'Orvtámadás';

/**
 * Aktív harci helyzet adta könnyítés a manőver dobásra (§066_03: Meglepetés / Orvtámadás).
 * Mindkettőnél a célpont nem védekezik → nincs Megakasztás (M) és nincs támadó dobás (V);
 * a találat automatikus (sebzést a fegyvertáblán dobunk, ez nem érinti). Csak Aktív módban.
 */
export function helyzetKönnyítés(session: Session): { meglepetés: boolean; orvtámadás: boolean } {
  return {
    meglepetés: session.aktív_helyzetek.includes(MEGLEPETÉS),
    orvtámadás: session.aktív_helyzetek.includes(ORVTÁMADÁS),
  };
}

/**
 * Egy 'egyéb' követelmény mely aktiválható harci helyzet(ek)re hivatkozik (adatvezérelt).
 * Az így felismert követelmény GÉPILEG kiértékelhető a session.aktív_helyzetek alapján.
 * A tagadó szövegeket ("nincs"/"sincs") KIZÁRJUK - azok nem "aktív helyzet kell" jellegűek
 * (pl. "Ellenfél nincs Fegyverelőnyben", "Egyik ellenfél sincs Fegyverelőnyben"), maradnak manuálisak.
 * A hosszabb neveket előbb illesztjük (Fegyverelőny vs Fegyverhátrány szóhatár egyértelműsítése).
 */
function követelményHelyzetei(köv: ManoverKövetelmény, data: GameData): string[] {
  if (köv.típus !== 'egyéb') return [];
  const sz = köv.leírás ?? '';
  if (/\b(nincs|sincs)\b/i.test(sz)) return [];
  const nevek = [...data.harciHelyzetek.map(h => h.név)].sort((a, b) => b.length - a.length);
  return nevek.filter(n => sz.includes(n));
}

export type Mód = 'aktív' | 'passzív';
export type FázisEredmény = 'pending' | 'igen' | 'nem';

export interface ManőverDef {
  név: string;
  nehézség: number;
  fázisok: string;
  fázis_info: { aktív: Record<string, string>; passzív: Record<string, string> };
  fázis_cselekvő: Record<string, 'én' | 'ellenfél'>;
  ellenpróba_bünteti: boolean;
  típus: string;
  hatás: { aktív: string[]; passzív: string[] };
  végrehajtás_té_módosító: number;
  követelmények: ManoverKövetelmény[];
  helyzetfüggő_módosítók: ModositoTabla[];
}

/** Egy harcmodor-képzettség szintje-e, ill. bármely harcmodor max szintje ("Harcmodor"). */
function harcmodorMaxSzint(karakter: Karakter, data: GameData): number {
  const elemek = new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[]);
  return Math.max(0, ...karakter.képzettségek.filter(k => k.id === HARCMODOR_ID && elemek.has(k.elem)).map(k => k.szint));
}

/** Az aktív (támadó) fegyver a manőver-követelmény gépi kiértékeléséhez. */
export interface AktívFegyverInfo {
  kategória: string;   // pl. "kardvívó", "romboló" (fegyverek.json Kategória)
  sebzésMódja: string; // a jelleg teljes szava, pl. "vágó-egyenes", "szúró", "zúzó" (fegyverek_v2.json jelleg)
}

/**
 * Az aktív jobb kéz fegyverének kategóriája + sebzésmódja a session alapján.
 * null, ha nincs kiválasztott fegyver (puszta kéz / index<0) → a fegyver-követelmények manuálisak.
 * ponytail: a jobb kéz fegyvere a mérvadó (kétkezes/pajzs finomságát nem bontjuk - a kézifegyveres
 * manőver-követelményekhez ez elég; upgrade: aktív-fegyver-ctx bevonása, ha később kell.)
 */
export function aktívFegyverInfo(karakter: Karakter, session: Session, data: GameData): AktívFegyverInfo | null {
  const idx = session.aktív_fegyver_index;
  const fp = idx >= 0 ? karakter.fegyverek[idx] : null;
  if (!fp) return null;
  const def = lookupFegyver(data.fegyverek, fp.alap);
  if (!def) return null;
  return { kategória: def.kategória, sebzésMódja: elsődlegesMód(def).jelleg };
}

/** Az aktív (jobb kéz) fegyver neve, vagy null ha nincs kiválasztva (puszta kéz / index<0). */
export function aktívFegyverNév(karakter: Karakter, session: Session, data: GameData): string | null {
  const idx = session.aktív_fegyver_index;
  const fp = idx >= 0 ? karakter.fegyverek[idx] : null;
  return fp ? (lookupFegyver(data.fegyverek, fp.alap)?.név ?? null) : null;
}

/**
 * Egy helyzetfüggő módosító sor `feltétel` STRING-je (`"prefix:érték"`) teljesül-e a jelen manőver-
 * kontextusban. Támogatott prefixek: `fegyver_extra:<id>` (az aktív fegyver hordozza-e az extrát),
 * `taktika:<id>` / `harci_helyzet:<id>` / `fegyverfogás:<id>` (aktív feltételek), `fegyver_kategória:<kat>`.
 * Ismeretlen prefix / nincs feltétel → false (nem auto-matchel, marad kézi).
 */
export function szitFeltételTeljesül(feltétel: string | undefined, karakter: Karakter, session: Session, data: GameData): boolean {
  if (!feltétel || !feltétel.includes(':')) return false;
  const [prefix, ...rest] = feltétel.split(':');
  const érték = rest.join(':');
  if (prefix === 'fegyver_extra') {
    const idx = session.aktív_fegyver_index;
    const fp = idx >= 0 ? karakter.fegyverek[idx] : null;
    const fdef = fp ? lookupFegyver(data.fegyverek, fp.alap) : null;
    return !!fdef?.extrák?.some(e => e.id === érték);
  }
  if (prefix === 'fegyver_kategória') {
    const idx = session.aktív_fegyver_index;
    const fp = idx >= 0 ? karakter.fegyverek[idx] : null;
    const fdef = fp ? lookupFegyver(data.fegyverek, fp.alap) : null;
    return fdef?.kategória === érték;
  }
  // taktika / harci_helyzet / fegyverfogás → az aktív feltétel-kulcsok között.
  return buildAktívFeltételek(session, data).has(feltétel);
}

/**
 * A helyzetfüggő módosító táblák auto-match kezdőállapota: single táblánál a legelső teljesülő
 * feltételes sor indexe (vagy -1 ha nincs), multi táblánál soronkénti teljesülés. A popup ezt
 * használja kezdőértéknek - a felhasználó utána kézzel felülbírálhatja (ki/be).
 */
export function szitModKezdőÁllapot(
  táblák: ModositoTabla[], karakter: Karakter, session: Session, data: GameData,
): { single: Record<string, number>; multi: Record<string, boolean[]> } {
  const single: Record<string, number> = {};
  const multi: Record<string, boolean[]> = {};
  for (const t of táblák) {
    if (t.mód === 'multi') {
      multi[t.kategória] = t.sorok.map(s => szitFeltételTeljesül(s.feltétel, karakter, session, data));
    } else {
      const idx = t.sorok.findIndex(s => szitFeltételTeljesül(s.feltétel, karakter, session, data));
      single[t.kategória] = idx; // -1 ha nincs match
    }
  }
  return { single, multi };
}

/**
 * A Helyzetfüggő módosítók „nem kísérelhető meg" sentinel-értéke (§066_04). A dobó-oldalra áttért
 * modellben ez NEM aritmetikai módosító (különben +99 dobásbónusz biztos sikert adna), hanem jelző:
 * ha a KIVÁLASZTOTT módosító-sor értéke ez, a Manőver az adott körülmények közt nem dobható.
 * Az érték data-driven: `konstansok.yaml` → `manőver.sentinel_nem_kísérelhető` (a hívó adja át).
 */
export function szitModSentinelLehetetlen(
  táblák: ModositoTabla[], szitMods: Record<string, number>, multiMods: Record<string, boolean[]>,
  sentinel: number,
): boolean {
  for (const t of táblák) {
    if (t.mód === 'multi') {
      const flags = multiMods[t.kategória];
      if (flags && t.sorok.some((s, i) => flags[i] && s.érték === sentinel)) return true;
    } else {
      const idx = szitMods[t.kategória];
      if (idx != null && idx >= 0 && t.sorok[idx]?.érték === sentinel) return true;
    }
  }
  return false;
}

/**
 * A KIVÁLASZTOTT sentinel-értékű sor `feltétel`-éből kinyert fegyver-extra id (`fegyver_extra:<id>`),
 * vagy null ha nincs ilyen. A popup ebből oldja fel az extra teljes leírását (miért immunis/letilt).
 */
export function szitModSentinelExtraId(
  táblák: ModositoTabla[], szitMods: Record<string, number>, multiMods: Record<string, boolean[]>,
  sentinel: number,
): string | null {
  const idBőlFeltétel = (f: string | undefined): string | null =>
    f?.startsWith('fegyver_extra:') ? f.slice('fegyver_extra:'.length) : null;
  for (const t of táblák) {
    if (t.mód === 'multi') {
      const flags = multiMods[t.kategória];
      const sor = flags && t.sorok.find((s, i) => flags[i] && s.érték === sentinel);
      if (sor) return idBőlFeltétel(sor.feltétel);
    } else {
      const idx = szitMods[t.kategória];
      if (idx != null && idx >= 0 && t.sorok[idx]?.érték === sentinel) return idBőlFeltétel(t.sorok[idx].feltétel);
    }
  }
  return null;
}

/**
 * A dobó-oldalhoz illő Helyzetfüggő módosító táblák a mód szerint:
 *   - aktív: a manőver aktív-oldali táblái (mód_oldal != 'passzív') + a globális módosítók
 *     (konstansok.yaml → manőver.globális_módosítók, §066_04),
 *   - passzív: a manőver passzív-oldali táblái (mód_oldal === 'passzív') - pl. fegyver-extrák
 *     a fegyver birtokosát érintik (Lefegyverezhetőbb, Fegyvertörés-immunis).
 */
export function szitTáblákMódszerint(
  helyzetfüggőMódosítók: ModositoTabla[] | undefined, mód: Mód, data: GameData,
): ModositoTabla[] {
  const táblák = helyzetfüggőMódosítók ?? [];
  return mód === 'aktív'
    ? [...táblák.filter(t => t.mód_oldal !== 'passzív'), ...(data.konstansok.manőver.globális_módosítók ?? [])]
    : táblák.filter(t => t.mód_oldal === 'passzív');
}

/** A Helyzetfüggő módosítók aggregált állapota (összeg + sentinel-ágak), egy helyen kiszámolva. */
export interface SzitModÁllapot {
  /** A dobáshoz adódó módosító-összeg (a sentinelek NEM adódnak hozzá). */
  összeg: number;
  /** 99 sentinel aktív: a Manőver nem kísérelhető meg (aktív E → biztos rontás). */
  lehetetlen: boolean;
  /** -99 sentinel aktív: a fegyver immunis (passzív E → biztos siker a védőnek). */
  immunis: boolean;
  /** Az immunis extra teljes leírása a katalógusból (miért sikertelen), vagy ''. */
  immunisLeírás: string;
}

/**
 * A kiválasztott Helyzetfüggő módosítók aggregált állapota - a két sentinel detektálása, az
 * összeg (sentinel nélkül) és az immunis-leírás feloldása EGY helyen (a popup korábban 5 inline
 * sorban szórta szét, ismételt argumentumokkal). A sentinel-értékek data-driven (konstansok.yaml).
 */
export function szitModÁllapot(
  táblák: ModositoTabla[], szitMods: Record<string, number>, multiMods: Record<string, boolean[]>, data: GameData,
): SzitModÁllapot {
  const konst = data.konstansok.manőver;
  const lehetetlen = szitModSentinelLehetetlen(táblák, szitMods, multiMods, konst.sentinel_nem_kísérelhető);
  const immunis = szitModSentinelLehetetlen(táblák, szitMods, multiMods, konst.sentinel_immunis);
  const immunisId = immunis ? szitModSentinelExtraId(táblák, szitMods, multiMods, konst.sentinel_immunis) : null;
  return {
    összeg: (lehetetlen || immunis) ? 0 : calcSzitModÖsszeg(táblák, szitMods, multiMods, []),
    lehetetlen,
    immunis,
    immunisLeírás: immunisId ? (data.fegyverExtrák?.[immunisId]?.leírás ?? '') : '',
  };
}

/**
 * Gépi (auto-kiértékelt) követelmény teljesül-e a karakter alapján.
 * Informatív ('egyéb') követelményt alapból NEM lehet gépileg értékelni → null (a játékos dönt).
 * KIVÉTEL: ha az 'egyéb' követelmény aktiválható harci helyzet(ek)re hivatkozik (session megadva):
 *   - bármely hivatkozott helyzet aktív → true; egyik sem → false; nem helyzet-alapú → null.
 * Fegyver-alapú gépi típusok (aktívFegyver megadva):
 *   - "fegyver_kategória": az aktív fegyver Kategóriája == érték → true, egyébként false;
 *   - "fegyver_sebzéstípus": az aktív fegyver jelleg-szavának kezdőbetűje == érték-betű (V/S/Z) → true.
 *   aktívFegyver hiányában (nincs aktív fegyver kiválasztva) e típusok → null (manuális).
 */
export function követelményTeljesül(
  köv: ManoverKövetelmény, karakter: Karakter, data: GameData,
  session?: Session, aktívFegyver?: AktívFegyverInfo | null,
): boolean | null {
  if (köv.típus === 'egyéb') {
    if (session) {
      const helyzetek = követelményHelyzetei(köv, data);
      if (helyzetek.length > 0) {
        return helyzetek.some(n => session.aktív_helyzetek.includes(n));
      }
    }
    return null;
  }
  if (köv.típus === 'fegyver_kategória') {
    if (!aktívFegyver) return null;
    return aktívFegyver.kategória === String(köv.érték ?? '');
  }
  if (köv.típus === 'fegyver_sebzéstípus') {
    if (!aktívFegyver) return null;
    // A fegyver elsődleges módjának `jelleg`-je teljes szó (szúró / vágó-egyenes / vágó-íves / zúzó);
    // a kanonikus S/V/Z kód a jelleg KEZDŐBETŰJE (data layer vokabulár, fegyverek_v2.json).
    const betű = String(köv.érték ?? '').toUpperCase();
    return aktívFegyver.sebzésMódja.toUpperCase().startsWith(betű);
  }
  const küszöb = typeof köv.érték === 'number' ? köv.érték : 0;
  if (köv.típus === 'képzettség') {
    const szint = köv.név === HARCMODOR_ID
      ? harcmodorMaxSzint(karakter, data)
      : képzettségSzint(karakter.képzettségek, köv.név ?? '');
    return szint >= küszöb;
  }
  // fortély: a felvett (max) fok
  const fok = fortélyFok(karakter.fortélyok, köv.név ?? '');
  return fok >= küszöb;
}

/**
 * A gépi követelmények kiértékelése egy manőverre.
 * - `erősHiány`: van hiányzó gépi Erős követelmény → auto-kudarc (nem dobható).
 * - `normálHiány`: van hiányzó gépi Normál követelmény → a "Teljesül mind" gomb tiltandó.
 */
export function gépiKövetelményStátusz(
  követelmények: ManoverKövetelmény[], karakter: Karakter, data: GameData,
  session?: Session, aktívFegyver?: AktívFegyverInfo | null,
): { erősHiány: boolean; normálHiány: boolean } {
  let erősHiány = false, normálHiány = false;
  for (const köv of követelmények) {
    const teljesül = követelményTeljesül(köv, karakter, data, session, aktívFegyver);
    if (teljesül === false) {
      if (köv.erősség === 'erős') erősHiány = true;
      else normálHiány = true;
    }
  }
  return { erősHiány, normálHiány };
}

/** Parse fázisok string (e.g. "M,V,E" or "E (M*)") into phase list, PRESERVING the
 *  order of appearance in the string (the `fázisok:` field encodes the intended order).
 *  A `*` marker (conditional phase) is ignored; duplicates removed. */
export function parseFázisok(s: string): ('M' | 'V' | 'E')[] {
  const result: ('M' | 'V' | 'E')[] = [];
  for (const ch of s) {
    if ((ch === 'M' || ch === 'V' || ch === 'E') && !result.includes(ch)) {
      result.push(ch);
    }
  }
  return result;
}

/**
 * Aktív Meglepetés/Orvtámadás könnyítés a fázissorra (§066_03, csak Aktív mód):
 * a célpont nem védekezik → kimarad a Megakasztás (M) ÉS a támadó dobás (V is).
 * A sebzést nem a popup dobja (fegyvertábla), így az nem érintett.
 * Passzív módban (vagy ha nincs ilyen helyzet) a fázissor változatlan.
 */
export function könnyítettFázisok(fázisok: ('M' | 'V' | 'E')[], mód: Mód, session: Session): ('M' | 'V' | 'E')[] {
  if (mód !== 'aktív') return fázisok;
  const h = helyzetKönnyítés(session);
  if (!h.meglepetés && !h.orvtámadás) return fázisok;
  return fázisok.filter(f => f === 'E');
}

export function calcManőverPont(karakter: Karakter, data: GameData): number {
  const { tsz } = karakter;
  const harcmodorNevek = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])];
  const összeg = harcmodorÖsszeg(karakter, harcmodorNevek);
  return Math.ceil(összeg * 2 / (tsz || 1));
}

export function getBelharcFok(karakter: Karakter): number {
  return fortélyFok(karakter.fortélyok, 'belharcos');
}

/**
 * Ki a cselekvő az adott fázisban (az ALKALMAZÓ szemszögéből, aktív mód).
 * Default: M → ellenfél (ő akaszt), V/E → én. A manőver `fázis_cselekvő` felülírhatja
 * (pl. Távoltartás M → én).
 */
export function fázisCselekvő(
  fázis: 'M' | 'V' | 'E', cselekvők: Record<string, 'én' | 'ellenfél'> | undefined,
): 'én' | 'ellenfél' {
  const override = cselekvők?.[fázis];
  if (override) return override;
  return fázis === 'M' ? 'ellenfél' : 'én';
}

/**
 * Egy fázis eredménye a MANŐVER szempontjából sikeres-e.
 * A CSELEKVŐ éri-e el a célját: ha a cselekvő = én → találat/elérés (`igen`) a jó;
 * ha a cselekvő = ellenfél (megakaszt) → a hibázása (`nem`) a jó a manővernek.
 */
export function fázisSikeres(eredmény: FázisEredmény, cselekvő: 'én' | 'ellenfél'): boolean {
  if (eredmény === 'pending') return false;
  return cselekvő === 'én' ? eredmény === 'igen' : eredmény === 'nem';
}

/**
 * Fázis gomb-feliratok a KONKRÉT dobás alapján. A cselekvő (én/ellenfél) + a mód
 * együtt adja, hogy a képernyő előtt ülő dob-e: tényleges = cselekvő XOR (passzív).
 * A `siker`/`kudarc` a MANŐVER-siker felé mutató, ill. attól elvezető dobás-eredmény.
 */
export function getFázisFelirat(
  fázis: 'M' | 'V' | 'E', mód: Mód, cselekvő: 'én' | 'ellenfél',
): { siker: string; kudarc: string } {
  // A képernyő előtt ülő az adott fázisban maga dob-e?
  const énDobok = (cselekvő === 'én') === (mód === 'aktív');
  if (fázis === 'M' && cselekvő === 'ellenfél') {
    // Megakasztó az ellenfél - a manőver-siker = a megakasztás NEM talál.
    return énDobok
      ? { siker: 'Elhibáztam', kudarc: 'Eltaláltam' }
      : { siker: 'Elhibázta', kudarc: 'Eltalált' };
  }
  // Cselekvő = én-típusú akció (V, E, vagy én-Megakasztás mint Távoltartás):
  // a cselekvő találata/elérése a manőver-siker.
  if (fázis === 'E') {
    return énDobok
      ? { siker: 'Elértem', kudarc: 'Nem értem el' }
      : { siker: 'Elérte', kudarc: 'Nem érte el' };
  }
  // M (én-cselekvő, pl. Távoltartás) vagy V - támadás/találat
  return énDobok
    ? { siker: 'Talált', kudarc: 'Nem talált' }
    : { siker: 'Eltalált', kudarc: 'Nem talált' };
}

/**
 * A "Manőver sikeres" boxban megjelenő hatás-sorok: a `hatás`-ból kiszűrjük a
 * kudarc-jellegű ("Sikertelen:" / "Kudarc:") és a feltétel/meta ("Feltétel:") sorokat -
 * ezek a SIKERES kontextusban félrevezetők/feleslegesek (a teljes `hatás` a pickerben látszik).
 * C2 (ponytail: prefix-alapú szűrés).
 */
export function eredményHatás(hatás: string[]): string[] {
  return hatás.filter(s => !/^\s*(sikertelen|kudarc|feltétel)\b/i.test(s));
}

/** Egy követelménysor emberi olvasású címkéje (minden típusra). */
export function követelményCimke(köv: ManoverKövetelmény): string {
  switch (köv.típus) {
    case 'egyéb': return köv.leírás ?? '';
    case 'fegyver_kategória': return `${köv.érték} harcmodor`;
    case 'fegyver_sebzéstípus': {
      const nevek: Record<string, string> = { V: 'Vágó', S: 'Szúró', Z: 'Zúzó' };
      return `${nevek[String(köv.érték).toUpperCase()] ?? köv.érték}fegyver`;
    }
    default: // képzettség / fortély
      return `${köv.név}${köv.érték != null ? ` ${köv.érték}${köv.típus === 'fortély' ? '.fok' : '.szint'}` : ''}`;
  }
}

/**
 * Egy követelménysor megjelenített jelölése. A gépi eredmény (true/false) mindig nyer.
 * A gépileg eldöntetlen (null) sor a KM döntése UTÁN tükrözi a globális döntést:
 * 'mind' → ✓; 'erős'/'normál' hiány → az adott erősségű sorok ✗, a másik erősség ✓.
 * Döntés előtt ('pending') marad '?'.
 */
export function követelményJelölés(
  teljesül: boolean | null,
  erősség: 'normál' | 'erős',
  döntés: 'pending' | 'mind' | 'normál' | 'erős',
): '✓' | '✗' | '?' {
  if (teljesül === true) return '✓';
  if (teljesül === false) return '✗';
  if (döntés === 'pending') return '?';
  if (döntés === 'mind') return '✓';
  return erősség === döntés ? '✗' : '✓';
}

/** Fázis-feliratok a manőver dobás popuphoz. */
export const FÁZIS_FELIRAT: Record<'M' | 'V' | 'E', string> = {
  M: '(M)egakasztás',
  V: '(V)égrehajtás',
  E: '(E)llenpróba',
};

/**
 * A rontott Végrehajtás (V) fázis VÉ-csökkentést okoz, mint egy sima sikertelen támadás
 * (md/066_04 „Sikertelen Manőver és VÉ csökkentés"). CSAK aktív módban és KIZÁRÓLAG a V fázisra:
 * a Megakasztás (M) rontása kifejezetten NEM okoz VÉ-csökkentést (md/066_04 🔆). A `vanVDobás` azt
 * jelzi, hogy van eldobott V (támadó) k20 - ez adja a VÉ-csökkentés kockatagját (k20P).
 */
export function rontottVFázis(
  fázisok: ('M' | 'V' | 'E')[], eredmények: FázisEredmény[], mód: Mód, vanVDobás: boolean,
): boolean {
  if (mód !== 'aktív' || !vanVDobás) return false;
  const i = fázisok.indexOf('V');
  return i >= 0 && eredmények[i] === 'nem';
}
