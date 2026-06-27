import { useCallback } from 'react';
import type { Karakter, Tulajdonsagok, Fortely, Kepzettseg } from '../engine/types';
import { describeKepChange } from '../engine/utils';

interface Deps {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
}

/** Generic undo-aware setter factory: wraps pushUndo + setKarakter for any karakter field. */
function makeUndoSetter<T>(
  field: keyof Karakter,
  getCurrent: () => T,
  describer: (prev: T, next: T) => string,
  pushUndo: (s: string) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  return (val: T | ((prev: T) => T)) => {
    const prev = getCurrent();
    const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
    const desc = describer(prev, next);
    if (desc) pushUndo(desc);
    setKarakter(k => k ? { ...k, [field]: next } : k);
  };
}

function describeTulajdonság(prev: Tulajdonsagok, next: Tulajdonsagok): string {
  const prevR = prev as unknown as Record<string, number>;
  const nextR = next as unknown as Record<string, number>;
  const key = Object.keys(nextR).find(k => nextR[k] !== prevR[k]);
  return key ? `${key}: ${prevR[key]} → ${nextR[key]}` : 'Tulajdonság módosítás';
}

function describeFortély(prev: Fortely[], next: Fortely[]): string {
  const fmt = (f: Fortely) => f.név + (f.spec_elem ? ` (${f.spec_elem})` : '');
  if (next.length > prev.length) {
    const added = next.find(n => !prev.some(f => f.név === n.név && f.spec_elem === n.spec_elem));
    return added && added.fok > 0 ? `Fortély: ${fmt(added)} 0→${added.fok}` : '';
  }
  if (next.length < prev.length) {
    const removed = prev.find(f => !next.some(n => n.név === f.név && n.spec_elem === f.spec_elem));
    return removed ? `Fortély: ${fmt(removed)} ${removed.fok}→0❌` : '';
  }
  const changed = next.find((n, i) => n.fok !== prev[i]?.fok);
  if (changed) {
    const old = prev.find(f => f.név === changed.név && f.spec_elem === changed.spec_elem);
    if (old && old.fok !== changed.fok) return `Fortély: ${fmt(changed)} ${old.fok}→${changed.fok}`;
  }
  return '';
}

export function useUndoWrappedSetters({ karakter, setKarakter, pushUndo }: Deps) {
  const setTulajdonságokUndo = useCallback(
    makeUndoSetter<Tulajdonsagok>(
      'tulajdonságok',
      () => karakter.tulajdonságok,
      describeTulajdonság,
      pushUndo, setKarakter,
    ), [karakter.tulajdonságok, pushUndo, setKarakter]);

  const setKépzettségekUndo = useCallback(
    makeUndoSetter<Kepzettseg[]>(
      'képzettségek',
      () => karakter.képzettségek,
      describeKepChange,
      pushUndo, setKarakter,
    ), [karakter.képzettségek, pushUndo, setKarakter]);

  const setFortélyokUndo = useCallback(
    makeUndoSetter<Fortely[]>(
      'fortélyok',
      () => karakter.fortélyok,
      describeFortély,
      pushUndo, setKarakter,
    ), [karakter.fortélyok, pushUndo, setKarakter]);

  return { setTulajdonságokUndo, setKépzettségekUndo, setFortélyokUndo };
}
