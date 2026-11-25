/**
 * GameData entity lookups (refactor phase 3). Keys:
 * names (weapons, tactics, combat situations) case-insensitive, ids (státusz, fortély, képzettség, esemény, helyzet) exact.
 * Unknown key → undefined (never throws). On duplicate keys the FIRST entry wins (same as Array.find).
 */
import type { GameData, FegyverAlap, TavfegyverAlap } from './data-types';

// shortcut: the index is cached per array identity; an array mutated after its first lookup would be stale.
// GameData is immutable after load (and the data test guards unique keys) - revisit if data ever becomes editable.
const cache = new WeakMap<readonly object[], Map<string, Map<string, unknown>>>();
/** `index`: the key's name - one array can have several indexes (helyzet by név AND by id). */
function indexBy<T extends object>(arr: readonly T[], index: string, key: (x: T) => string): Map<string, T> {
  let byIndex = cache.get(arr);
  if (!byIndex) { byIndex = new Map(); cache.set(arr, byIndex); }
  let m = byIndex.get(index) as Map<string, T> | undefined;
  if (!m) {
    m = new Map();
    for (const x of arr) { const k = key(x); if (!m.has(k)) m.set(k, x); }
    byIndex.set(index, m);
  }
  return m;
}

const kis = (s: string) => s.toLowerCase();

export const lookupFegyver = (fegyverek: readonly FegyverAlap[], név: string): FegyverAlap | undefined =>
  indexBy(fegyverek, 'név', f => kis(f.név)).get(kis(név));
export const lookupTávfegyver = (tavfegyverek: readonly TavfegyverAlap[], név: string): TavfegyverAlap | undefined =>
  indexBy(tavfegyverek, 'név', f => kis(f.név)).get(kis(név));

type D<K extends keyof GameData> = Pick<GameData, K>;
type Elem<K extends keyof GameData> = GameData[K] extends readonly (infer E)[] ? E : never;

export const taktikaDef = (data: D<'taktikak'>, név: string): Elem<'taktikak'> | undefined =>
  indexBy(data.taktikak, 'név', t => kis(t.név)).get(kis(név));
export const helyzetDef = (data: D<'harciHelyzetek'>, név: string): Elem<'harciHelyzetek'> | undefined =>
  indexBy(data.harciHelyzetek, 'név', h => kis(h.név)).get(kis(név));
/** Harci helyzet by id (the data refers to helyzetek by id: `kizár_helyzetek`, taktika `megkötések`). */
export const helyzetDefId = (data: D<'harciHelyzetek'>, id: string): Elem<'harciHelyzetek'> | undefined =>
  indexBy(data.harciHelyzetek, 'id', h => h.id).get(id);
export const státuszDef = (data: D<'statuszok'>, id: string): Elem<'statuszok'> | undefined =>
  indexBy(data.statuszok, 'id', s => s.id).get(id);
export const fortélyDef = (data: D<'fortelySummaries'>, id: string): Elem<'fortelySummaries'> | undefined =>
  indexBy(data.fortelySummaries, 'id', f => f.id).get(id);
export const képzettségDef = (data: D<'kepzettsegDefs'>, id: string): Elem<'kepzettsegDefs'> | undefined =>
  indexBy(data.kepzettsegDefs, 'id', k => k.id).get(id);
export const eseményDef = (data: D<'esemenyek'>, id: string): Elem<'esemenyek'> | undefined =>
  indexBy(data.esemenyek, 'id', e => e.id).get(id);
