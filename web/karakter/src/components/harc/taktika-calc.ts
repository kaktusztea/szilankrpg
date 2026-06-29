import type { Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { interpolateFokDef } from '../aktiv/taktika-helpers';

/** Taktika módosítók kiszámítása */
export function calcTaktikaMods(session: Session, data: GameData): Record<string, number> {
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = interpolateFokDef(def.fokok, at.fok, !!def.fortély_bővítés);
      if (fokDef) {
        if (fokDef.TÉ) mods['TÉ'] += fokDef.TÉ as number;
        if (fokDef.VÉ) mods['VÉ'] += fokDef.VÉ as number;
        if (fokDef.KÉ) mods['KÉ'] += fokDef.KÉ as number;
        if (fokDef.SP) mods['SP'] += fokDef.SP as number;
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
