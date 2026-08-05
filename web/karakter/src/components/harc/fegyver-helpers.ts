import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from './shared';

/** Pengehossz lookup közös helper */
export function getPengehossz(data: GameData, alap: string): number {
  return parseFloat(lookupFegyver(data.fegyverek, alap)?.Pengehossz ?? '0') || 0;
}

/**
 * Kétkezes fogás elérhető-e az adott jobb kéz fegyverrel.
 * Egyazon fegyver mindkét kézben is megengedett (pl. 2 db tőr, §26), ezért
 * elég 1 nem-hárító fegyver — a jobb kéz fegyvere önmagával párosítható.
 */
export function kétkezesLehetséges(data: GameData, karakter: Karakter, jobbIdx: number): boolean {
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  if (!jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz') return false;
  if (lookupFegyver(data.fegyverek, jobbFp.alap)?.['Forgatás módja'] === 'kétkezes') return false;
  return karakter.fegyverek.some(fp =>
    fp.alap.toLowerCase() !== 'puszta kéz' &&
    lookupFegyver(data.fegyverek, fp.alap)?.Hárító !== '1');
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
