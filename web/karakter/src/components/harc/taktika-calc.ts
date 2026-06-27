import type { Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';

/** Taktika módosítók kiszámítása */
export function calcTaktikaMods(session: Session, data: GameData): Record<string, number> {
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      let fokDef = def.fokok.find(f => f.fok === at.fok);
      if (!fokDef && def.fortély_bővítés) {
        const utolsó = def.fokok[def.fokok.length - 1];
        const perFok: Record<string, number> = {};
        for (const [k, v] of Object.entries(utolsó)) { if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok; }
        fokDef = { fok: at.fok } as typeof utolsó;
        for (const [k, step] of Object.entries(perFok)) (fokDef as any)[k] = Math.round(step * at.fok);
      }
      if (fokDef) {
        if (fokDef.TÉ) mods['TÉ'] += fokDef.TÉ;
        if (fokDef.VÉ) mods['VÉ'] += fokDef.VÉ;
        if (fokDef.KÉ) mods['KÉ'] += fokDef.KÉ;
        if (fokDef.SP) mods['SP'] += fokDef.SP;
      }
    } else if (def.módosítók) {
      if (def.módosítók.TÉ) mods['TÉ'] += def.módosítók.TÉ;
      if (def.módosítók.VÉ) mods['VÉ'] += def.módosítók.VÉ;
      if (def.módosítók.KÉ) mods['KÉ'] += def.módosítók.KÉ;
      if (def.módosítók.SP) mods['SP'] += def.módosítók.SP;
    }
  }
  const véLimit = data.konstansok.taktika_vé_eltolás_limit;
  mods['VÉ'] = Math.max(-véLimit, Math.min(véLimit, mods['VÉ']));
  return mods;
}
