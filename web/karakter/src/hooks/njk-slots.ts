import { MAX_NJK_DB } from '../ui-constants';
import { readSlots, type SlotEntry } from './slot-utils';
import type { Karakter } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { evaluate, buildContext } from '../engine/reactive';
import { readKmJelölések } from './km-jelolesek';
import { harcmodorÖsszeg as calcHarcmodorÖsszeg, fortélyFok } from '../engine/utils';
import { buildPancelLookups, calcFogas as calcFogás } from '../components/harc/pancel-calc';
import { buildFegyverRows, calcFegyverResults } from '../components/harc/fegyver-calc';
import { buildPajzsFegyverNév, computeVÉ } from '../components/harc/shared';
import { resolveAktívFegyverContext } from '../components/harc/aktiv-fegyver-ctx';

/**
 * NJK (Nem Játékos Karakter) slot szabályok: tárolási limit + a switcher sáv adatai.
 * Egy karakter akkor NJK, ha `jk === false` (a hiányzó `jk` JK-t jelent).
 */

/** Tárolt NJK slotok száma. */
export function njkCount(slots: SlotEntry[] = readSlots()): number {
  return slots.filter(s => s.jk === false).length;
}

/**
 * Túllépné-e a tárolt NJK limitet, ha ez a karakter a megadott slotba kerül?
 * Egyetlen hely, ahol az NJK limit szabálya el van döntve (import, duplikálás,
 * fájl betöltés, JK/NJK toggle).
 *
 * @param jk a karakter `jk` mezője (`false` = NJK)
 * @param overwriteUid ha meglévő slotba kerül, annak uid-ja (különben új slot)
 */
export function njkLimitBlocked(jk: boolean | undefined, overwriteUid?: string | null): boolean {
  if (jk !== false) return false;                     // JK karakter nem érinti az NJK limitet
  const slots = readSlots();
  const target = overwriteUid ? slots.find(s => s.uid === overwriteUid) : undefined;
  if (target?.jk === false) return false;             // már NJK slot → a szám nem nő
  return njkCount(slots) >= MAX_NJK_DB;
}

/** Egy NJK slot a switcher sávhoz: uid + megjelenítendő név. */
export interface NjkSlot {
  uid: string;
  név: string;
}

/**
 * NJK slotok a switcher sávhoz: becenév, ha van, különben név.
 * Rendezés: a KM-jelöléssel (betűazonosítóval) ellátott chip-ek elöl, betű szerint ABC
 * sorrendben (csoportosítva); a jelöletlen chip-ek utánuk, név szerint ABC sorrendben.
 * Ez így stabil, hogy a boxok pozíciója ne ugráljon autosave-kor.
 * A `MAX_NJK_DB` slice csak védőháló - a tárolási limit ezt már betartatja.
 */
export function njkSlots(slots: SlotEntry[]): NjkSlot[] {
  const jelölések = readKmJelölések();
  return slots
    .filter(s => s.jk === false)
    .map(s => ({ uid: s.uid, név: s.becenév || s.név || 'Névtelen' }))
    .sort((a, b) => {
      const betűA = jelölések[a.uid]?.betű || '';
      const betűB = jelölések[b.uid]?.betű || '';
      if (betűA && !betűB) return -1;
      if (!betűA && betűB) return 1;
      if (betűA && betűB) return betűA.localeCompare(betűB, 'hu') || a.név.localeCompare(b.név, 'hu');
      return a.név.localeCompare(b.név, 'hu');
    })
    .slice(0, MAX_NJK_DB);
}

/** Egy NJK Életerő állapota a switcher sáv csíkjához + stat labeljéhez. */
export interface ÉleterőStat {
  maradék: number;   // aktuális ÉP (max - kitöltött sebrubrika)
  max: number;       // ÉP maximum
  arány: number;     // maradék / max, [0,1] (üres/0 max esetén 1)
  sKategória: number; // sérülés-kategória 0..N (0 = sértetlen; N = kategóriák száma)
}

/**
 * Egy karakter Életerő statja a switcher sávhoz. Az ÉP-t a reactive engine adja
 * (nem hardcode-oljuk a formulát - data-layer elsőbbség), a betöltött sebrubrikák
 * száma a `session.sebzések` (FP = fájdalompont NEM ÉP-vesztés → kihagyva).
 *
 * @param karakter a betöltött NJK
 * @param data GameData (rules + konstansok)
 */
