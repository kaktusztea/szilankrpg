/**
 * Collect active Előny/Hátrány effects on CÉ dobás.
 * Mirror of combat-roll-info.ts but for távharc (cé_dobás target).
 */

import type { Session, Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { HarciHelyzetEntry, TaktikaEntry, StatuszHatas, FortelySummary } from '../../engine/data-types';

export interface CéDobásHatás {
  forrás: string;
  cél: 'cé_dobás';
  operátor: 'előny' | 'hátrány' | 'enyhít' | 'szöveges';
  érték: number;
  megjegyzés?: string;
}

export interface CéDobásInfo {
  céHatások: CéDobásHatás[];
  céMegjegyzések: { forrás: string; szöveg: string }[];
}

function extractCéHatások(hatások: StatuszHatas[] | undefined, forrás: string): CéDobásHatás[] {
  if (!hatások) return [];
  const result: CéDobásHatás[] = [];
  for (const h of hatások) {
    if (h.cél !== 'cé_dobás') continue;
    if (h.operátor !== 'előny' && h.operátor !== 'hátrány' && h.operátor !== 'enyhít' && h.operátor !== 'szöveges') continue;
    result.push({
      forrás,
      cél: 'cé_dobás',
      operátor: h.operátor as CéDobásHatás['operátor'],
      érték: h.érték ?? 0,
      megjegyzés: h.megjegyzés,
    });
  }
  return result;
}

/**
 * Collect all active effects on CÉ dobás from:
 *  - aktív harci helyzetek
 *  - aktív taktikák (fokok hatásai)
 *  - aktív státuszok
 *  - karakter fortélyok (feltételes módosítók on cé_dobás)
 */
export function collectCéDobásInfo(session: Session, karakter: Karakter, data: GameData): CéDobásInfo {
  const céHatások: CéDobásHatás[] = [];
  const céMegjegyzések: { forrás: string; szöveg: string }[] = [];

  // Build aktívFeltételek Set
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
    céHatások.push(...extractCéHatások(def.hatások, név));
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
      if (fokDef) {
        céHatások.push(...extractCéHatások(fokDef.hatások, `${at.név} (${fokDef.fok})`));
      }
    }
  }

  // 3. Státuszok
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
    céHatások.push(...extractCéHatások(fokDef.hatások, entry));
  }

  // 4. Fortélyok — feltételes módosítók on cé_dobás
  for (const kf of karakter.fortélyok) {
    const def = (data.fortelySummaries as FortelySummary[]).find(f => f.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.cél !== 'cé_dobás') continue;
      if (mod.feltétel && !aktívFeltételek.has(mod.feltétel)) continue;
      if (mod.mód !== 'előny' && mod.mód !== 'hátrány' && mod.mód !== 'enyhít') continue;
      const forrás = kf.spec_elem ? `${kf.név} - ${kf.spec_elem}` : kf.név;
      céHatások.push({
        forrás,
        cél: 'cé_dobás',
        operátor: mod.mód as CéDobásHatás['operátor'],
        érték: mod.érték,
      });
    }
  }

  return { céHatások, céMegjegyzések };
}

/** Sum the net Előny/Hátrány level for CÉ. */
export function netCéElőnySzint(hatások: CéDobásHatás[]): number {
  let szint = 0;
  for (const h of hatások) {
    if (h.operátor === 'előny') szint += Math.abs(h.érték);
    else if (h.operátor === 'hátrány') szint -= Math.abs(h.érték);
    else if (h.operátor === 'enyhít') szint += Math.abs(h.érték);
  }
  return Math.max(-2, Math.min(2, szint));
}
