import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from './shared';

/** Fegyverhossz-kategória lookup közös helper */
export function getFegyverhossz(data: GameData, alap: string): number {
  return lookupFegyver(data.fegyverek, alap)?.fegyverhossz ?? 0;
}

/** Hárítófegyver-e (a `Hárító: ` névprefix jelöli, l. `fegyverek_fixed.json`). */
export function isHárító(fDef: { név: string } | undefined): boolean {
  return fDef?.név.startsWith('Hárító: ') ?? false;
}

/**
 * Kétkezes fogás elérhető-e az adott jobb kéz fegyverrel.
 * Egyazon fegyver mindkét kézben is megengedett (pl. 2 db tőr, §26), ezért
 * elég 1 nem-hárító fegyver - a jobb kéz fegyvere önmagával párosítható.
 */
export function kétkezesLehetséges(data: GameData, karakter: Karakter, jobbIdx: number): boolean {
  const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
  if (!jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz') return false;
  const jobbDef = lookupFegyver(data.fegyverek, jobbFp.alap);
  if (jobbDef?.módok.some(m => m.Forgatás === 'kétkezes')) return false;
  return karakter.fegyverek.some(fp =>
    fp.alap.toLowerCase() !== 'puszta kéz' &&
    !isHárító(lookupFegyver(data.fegyverek, fp.alap)));
}

/** Fegyver opciók listázása */
export function buildFegyverOpciók(karakter: Karakter, data: GameData) {
  const pajzsNév = buildPajzsFegyverNév(karakter);
  return [
    { név: 'Puszta kéz', idx: -1 },
    ...karakter.fegyverek.map((f, i) => {
      const fd = lookupFegyver(data.fegyverek, f.alap);
      return { név: fd?.név || f.alap, idx: i };
    }),
    ...(pajzsNév ? [{ név: pajzsNév, idx: -2 }] : []),
  ];
}
