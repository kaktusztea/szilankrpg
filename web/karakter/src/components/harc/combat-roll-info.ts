/**
 * Collect active Előny/Hátrány effects on combat rolls (TÉ, CÉ, Sebzés).
 * Unified module for both közelharc and távharc dobás popups - on top of the shared effekt collector (§42).
 */

import type { Session, Karakter, FegyverAlap } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { buildAktívFeltételek } from '../../engine/feltetelek';
import { createFeltételEvaluator } from '../../engine/feltetel-eval';
import {
  gyűjtHelyzetEffektek, gyűjtTaktikaEffektek, gyűjtStátuszEffektek, gyűjtFortélyEffektek, kockaSzint, tiltásokFegyverre, type Effekt,
} from '../../engine/effekt';

type DobásCél = 'té_dobás' | 'sebzésdobás' | 'cé_dobás';

export interface DobásHatás {
  forrás: string;
  cél: DobásCél;
  operátor: 'előny' | 'hátrány' | 'enyhít' | 'szöveges';
  érték: number;
  megjegyzés?: string;
}

export interface SpBónusz {
  forrás: string;
  érték: number;
}

export interface DobásInfo {
  téHatások: DobásHatás[];
  sebzésHatások: DobásHatás[];
  spBónuszok: SpBónusz[];
  téMegjegyzések: { forrás: string; szöveg: string }[];
  sebzésMegjegyzések: { forrás: string; szöveg: string }[];
}

