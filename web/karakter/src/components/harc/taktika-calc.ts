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
  const CÉLOK = ['KÉ', 'TÉ', 'VÉ', 'SP'] as const;
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  const letiltva = karakter ? collectTaktikaLetiltások(karakter, data) : new Set<string>();
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    const tiltott = (cél: string) => letiltva.has(`${def.feltétel_kulcs}|${cél}`);
    // Forrás fok-def (fokozatos) vagy statikus módosítók — mindkettő {KÉ,TÉ,VÉ,SP}? alakú.
    let forrás: Partial<Record<typeof CÉLOK[number], number>> | undefined;
    if (def.fokozatos && def.fokok && at.fok != null) {
      forrás = interpolateFokDef(def.fokok, at.fok, !!def.fortély_bővítés || !!def.skálázható) as typeof forrás;
    } else if (def.módosítók) {
      forrás = def.módosítók;
    }
    if (!forrás) continue;
    for (const cél of CÉLOK) {
      const érték = forrás[cél];
      if (érték && !tiltott(cél)) mods[cél] += érték as number;
    }
  }
  const véLimit = data.konstansok.taktika_vé_eltolás_limit;
  mods['VÉ'] = Math.max(-véLimit, Math.min(véLimit, mods['VÉ']));
  return mods;
}