export function életerőStat(karakter: Karakter, data: GameData): ÉleterőStat {
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, data.konstansok);
  const max = evaluate(data.rules, ctx).get('ÉP') ?? 0;
  // Minden kitöltött rubrika beleszámít (FP is) - az EpTable is így számol (ÉP({ÉP - kitöltött})).
  const kitöltött = karakter.session.sebzések.length;
  const maradék = Math.max(0, max - kitöltött);
  const kategóriák = data.konstansok.sebesülés_kategóriák_száma;
  const oszlopMéret = max / kategóriák;
  const sKategória = kitöltött === 0 || oszlopMéret <= 0
    ? 0
    : Math.min(kategóriák, Math.ceil(kitöltött / oszlopMéret));
  return { maradék, max, arány: max > 0 ? maradék / max : 1, sKategória };
}

/** Egy NJK gyors harcértékei a chip-tooltiphez / fejléchez. */
export interface HarcértékStat {
  KÉ: number;
  TÉ: number | null;   // aktív fegyver TÉ-je; null, ha nincs értelmezhető fegyver
  VÉ: number | null;   // aktív fegyver VÉ-je (fogás/pajzs bónusszal), null ha nincs
}

/**
 * Egy karakter aktuális KÉ/TÉ/VÉ harcértékei - gyors áttekintéshez (NJK switcher chip
 * tooltip + aktív NJK fejléc-box). A HarcScreen-nel AZONOS pure building blockokat
 * használja (buildFegyverRows + calcFegyverResults + resolveAktívFegyverContext), hogy
 * ne duplikálódjon a kalkuláció - a karakter SAJÁT session-je szerinti aktív fegyvert
 * veszi (taktika/helyzet/fortély nélkül: ez a nyugalmi harcérték, a részletes bontás
 * továbbra is a Harc fülön). A KÉ reactive, taktika/fortély KÉ-mod nélkül (gyors becslés).
 */
export function njkHarcértékStat(karakter: Karakter, data: GameData): HarcértékStat {
  const k = karakter;
  const { konstansok } = data;

  // KÉ: tiszta reactive (tulajdonság + tsz), session-független.
  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok);
  const KÉ = evaluate(data.rules, ctx).get('KÉ') ?? 0;

  // TÉ/VÉ: az aktív fegyver harcértékei a közös pure kalkulációból.
  const harcmodorÖsszeg = calcHarcmodorÖsszeg(k,
    [...new Set(Object.values(konstansok.fegyver_kategória_harcmodor) as string[])]);
  const merevvértFok = fortélyFok(k, 'Merevvértviselet');
  const lookupArrays = buildPancelLookups(konstansok);

  const stringCtx = new Map<string, string>([
    ['páncél_alap', k.páncél.alap],
    ['páncél_fémalapanyag', k.páncél.fémalapanyag],
    ['páncél_kidolgozottság', k.páncél.kidolgozottság],
    ['páncél_méret_illeszkedés', k.páncél.méret_illeszkedés],
  ]);

  const pajzsFegyverNév = buildPajzsFegyverNév(k);
  const fegyverRows = buildFegyverRows(k, data, pajzsFegyverNév);
  const fegyverResults = calcFegyverResults(
    fegyverRows, k, data, NO_FORTELY_MODS, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx,
  );
  const { pajzsVÉ, fogásResult } = calcFogás(k, k.session, data, NO_FORTELY_MODS);

  const aktív = resolveAktívFegyverContext(
    { fegyverResults, kétkezesResult: null, fogásResult, pajzsVÉ, pajzsFegyverNév },
    k, k.session, data,
  );

  return {
    KÉ,
    TÉ: aktív ? aktív.result.TÉ + aktív.téExtra : null,
    VÉ: aktív ? computeVÉ(aktív.result.VÉ, aktív.veBónusz, 0, k.session.vé_csökkenés) : null,
  };
}

/** Üres fortély-mod map (a gyors stat nem alkalmaz taktika/fortély módosítót). */
const NO_FORTELY_MODS: Record<string, number> = {};
