/**
 * GameData entity lookups (refactor phase 3). One canonical key per collection:
 * names (weapons, tactics, combat situations, statuses) case-insensitive, ids (fortély, képzettség, esemény) exact.
 * Unknown key → undefined (never throws). On duplicate keys the FIRST entry wins (same as Array.find).
 */
import type { FegyverAlap, TavfegyverAlap } from './types';
import type { GameData } from './data-types';

// shortcut: the index is cached per array identity; an array mutated after its first lookup would be stale.
// GameData is immutable after load (and the data test guards unique keys) - revisit if data ever becomes editable.
const cache = new WeakMap<readonly object[], Map<string, unknown>>();
function indexBy<T extends object>(arr: readonly T[], key: (x: T) => string): Map<string, T> {
  let m = cache.get(arr) as Map<string, T> | undefined;
  if (!m) {
    m = new Map();
    for (const x of arr) { const k = key(x); if (!m.has(k)) m.set(k, x); }
    cache.set(arr, m);
  }
  return m;
}
const kis = (s: string) => s.toLowerCase();

export const lookupFegyver = (fegyverek: readonly FegyverAlap[], név: string): FegyverAlap | undefined =>
  indexBy(fegyverek, f => kis(f.név)).get(kis(név));
export const lookupTávfegyver = (tavfegyverek: readonly TavfegyverAlap[], név: string): TavfegyverAlap | undefined =>
  indexBy(tavfegyverek, f => kis(f.név)).get(kis(név));

type D<K extends keyof GameData> = Pick<GameData, K>;
type Elem<K extends keyof GameData> = GameData[K] extends readonly (infer E)[] ? E : never;

export const taktikaDef = (data: D<'taktikak'>, név: string): Elem<'taktikak'> | undefined =>
  indexBy(data.taktikak, t => kis(t.név)).get(kis(név));
export const helyzetDef = (data: D<'harciHelyzetek'>, név: string): Elem<'harciHelyzetek'> | undefined =>
  indexBy(data.harciHelyzetek, h => kis(h.név)).get(kis(név));
export const státuszDef = (data: D<'statuszok'>, név: string): Elem<'statuszok'> | undefined =>
  indexBy(data.statuszok, s => kis(s.név)).get(kis(név));
export const fortélyDef = (data: D<'fortelySummaries'>, id: string): Elem<'fortelySummaries'> | undefined =>
  indexBy(data.fortelySummaries, f => f.id).get(id);
export const képzettségDef = (data: D<'kepzettsegDefs'>, id: string): Elem<'kepzettsegDefs'> | undefined =>
  indexBy(data.kepzettsegDefs, k => k.id).get(id);
export const eseményDef = (data: D<'esemenyek'>, id: string): Elem<'esemenyek'> | undefined =>
  indexBy(data.esemenyek, e => e.id).get(id);
