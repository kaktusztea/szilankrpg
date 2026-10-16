import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { gyűjtTaktikaEffektek, értékCélra } from '../../engine/effekt';

/**
 * Taktika módosítók (KÉ/TÉ/VÉ/SP) - a közös effekt-gyűjtőből (§42 3. fázis). A VÉ ±10 plafont a gyűjtő
 * taktika-ága alkalmazza (§42.7, B döntés); a fortély `letilt` (pl. Taktikafókusz: Visszafogott) is ott.
 */
export function calcTaktikaMods(session: Session, data: GameData, karakter?: Karakter): Record<string, number> {
  // A strukturált `hatások[]` (vé_csökkentés, sebzésdobás…) nem e négy cél egyike - a feltétel itt irreleváns.
  const eff = gyűjtTaktikaEffektek(session, data, karakter, () => false);
  return Object.fromEntries((['KÉ', 'TÉ', 'VÉ', 'SP'] as const).map(c => [c, értékCélra(eff, c)]));
}