interface CéDobásInfo {
  céHatások: DobásHatás[];
  céMegjegyzések: { forrás: string; szöveg: string }[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const DOBÁS_MÓDOK = new Set(['előny', 'hátrány', 'enyhít', 'szöveges']);

/** A felirat-forrás: fortélynál „Név - elem", fokozatos taktikánál „Név (fok)", egyébként a forrás neve. */
function forrásCímke(e: Effekt): string {
  const f = e.forrás;
  if (f.elem) return `${f.név} - ${f.elem}`;
  if (f.fok != null) return `${f.név} (${f.fok})`;
  return f.név;
}

/**
 * Az aktív források (helyzet → taktika → státusz → fortély) dobás-hatásai a `célFilter` céljaira, forrás-sorrendben,
 * + az SP-bónuszok (taktika + fortély `SP` flat) és a taktika-megjegyzések (a hívó szűri cél szerint).
 * Forrás: a közös effekt-gyűjtő (`engine/effekt.ts`, §42); itt csak a dobás-célokra szűrés + felirat-alak.
 */
function collectSessionHatások(
  session: Session, karakter: Karakter, data: GameData, célFilter: Set<string>, fegyver?: FegyverAlap,
  teljesKiértékelő?: (feltétel: unknown) => boolean,
) {
  // A kézben lévő fegyver kulcsai (mint a fegyversor fortély-feltételei, useHarcComputed): fegyver_kategória + tiltás.
  const feltételek = buildAktívFeltételek(session, data);
  if (fegyver) {
    feltételek.add(`fegyver_kategória:${fegyver.kategória}`);
    for (const t of tiltásokFegyverre(fegyver, session, data, feltételek)) feltételek.add(`tiltás:${t.id}`);
  }
  const saját = createFeltételEvaluator(feltételek, session, new Map(), new Map(), new Map()).feltételTeljesül;
  // A „prefix:érték" kulcsokat a saját (fegyverre szabott) halmaz dönti el; a strukturált predikátumot - ha a hívó
  // átadja - a teljes harc-kontextus (computed: páncél_merev / páncél_lefedettség, tulajdonságok; useHarcComputed),
  // különben csak a session-mezők.
  const feltételTeljesül = (f: unknown) => (Array.isArray(f) && teljesKiértékelő ? teljesKiértékelő(f) : saját(f));
  const effektek = [
    ...gyűjtHelyzetEffektek(session, data),
    ...gyűjtTaktikaEffektek(session, data, karakter, feltételTeljesül),
    ...gyűjtStátuszEffektek(session, data),
    ...gyűjtFortélyEffektek(karakter, session, data, feltételek, feltételTeljesül),
  ];
  const hatások: DobásHatás[] = effektek
    .filter(e => célFilter.has(e.cél) && DOBÁS_MÓDOK.has(e.mód))
    .map(e => ({
      forrás: forrásCímke(e), cél: e.cél as DobásCél, operátor: e.mód as DobásHatás['operátor'],
      érték: e.érték ?? 0, megjegyzés: e.megjegyzés,
    }));
  // SP-bónusz: taktika mindig (a hívó dönt), fortély csak sebzésdobás-szűrőnél (mint eddig).
  const spBónuszok: SpBónusz[] = effektek
    .filter(e => e.cél === 'SP' && e.mód === 'flat' && typeof e.érték === 'number'
      && (e.forrás.típus === 'taktika' || célFilter.has('sebzésdobás')) && e.forrás.típus !== 'helyzet' && e.forrás.típus !== 'státusz')
    .map(e => ({ forrás: forrásCímke(e), érték: e.érték! }));

  const taktikaMegjegyzések: { forrás: string; szöveg: string }[] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (def?.megjegyzés) taktikaMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
  }

  return { hatások, spBónuszok, taktikaMegjegyzések };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Collect effects for TÉ dobás + Sebzésdobás (Harc fül).
 *
 * `aktívFegyver` opcionális (a kézben lévő fegyver): a fegyverfüggő fortély SP-bónusz (Pajzshasználat) a bontásban
 * (a mód-függő Erőbónusz / Mesterfegyver: `fegyverSpBónuszok`). `feltételTeljesül` opcionális: a harc-kontextus teljes
 * kiértékelője (`useHarcComputed().feltételTeljesül`) a strukturált fortély-/taktika-feltételekhez. Ha a karakter Ereje nem éri el a fegyver
 * `erő_követelmény`-ét (md/064_02_06 "Fegyverek Erő követelménye"), Hátrány kerül
 * a Támadó (TÉ) dobásra (mértéke: konstansok.yaml → fegyver_erő_követelmény_hátrány).
 */
export function collectDobásInfo(
  session: Session, karakter: Karakter, data: GameData, aktívFegyver?: FegyverAlap,
  feltételTeljesül?: (feltétel: unknown) => boolean,
): DobásInfo {
  const { hatások, spBónuszok, taktikaMegjegyzések } = collectSessionHatások(
    session, karakter, data, new Set(['té_dobás', 'sebzésdobás']), aktívFegyver, feltételTeljesül);
  const téHatások = hatások.filter(e => e.cél === 'té_dobás');
  const sebzésHatások = hatások.filter(e => e.cél !== 'té_dobás');
  const téMegjegyzések = taktikaMegjegyzések.filter(m => /támadódobás/i.test(m.szöveg));
  const sebzésMegjegyzések = taktikaMegjegyzések.filter(m => !/támadódobás/i.test(m.szöveg) && /sebz/i.test(m.szöveg));

  if (aktívFegyver && karakter.tulajdonságok.erő < aktívFegyver.erő_követelmény) {
    téHatások.push({
      forrás: `${aktívFegyver.név}\n(Erő hiány)`, cél: 'té_dobás', operátor: 'hátrány',
      érték: data.konstansok.fegyver_erő_követelmény_hátrány,
    });
  }

  return { téHatások, sebzésHatások, spBónuszok, téMegjegyzések, sebzésMegjegyzések };
}

/**
 * A fegyver-mód SP-jében lévő Erőbónusz + Mesterfegyver tag a Sebzés popup bontásához (a mód saját, fegyver-calc
 * által számolt értékeiből - mód-függő Erőlimit). Nulla tag kimarad.
 */
export function fegyverSpBónuszok(mód: { sp_erőbónusz?: number; sp_mf?: number } | undefined, fegyverNév?: string): SpBónusz[] {
  const ki: SpBónusz[] = [];
  if (mód?.sp_erőbónusz) ki.push({ forrás: 'Erőbónusz', érték: mód.sp_erőbónusz });
  if (mód?.sp_mf) ki.push({ forrás: fegyverNév ? `Mesterfegyver - ${fegyverNév}` : 'Mesterfegyver', érték: mód.sp_mf });
  return ki;
}

/** Collect effects for CÉ dobás (Távharc fül). */
export function collectCéDobásInfo(session: Session, karakter: Karakter, data: GameData): CéDobásInfo {
  const { hatások, taktikaMegjegyzések } = collectSessionHatások(session, karakter, data, new Set(['cé_dobás']));
  // Az aktív távfegyver harcmodora (kisbetűsítve) - a szűrő_harcmodoros taktikák megjegyzés-szűréséhez.
  const tfPeldany = karakter.távfegyverek[session.aktív_távfegyver_index];
  const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;
  const aktívHarcmodor = (tfDef?.harcmodor ?? '').toLowerCase();
  const céMegjegyzések = taktikaMegjegyzések.filter(m => {
    if (!/cé|célz/i.test(m.szöveg)) return false;
    // Ha a forrás-taktikának van szűrő_harcmodorok-ja és az aktív távfegyver NEM egyezik, a megjegyzés
    // félrevezető (a CÉ-bónusz úgysem érvényesül, l. getFortélyCÉ) → kihagyjuk.
    const tDef = data.taktikak.find(t => t.név === m.forrás);
    if (tDef?.szűrő_harcmodorok?.length && !tDef.szűrő_harcmodorok.includes(aktívHarcmodor)) return false;
    return true;
  });
  return { céHatások: hatások, céMegjegyzések };
}

/** A hatás-lista nettó Előny/Hátrány szintje (előjeles összeg, clamp [-2,+2]) - `kockaSzint` (§42.3). */
export function netElőnySzint(hatások: DobásHatás[]): number {
  return kockaSzint(hatások.map(h => ({ mód: h.operátor, érték: h.érték })));
}

/** Sebzésjelleg × páncélosztály → SP delta (a data layer mátrixból). Ismeretlen jelleg/osztály → 0. */
export function sebzésPáncélDelta(
  mátrix: import('../../engine/data-types').SebzésjellegPáncélMátrix,
  jelleg: string | undefined,
  osztály: import('../../engine/data-types').Páncélosztály,
): number {
  if (!jelleg) return 0;
  return mátrix.matrix[jelleg]?.[osztály] ?? 0;
}

/** A durva `cél_páncél` kategória a választott páncélosztályból: csupasz→vérttelen, egyéb→páncélos. */
export function célPáncélKategória(
  osztály: import('../../engine/data-types').Páncélosztály,
): 'vérttelen' | 'páncélos' {
  return osztály === 'csupasz' ? 'vérttelen' : 'páncélos';
}

/**
 * Távfegyver `sebzésjelleg` betű → a Sebzésjelleg×páncél mátrix teljes-szavas kulcsa.
 * Kanonikus betűk (extrak.schema.yaml `ellenfél_fegyver_sebzésjelleg`): S=szúró, V=vágó, Z=zúzó.
 * A közelharci fegyver v2 `jelleg` MÁR teljes szó - ott nincs szükség konverzióra.
 * `spec` → undefined (speciális sebzés, nincs páncélmátrix-interakció → nincs páncélválasztó).
 * ponytail: a `V` a `vágó-egyenes` sorra képződik (semlegesebb vágó). A táv-fegyveradat nem bontja
 *   egyenes/íves-re, és jelenleg EGYETLEN V-s távfegyver sincs - ha lenne, külön adatmező kéne.
 */
export function távjellegMátrixKulcs(sebzésjelleg: string): string | undefined {
  switch (sebzésjelleg) {
    case 'S': return 'szúró';
    case 'V': return 'vágó-egyenes';
    case 'Z': return 'zúzó';
    default: return undefined; // 'spec' vagy ismeretlen
  }
}


