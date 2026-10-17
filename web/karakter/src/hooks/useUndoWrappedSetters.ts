import { useCallback } from 'react';
import type { Karakter, Tulajdonsagok, Fortely, Kepzettseg } from '../engine/types';
import type { UndoPatch } from './useUndo';
import { describeKepChange } from '../engine/utils';
import { képzKulcs, fortélyNév } from '../engine/azonosito';
import type { GameData } from '../engine/data-loader';

interface Deps {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  /** A napló-feliratok fortély/képzettség-neveihez (id → név). */
  data: GameData;
}

// --- Patch builders ---

function buildTulajdonságPatch(prev: Tulajdonsagok, next: Tulajdonsagok): UndoPatch[] {
  // Tulajdonságok is a flat object - store as scalar overwrite, tagged with the
  // changed key so edits to different properties don't coalesce into one entry.
  const prevR = prev as unknown as Record<string, number>;
  const nextR = next as unknown as Record<string, number>;
  const changed = Object.keys(nextR).find(k => nextR[k] !== prevR[k]);
  return [{ field: 'tulajdonságok', prev, ckey: changed }];
}

function buildKépzettségPatch(prev: Kepzettseg[], next: Kepzettseg[]): UndoPatch[] {
  if (next.length > prev.length) {
    // Added
    const added = next.find(n => !prev.some(p => képzKulcs(p) === képzKulcs(n)));
    if (added) return [{ field: 'képzettségek', op: 'add', item: added }];
  }
  if (next.length < prev.length) {
    // Removed
    const removedIdx = prev.findIndex(p => !next.some(n => képzKulcs(n) === képzKulcs(p)));
    if (removedIdx >= 0) return [{ field: 'képzettségek', op: 'remove', index: removedIdx, item: prev[removedIdx] }];
  }
  // Updated (same length, one element changed)
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].szint !== next[i]?.szint || (next[i] && képzKulcs(prev[i]) !== képzKulcs(next[i]))) {
      return [{ field: 'képzettségek', op: 'update', index: i, prev: prev[i] }];
    }
  }
  // Fallback: full overwrite
  return [{ field: 'képzettségek', prev }];
}

function buildFortélyPatch(prev: Fortely[], next: Fortely[]): UndoPatch[] {
  if (next.length > prev.length) {
    // Added - find the new one
    const added = next.find(n => !prev.some(p => p.id === n.id && p.elem === n.elem));
    if (added) return [{ field: 'fortélyok', op: 'add', item: added }];
  }
  if (next.length < prev.length) {
    // Removed - find which was removed
    const removedIdx = prev.findIndex(p => !next.some(n => n.id === p.id && n.elem === p.elem));
    if (removedIdx >= 0) return [{ field: 'fortélyok', op: 'remove', index: removedIdx, item: prev[removedIdx] }];
  }
  // Updated (fok change) - same length
  for (let i = 0; i < prev.length; i++) {
    if (i < next.length && (prev[i].fok !== next[i].fok || prev[i].id !== next[i].id || prev[i].elem !== next[i].elem)) {
      return [{ field: 'fortélyok', op: 'update', index: i, prev: prev[i] }];
    }
  }
  // Fallback: full overwrite
  return [{ field: 'fortélyok', prev }];
}

// --- Describers ---

function describeTulajdonság(prev: Tulajdonsagok, next: Tulajdonsagok): string {
  const prevR = prev as unknown as Record<string, number>;
  const nextR = next as unknown as Record<string, number>;
  const key = Object.keys(nextR).find(k => nextR[k] !== prevR[k]);
  return key ? `${key}: ${prevR[key]} → ${nextR[key]}` : 'Tulajdonság módosítás';
}

function describeFortély(prev: Fortely[], next: Fortely[], data: GameData): string {
  const fmt = (f: Fortely) => fortélyNév(f, data) + (f.elem && f.id !== 'egyedi' ? ` (${f.elem})` : '');
  if (next.length > prev.length) {
    const added = next.find(n => !prev.some(f => f.id === n.id && f.elem === n.elem));
    return added && added.fok > 0 ? `Fortély: ${fmt(added)} 0→${added.fok}` : '';
  }
  if (next.length < prev.length) {
    const removed = prev.find(f => !next.some(n => n.id === f.id && n.elem === f.elem));
    return removed ? `Fortély: ${fmt(removed)} ${removed.fok}→0❌` : '';
  }
  const changed = next.find((n, i) => n.fok !== prev[i]?.fok);
  if (changed) {
    const old = prev.find(f => f.id === changed.id && f.elem === changed.elem);
    if (old && old.fok !== changed.fok) return `Fortély: ${fmt(changed)} ${old.fok}→${changed.fok}`;
  }
  return '';
}

// --- Setter factory ---

function makeUndoSetter<T>(
  field: keyof Karakter,
  getCurrent: () => T,
  describer: (prev: T, next: T) => string,
  patchBuilder: (prev: T, next: T) => UndoPatch[],
  pushUndo: (s: string, patches?: UndoPatch[], nextValue?: unknown) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  return (val: T | ((prev: T) => T)) => {
    const prev = getCurrent();
    const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
    const desc = describer(prev, next);
    if (desc) pushUndo(desc, patchBuilder(prev, next), next);
    setKarakter(k => k ? { ...k, [field]: next } : k);
  };
}

export function useUndoWrappedSetters({ karakter, setKarakter, pushUndo, data }: Deps) {
  const setTulajdonságokUndo = useCallback(
    makeUndoSetter<Tulajdonsagok>(
      'tulajdonságok',
      () => karakter.tulajdonságok,
      describeTulajdonság,
      buildTulajdonságPatch,
      pushUndo, setKarakter,
    ), [karakter.tulajdonságok, pushUndo, setKarakter]);

  const setKépzettségekUndo = useCallback(
    makeUndoSetter<Kepzettseg[]>(
      'képzettségek',
      () => karakter.képzettségek,
      (p, n) => describeKepChange(p, n, data),
      buildKépzettségPatch,
      pushUndo, setKarakter,
    ), [karakter.képzettségek, pushUndo, setKarakter, data]);

  const setFortélyokUndo = useCallback(
    makeUndoSetter<Fortely[]>(
      'fortélyok',
      () => karakter.fortélyok,
      (p, n) => describeFortély(p, n, data),
      buildFortélyPatch,
      pushUndo, setKarakter,
    ), [karakter.fortélyok, pushUndo, setKarakter, data]);

  return { setTulajdonságokUndo, setKépzettségekUndo, setFortélyokUndo };
}
