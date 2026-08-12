/**
 * Collect active Előny/Hátrány and static SP effects on Támadó dobás and Sebzésdobás.
 * Informational only — not wired into roll logic yet.
 */

import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { HarciHelyzetEntry, TaktikaEntry, StatuszHatas, FortelySummary } from '../../engine/data-types';

export interface DobásHatás {
  forrás: string;       // e.g. "Meglepetés", "Visszafogott (2)"
  cél: 'té_dobás' | 'sebzésdobás';
  operátor: 'előny' | 'hátrány' | 'enyhít' | 'szöveges';
  érték: number;        // positive for Előny, negative for Hátrány, abs for enyhít
  megjegyzés?: string;
}

export interface SpBónusz {
  forrás: string;       // e.g. "Roham", "Támadás erőből (2)"
  érték: number;        // static SP bonus
}

export interface DobásInfo {
  /** Előny/Hátrány effects on TÉ roll */
  téHatások: DobásHatás[];
  /** Előny/Hátrány effects on Sebzés roll */
  sebzésHatások: DobásHatás[];
  /** Static SP bonuses from taktikák */
  spBónuszok: SpBónusz[];
  /** Taktika notes relevant to Támadó dobás (e.g. "nincs támadódobás") */
  téMegjegyzések: { forrás: string; szöveg: string }[];
  /** Taktika notes relevant to Sebzésdobás (e.g. "Sebzés: 0") */
  sebzésMegjegyzések: { forrás: string; szöveg: string }[];
}

/** Extract hatások relevant to TÉ/Sebzés from a StatuszHatas array. */
function extractHatások(hatások: StatuszHatas[] | undefined, forrás: string): DobásHatás[] {
  if (!hatások) return [];
  const result: DobásHatás[] = [];
  for (const h of hatások) {
    if (h.cél !== 'té_dobás' && h.cél !== 'sebzésdobás') continue;
    if (h.operátor !== 'előny' && h.operátor !== 'hátrány' && h.operátor !== 'enyhít' && h.operátor !== 'szöveges') continue;
    result.push({
      forrás,
      cél: h.cél as 'té_dobás' | 'sebzésdobás',
      operátor: h.operátor as DobásHatás['operátor'],
      érték: h.érték ?? 0,
      megjegyzés: h.megjegyzés,
    });
  }
  return result;
}

/**
 * Compute all active effects on TÉ dobás and Sebzésdobás from:
 *  - aktív harci helyzetek
 *  - aktív taktikák (fokok hatásai + SP módosítók)
 *  - aktív státuszok
 *  - karakter fortélyok (feltételes módosítók on té_dobás/sebzésdobás)
 */
export function collectDobásInfo(session: Session, karakter: Karakter, data: GameData): DobásInfo {
  const téHatások: DobásHatás[] = [];
  const sebzésHatások: DobásHatás[] = [];
  const spBónuszok: SpBónusz[] = [];
  const téMegjegyzések: { forrás: string; szöveg: string }[] = [];
  const sebzésMegjegyzések: { forrás: string; szöveg: string }[] = [];

  // Build aktívFeltételek Set for fortély feltétel checking
  const aktívFeltételek = new Set<string>();
  for (const h of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(d => d.név === h);
    if (def) aktívFeltételek.add(def.feltétel_kulcs);
  }
  for (const t of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(d => d.név === t.név);
    if (def) aktívFeltételek.add(def.feltétel_kulcs);
  }
  aktívFeltételek.add(`fegyverfogás:${session.fegyverfogás}`);

  // 1. Harci helyzetek
  for (const név of session.aktív_helyzetek) {
    const def = (data.harciHelyzetek as HarciHelyzetEntry[]).find(h => h.név === név);
    if (!def?.hatások) continue;
    const effects = extractHatások(def.hatások, név);
    for (const e of effects) {
      if (e.cél === 'té_dobás') téHatások.push(e);
      else sebzésHatások.push(e);
    }
  }

  // 2. Taktikák
  for (const at of session.aktív_taktikák) {
    const def = (data.taktikak as TaktikaEntry[]).find(t => t.név === at.név);
    if (!def) continue;

    // Collect megjegyzés routed to the correct popup
    if (def.megjegyzés) {
      if (/támadódobás/i.test(def.megjegyzés)) {
        téMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
      } else if (/sebz/i.test(def.megjegyzés)) {
        sebzésMegjegyzések.push({ forrás: at.név, szöveg: def.megjegyzés });
      }
    }

    // Fokozatos taktikák: hatások a fokból
    if (def.fokozatos && def.fokok) {
      const fokDef = def.fokok.find(f => f.fok === (at.fok ?? 1));
      if (fokDef) {
        // SP from fok
        if (fokDef.SP) spBónuszok.push({ forrás: `${at.név} (${fokDef.fok})`, érték: fokDef.SP });
        // Hatások (e.g. Visszafogott sebzésdobás Hátrány)
        const effects = extractHatások(fokDef.hatások, `${at.név} (${fokDef.fok})`);
        for (const e of effects) {
          if (e.cél === 'té_dobás') téHatások.push(e);
          else sebzésHatások.push(e);
        }
      }
    } else {
      // Non-fokozatos: SP from módosítók
      if (def.módosítók?.SP) spBónuszok.push({ forrás: at.név, érték: def.módosítók.SP });
    }
  }

  // 3. Státuszok — parse "Név (fok)" format
  for (const entry of session.aktív_státuszok) {
    const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
    if (!match) continue;
    const [, név, fokStr] = match;
    const fok = parseInt(fokStr);
    const def = (data.statuszok as { név: string; fokok: { fok: number; hatások?: StatuszHatas[] }[] }[])
      .find(s => s.név === név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === fok);
    if (!fokDef?.hatások) continue;
    const effects = extractHatások(fokDef.hatások, entry);
    for (const e of effects) {
      if (e.cél === 'té_dobás') téHatások.push(e);
      else sebzésHatások.push(e);
    }
  }


  // 4. Fortélyok — feltételes módosítók on té_dobás/sebzésdobás
  for (const kf of karakter.fortélyok) {
    const def = (data.fortelySummaries as FortelySummary[]).find(f => f.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.cél !== 'té_dobás' && mod.cél !== 'sebzésdobás') continue;
      if (mod.mód !== 'előny' && mod.mód !== 'hátrány' && mod.mód !== 'enyhít') continue;
      // Check feltétel against aktívFeltételek
      if (mod.feltétel && !aktívFeltételek.has(mod.feltétel)) continue;
      const forrás = kf.spec_elem ? `${kf.név} - ${kf.spec_elem}` : kf.név;
      const hatás: DobásHatás = {
        forrás,
        cél: mod.cél as 'té_dobás' | 'sebzésdobás',
        operátor: mod.mód as DobásHatás['operátor'],
        érték: mod.érték,
      };
      if (mod.cél === 'té_dobás') téHatások.push(hatás);
      else sebzésHatások.push(hatás);
    }
  }

  return { téHatások, sebzésHatások, spBónuszok, téMegjegyzések, sebzésMegjegyzések };
}

/** Sum the net Előny/Hátrány level for a given target. */
export function netElőnySzint(hatások: DobásHatás[]): number {
  let szint = 0;
  for (const h of hatások) {
    if (h.operátor === 'előny') szint += Math.abs(h.érték);
    else if (h.operátor === 'hátrány') szint -= Math.abs(h.érték);
    else if (h.operátor === 'enyhít') szint += Math.abs(h.érték); // mitigates a Hátrány
  }
  return Math.max(-2, Math.min(2, szint)); // clamp to [-2, +2]
}
