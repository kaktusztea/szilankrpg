/**
 * Collect active Előny/Hátrány effects on combat rolls (TÉ, CÉ, Sebzés).
 * Unified module for both közelharc and távharc dobás popups.
 */

import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { HarciHelyzetEntry, TaktikaEntry, StatuszHatas, FortelySummary } from '../../engine/data-types';

export type DobásCél = 'té_dobás' | 'sebzésdobás' | 'cé_dobás';

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

export interface CéDobásInfo {
  céHatások: DobásHatás[];
  céMegjegyzések: { forrás: string; szöveg: string }[];
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function extractHatások(hatások: StatuszHatas[] | undefined, forrás: string, célFilter: Set<string>): DobásHatás[] {
  if (!hatások) return [];
  const result: DobásHatás[] = [];
  for (const h of hatások) {
    if (!célFilter.has(h.cél)) continue;
    if (h.operátor !== 'előny' && h.operátor !== 'hátrány' && h.operátor !== 'enyhít' && h.operátor !== 'szöveges') continue;
    result.push({
      forrás,
      cél: h.cél as DobásCél,
      operátor: h.operátor as DobásHatás['operátor'],
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
    const def = (data.fortelySummaries as FortelySummary[]).find(f => f.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.feltétel && !aktívFeltételek.has(mod.feltétel)) continue;
      const forrás = kf.spec_elem ? `${kf.név} - ${kf.spec_elem}` : kf.név;
      if (mod.cél === 'SP' && mod.mód === 'flat' && célFilter.has('sebzésdobás')) {
        spBónuszok.push({ forrás, érték: mod.érték });
        continue;
      }
      if (!célFilter.has(mod.cél)) continue;
      if (mod.mód !== 'előny' && mod.mód !== 'hátrány' && mod.mód !== 'enyhít') continue;
      hatások.push({ forrás, cél: mod.cél as DobásCél, operátor: mod.mód as DobásHatás['operátor'], érték: mod.érték });
    }
  }
  return { hatások, spBónuszok };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Collect effects for TÉ dobás + Sebzésdobás (Harc fül).
 */
export function collectDobásInfo(session: Session, karakter: Karakter, data: GameData): DobásInfo {
  const célFilter = new Set(['té_dobás', 'sebzésdobás']);
  const téHatások: DobásHatás[] = [];
  const sebzésHatások: DobásHatás[] = [];
  const spBónuszok: SpBónusz[] = [];
  const téMegjegyzések: { forrás: string; szöveg: string }[] = [];
  const sebzésMegjegyzések: { forrás: string; szöveg: string }[] = [];
  const aktívFeltételek = buildAktívFeltételekSet(session, data);

  // 1. Harci helyzetek
  for (const név of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(h => h.név === név);
    if (!def?.hatások) continue;
    for (const e of extractHatások(def.hatások, név, célFilter)) {
      (e.cél === 'té_dobás' ? téHatások : sebzésHatások).push(e);
    }
  }

  // 2. Taktikák
  for (const at of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(t => t.név === at.név);
    if (!def) continue;
    if (def.megjegyzés) {
      if (/támadódobás/i.test(def.megjegyzés)) téMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
      else if (/sebz/i.test(def.megjegyzés)) sebzésMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
    }
    if (def.fokozatos && def.fokok) {
      const fokDef = def.fokok.find(f => f.fok === (at.fok ?? 1));
      if (fokDef) {
        if (fokDef.SP) spBónuszok.push({ forrás: `${at.név} (${fokDef.fok})`, érték: fokDef.SP });
        for (const e of extractHatások(fokDef.hatások, `${at.név} (${fokDef.fok})`, célFilter)) {
          (e.cél === 'té_dobás' ? téHatások : sebzésHatások).push(e);
        }
      }
    } else {
      if (def.módosítók?.SP) spBónuszok.push({ forrás: at.név, érték: def.módosítók.SP });
    }
  }

  // 3. Státuszok
  for (const entry of session.aktív_státuszok) {
    const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
    if (!match) continue;
    const [, név, fokStr] = match;
    const fok = parseInt(fokStr);
    const def = (data.statuszok as { név: string; fokok: { fok: number; hatások?: StatuszHatas[] }[] }[]).find(s => s.név === név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === fok);
    if (!fokDef?.hatások) continue;
    for (const e of extractHatások(fokDef.hatások, entry, célFilter)) {
      (e.cél === 'té_dobás' ? téHatások : sebzésHatások).push(e);
    }
  }

  // 4. Fortélyok
  const fort = collectFortélyHatások(karakter, data, aktívFeltételek, célFilter);
  for (const e of fort.hatások) (e.cél === 'té_dobás' ? téHatások : sebzésHatások).push(e);
  spBónuszok.push(...fort.spBónuszok);

  return { téHatások, sebzésHatások, spBónuszok, téMegjegyzések, sebzésMegjegyzések };
}

/**
 * Collect effects for CÉ dobás (Távharc fül).
 */
export function collectCéDobásInfo(session: Session, karakter: Karakter, data: GameData): CéDobásInfo {
  const célFilter = new Set(['cé_dobás']);
  const céHatások: DobásHatás[] = [];
  const céMegjegyzések: { forrás: string; szöveg: string }[] = [];
  const aktívFeltételek = buildAktívFeltételekSet(session, data);

  // 1. Harci helyzetek
  for (const név of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(h => h.név === név);
    if (!def?.hatások) continue;
    céHatások.push(...extractHatások(def.hatások, név, célFilter));
  }

  // 2. Taktikák
  for (const at of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(t => t.név === at.név);
    if (!def) continue;
    if (def.megjegyzés && /cé|célz/i.test(def.megjegyzés)) {
      céMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
    }
    if (def.fokozatos && def.fokok) {
      const fokDef = def.fokok.find(f => f.fok === (at.fok ?? 1));
      if (fokDef) céHatások.push(...extractHatások(fokDef.hatások, `${at.név} (${fokDef.fok})`, célFilter));
    }
  }

  // 3. Státuszok
  for (const entry of session.aktív_státuszok) {
    const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
    if (!match) continue;
    const [, név, fokStr] = match;
    const fok = parseInt(fokStr);
    const def = (data.statuszok as { név: string; fokok: { fok: number; hatások?: StatuszHatas[] }[] }[]).find(s => s.név === név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === fok);
    if (!fokDef?.hatások) continue;
    céHatások.push(...extractHatások(fokDef.hatások, entry, célFilter));
  }

  // 4. Fortélyok
  const fort = collectFortélyHatások(karakter, data, aktívFeltételek, célFilter);
  céHatások.push(...fort.hatások);

  return { céHatások, céMegjegyzések };
}

/** Sum the net Előny/Hátrány level for a given set of effects. */
export function netElőnySzint(hatások: DobásHatás[]): number {
  let szint = 0;
  for (const h of hatások) {
    if (h.operátor === 'előny') szint += Math.abs(h.érték);
    else if (h.operátor === 'hátrány') szint -= Math.abs(h.érték);
    else if (h.operátor === 'enyhít') szint += Math.abs(h.érték);
  }
  return Math.max(-2, Math.min(2, szint));
}
