import type { FegyverAlap } from './types';

/** Fegyver definíció keresése név alapján (case-insensitive) */
export function lookupFegyver(fegyverek: FegyverAlap[], alap: string): FegyverAlap | undefined {
  const lower = alap.toLowerCase();
  return fegyverek.find(d => d.Fegyver.toLowerCase() === lower);
}
