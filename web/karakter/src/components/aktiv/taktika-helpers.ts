import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver, képzettségSzint, fortélyFok } from '../../engine/utils';

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

/** Taktika engedélyezett-e: l. taktika-megkotes.ts (isTaktikaAllowed). */

/** Taktika módosítók szöveges kijelzése */
export function getTaktikaMods(t: { név: string; fok?: number }, data: GameData): string[] {
  const def = data.taktikak.find(d => d.név === t.név);
  if (!def) return [];
  const mods: string[] = [];
  if (def.fokozatos && def.fokok && t.fok != null) {
    const fokDef = interpolateFokDef(def.fokok, t.fok, !!def.fortély_bővítés || !!def.skálázható);
    if (fokDef) {
      for (const [k, v] of Object.entries(fokDef)) {
        if (k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`);
      }
    }
  } else if (def.módosítók) {
    for (const [k, v] of Object.entries(def.módosítók)) {
      if (typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`);
    }
  }
  return mods;
}

/** Get taktika fokok including fortély bővítés extra fokok and harcmodor-level scaling. */
export function getExtraFokok(def: any, karakter: Karakter, data?: GameData): any[] {
  let fokok = [...def.fokok];

  // Fortély-based expansion (e.g. Támadás erőből)
  if (def.fortély_bővítés) {
    const fb = def.fortély_bővítés;
    const fbFok = fortélyFok(karakter, fb.fortély);
    const extraCount = fbFok * fb.extra_fokok_per_fok;
    const utolsó = def.fokok[def.fokok.length - 1];
    const perFok: Record<string, number> = {};
    for (const [k, v] of Object.entries(utolsó)) {
      if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok;
    }
    for (let i = 1; i <= extraCount; i++) {
      const newFok = utolsó.fok + i;
      const entry: any = { fok: newFok };
      for (const [k, step] of Object.entries(perFok)) entry[k] = Math.round(step * newFok);
      fokok.push(entry);
    }
  }

  // Harcmodor-level scaling for skálázható taktikák (absolute max fok cap)
  if (def.skálázható && data) {
    const entries = data.konstansok.skálázható_taktika_max_fok;
    if (entries) {
      // Find the active weapon's harcmodor level
      const fp = karakter.fegyverek[karakter.session?.aktív_fegyver_index ?? -1];
      const fd = fp ? lookupFegyver(data.fegyverek, fp.alap) : null;
      const harcmodorNév = fd ? (data.konstansok.fegyver_kategória_harcmodor[fd.kategória] ?? 'Közelharc') : 'Közelharc';
      const harcmodorSzint = képzettségSzint(karakter, harcmodorNév);

      // Find highest applicable absolute max_fok
      let maxFok = 0;
      for (const entry of entries) {
        if (harcmodorSzint >= entry.szint) maxFok = entry.max_fok;
      }

      // Extend fokok up to maxFok (if above current max), and truncate fortély extras if over cap
      if (maxFok > 0) {
        const currentMax = fokok[fokok.length - 1].fok;
        if (currentMax < maxFok) {
          // Extend with interpolated fokok
          const utolsó = def.fokok[def.fokok.length - 1];
          const perFok: Record<string, number> = {};
          for (const [k, v] of Object.entries(utolsó)) {
            if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok;
          }
          while (fokok[fokok.length - 1].fok < maxFok) {
            const newFok = fokok[fokok.length - 1].fok + 1;
            const entry: any = { fok: newFok };
            for (const [k, step] of Object.entries(perFok)) entry[k] = Math.round(step * newFok);
            fokok.push(entry);
          }
        } else if (currentMax > maxFok) {
          // Truncate: cap at maxFok
          fokok = fokok.filter(f => f.fok <= maxFok);
        }
      }
    }
  }

  return fokok;
}

/** Format fok modifier values as display string. */
export function formatFokMods(f: Record<string, unknown>): string {
  return Object.entries(f)
    .filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ');
}
