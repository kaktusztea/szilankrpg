// Barrel re-export: backward compatibility for existing imports
export { isTaktikaAllowed, getTaktikaMods } from './taktika-helpers';
export { isHelyzetAvailable, getMinPengeWarning, getHelyzetInfoText } from './helyzet-helpers';

import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';

/** Pengehossz lookup közös helper */
export function getPengehossz(data: GameData, alap: string): number {
  return parseFloat(lookupFegyver(data.fegyverek, alap)?.Pengehossz ?? '0') || 0;
}

/** Fegyver opciók listázása */
export function buildFegyverOpciók(karakter: Karakter, data: GameData) {
  return [
    { név: 'Puszta kéz', idx: -1 },
    ...karakter.fegyverek.map((f, i) => {
      const fd = lookupFegyver(data.fegyverek, f.alap);
      return { név: fd?.Alapnév || f.alap, idx: i };
    }),
    ...(karakter.pajzs?.méret ? [{ név: karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs', idx: -2 }] : []),
  ];
}
