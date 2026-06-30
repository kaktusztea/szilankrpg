import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from './shared';

/** Pengehossz lookup közös helper */
export function getPengehossz(data: GameData, alap: string): number {
  return parseFloat(lookupFegyver(data.fegyverek, alap)?.Pengehossz ?? '0') || 0;
}

/** Fegyver opciók listázása */
export function buildFegyverOpciók(karakter: Karakter, data: GameData) {
  const pajzsNév = buildPajzsFegyverNév(karakter);
  return [
    { név: 'Puszta kéz', idx: -1 },
    ...karakter.fegyverek.map((f, i) => {
      const fd = lookupFegyver(data.fegyverek, f.alap);
      return { név: fd?.Alapnév || f.alap, idx: i };
    }),
    ...(pajzsNév ? [{ név: pajzsNév, idx: -2 }] : []),
  ];
}
