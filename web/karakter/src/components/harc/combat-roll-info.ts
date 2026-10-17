/**
 * Collect active Előny/Hátrány effects on combat rolls (TÉ, CÉ, Sebzés).
 * Unified module for both közelharc and távharc dobás popups.
 */

import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { HarciHelyzetEntry, TaktikaEntry, StatuszHatas, FortelySummary } from '../../engine/data-types';
import { clampEHSzint } from '../../engine/dice';

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

function extractHatások(hatások: StatuszHatas[] | undefined, forrás: string, célFilter: Set<string>): DobásHatás[] {
  if (!hatások) return [];
  const result: DobásHatás[] = [];
  for (const h of hatások) {
    if (!célFilter.has(h.cél)) continue;
    const op = h.mód;
    if (op !== 'előny' && op !== 'hátrány' && op !== 'enyhít' && op !== 'szöveges') continue;
    result.push({
      forrás,
      cél: h.cél as DobásCél,
      operátor: op as DobásHatás['operátor'],
      érték: h.érték ?? 0,
      megjegyzés: h.megjegyzés,
    });
  }
  return result;
}

function buildAktívFeltételekSet(session: Session, data: GameData): Set<string> {
  const set = new Set<string>();
  for (const h of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(d => d.név === h);
    if (def) set.add(def.feltétel_kulcs);
  }
  for (const t of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(d => d.név === t.név);
    if (def) set.add(def.feltétel_kulcs);
  }
  set.add(`fegyverfogás:${session.fegyverfogás}`);
  return set;
}

function collectFortélyHatások(
  karakter: Karakter, data: GameData, aktívFeltételek: Set<string>, célFilter: Set<string>
): { hatások: DobásHatás[]; spBónuszok: SpBónusz[] } {
  const hatások: DobásHatás[] = [];
  const spBónuszok: SpBónusz[] = [];
  for (const kf of karakter.fortélyok) {
    const def = (data.fortelySummaries as FortelySummary[]).find(f => f.id === kf.id);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.feltétel && !aktívFeltételek.has(mod.feltétel)) continue;
      const forrás = kf.elem ? `${def.név} - ${kf.elem}` : def.név;
      if (mod.cél === 'SP' && mod.mód === 'flat' && célFilter.has('sebzésdobás')) {
        spBónuszok.push({ forrás, érték: mod.érték });
        continue;
      }
      if (!célFilter.has(mod.cél)) continue;
      if (mod.mód !== 'előny' && mod.mód !== 'hátrány' && mod.mód !== 'enyhít' && mod.mód !== 'szöveges') continue;
      hatások.push({ forrás, cél: mod.cél as DobásCél, operátor: mod.mód as DobásHatás['operátor'], érték: mod.érték });
    }
  }
  return { hatások, spBónuszok };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Az aktív források (helyzet → taktika → státusz → fortély) dobás-hatásai a `célFilter` céljaira, forrás-sorrendben,
 * + a taktikák SP-bónuszai és megjegyzései (a hívó szűri cél szerint).
 */
function collectSessionHatások(session: Session, karakter: Karakter, data: GameData, célFilter: Set<string>) {
  const hatások: DobásHatás[] = [];
  const spBónuszok: SpBónusz[] = [];
  const taktikaMegjegyzések: { forrás: string; szöveg: string }[] = [];

  // 1. Harci helyzetek
  for (const név of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(h => h.név === név);
    if (def?.hatások) hatások.push(...extractHatások(def.hatások, név, célFilter));
  }

  // 2. Taktikák (fokozatosnál a választott fok)
  for (const at of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(t => t.név === at.név);
    if (!def) continue;
    if (def.megjegyzés) taktikaMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
    if (def.fokozatos && def.fokok) {
      const fokDef = def.fokok.find(f => f.fok === (at.fok ?? 1));
      if (!fokDef) continue;
      const forrás = `${at.név} (${fokDef.fok})`;
      if (fokDef.SP) spBónuszok.push({ forrás, érték: fokDef.SP });
      hatások.push(...extractHatások(fokDef.hatások, forrás, célFilter));
    } else {
      if (def.módosítók?.SP) spBónuszok.push({ forrás: at.név, érték: def.módosítók.SP });
      hatások.push(...extractHatások(def.hatások, at.név, célFilter));
    }
  }

  // 3. Státuszok ("Név (fok)")
  for (const entry of session.aktív_státuszok) {
    const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
    if (!match) continue;
    const [, név, fokStr] = match;
    const def = (data.statuszok as { név: string; fokok: { fok: number; hatások?: StatuszHatas[] }[] }[]).find(s => s.név === név);
    const fokDef = def?.fokok.find(f => f.fok === parseInt(fokStr, 10));
    if (fokDef?.hatások) hatások.push(...extractHatások(fokDef.hatások, entry, célFilter));
  }

  // 4. Fortélyok
  const fort = collectFortélyHatások(karakter, data, buildAktívFeltételekSet(session, data), célFilter);
  hatások.push(...fort.hatások);
  spBónuszok.push(...fort.spBónuszok);

  return { hatások, spBónuszok, taktikaMegjegyzések };
}

/**
 * Collect effects for TÉ dobás + Sebzésdobás (Harc fül).
 *
 * `aktívFegyver` opcionális: ha megadva és a karakter Ereje nem éri el a fegyver
 * `erő_követelmény`-ét (md/064_02_06 "Fegyverek Erő követelménye"), Hátrány kerül
 * a Támadó (TÉ) dobásra (mértéke: konstansok.yaml → fegyver_erő_követelmény_hátrány).
 */
export function collectDobásInfo(
  session: Session, karakter: Karakter, data: GameData, aktívFegyver?: { erő_követelmény: number; név: string },
): DobásInfo {
  const { hatások, spBónuszok, taktikaMegjegyzések } = collectSessionHatások(session, karakter, data, new Set(['té_dobás', 'sebzésdobás']));
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

/** Collect effects for CÉ dobás (Távharc fül). */
export function collectCéDobásInfo(session: Session, karakter: Karakter, data: GameData): CéDobásInfo {
  const { hatások, taktikaMegjegyzések } = collectSessionHatások(session, karakter, data, new Set(['cé_dobás']));
  return { céHatások: hatások, céMegjegyzések: taktikaMegjegyzések.filter(m => /cé|célz/i.test(m.szöveg)) };
}

/** Sum the net Előny/Hátrány level for a given set of effects. */
export function netElőnySzint(hatások: DobásHatás[]): number {
  // ELŐJELES konvenció: előny +, hátrány −, enyhít + (lásd konstansok.effekt_módok / engine_spec §42).
  let szint = 0;
  for (const h of hatások) {
    if (h.operátor === 'előny' || h.operátor === 'hátrány' || h.operátor === 'enyhít') szint += h.érték;
  }
  return clampEHSzint(szint);
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


