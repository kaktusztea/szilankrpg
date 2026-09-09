import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { interpolateFokDef } from '../aktiv/taktika-helpers';

/**
 * Collect "letilt" fortély modifiers that neutralize a specific taktika modifier.
 * Returns a Set of `"${taktika_feltétel_kulcs}|${cél}"` keys (e.g. "taktika:visszafogott|TÉ").
 * Number-independent: the taktika's contribution to that cél is dropped entirely.
 */
function collectTaktikaLetiltások(k: Karakter, data: GameData): Set<string> {
  const letiltva = new Set<string>();
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.mód === 'letilt' && typeof mod.feltétel === 'string' && mod.feltétel.startsWith('taktika:')) {
        letiltva.add(`${mod.feltétel}|${mod.cél}`);
      }
    }
  }
  return letiltva;
}

/** Taktika módosítók kiszámítása */
export function calcTaktikaMods(session: Session, data: GameData, karakter?: Karakter): Record<string, number> {
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  const letiltva = karakter ? collectTaktikaLetiltások(karakter, data) : new Set<string>();
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    const tiltott = (cél: string) => letiltva.has(`${def.feltétel_kulcs}|${cél}`);
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = interpolateFokDef(def.fokok, at.fok, !!def.fortély_bővítés || !!def.skálázható);
      if (fokDef) {
        if (fokDef.TÉ && !tiltott('TÉ')) mods['TÉ'] += fokDef.TÉ as number;
        if (fokDef.VÉ && !tiltott('VÉ')) mods['VÉ'] += fokDef.VÉ as number;
        if (fokDef.KÉ && !tiltott('KÉ')) mods['KÉ'] += fokDef.KÉ as number;
        if (fokDef.SP && !tiltott('SP')) mods['SP'] += fokDef.SP as number;
      }
    } else if (def.módosítók) {
      if (def.módosítók.TÉ && !tiltott('TÉ')) mods['TÉ'] += def.módosítók.TÉ;
      if (def.módosítók.VÉ && !tiltott('VÉ')) mods['VÉ'] += def.módosítók.VÉ;
      if (def.módosítók.KÉ && !tiltott('KÉ')) mods['KÉ'] += def.módosítók.KÉ;
      if (def.módosítók.SP && !tiltott('SP')) mods['SP'] += def.módosítók.SP;
    }
  }
  const véLimit = data.konstansok.taktika_vé_eltolás_limit;
  mods['VÉ'] = Math.max(-véLimit, Math.min(véLimit, mods['VÉ']));
  return mods;
}
