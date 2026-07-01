import { useState, useCallback } from 'react';
import type { Karakter } from '../engine/types';
import { UNDO_MAX } from '../ui-constants';

/**
 * Undo patch: a minimal inverse operation.
 * - For scalar fields: { field, prev } — restore field to prev value
 * - For array fields: { field, op, index?, item?, prev? }
 */
export type UndoPatch =
  | { field: string; prev: unknown }                                          // scalar overwrite
  | { field: string; op: 'add'; item: unknown }                               // was added → undo = remove
  | { field: string; op: 'remove'; index: number; item: unknown }             // was removed → undo = re-insert
  | { field: string; op: 'update'; index: number; prev: unknown }             // was updated → undo = restore prev

export interface UndoEntry {
  timestamp: number;
  leírás: string;
  patches: UndoPatch[];
}

/** Apply a single patch (inverse) to a karakter. Returns new karakter. */
function applyPatch(k: Karakter, patch: UndoPatch): Karakter {
  const field = patch.field as keyof Karakter;
  if ('op' in patch) {
    const arr = [...(k[field] as unknown[])] ;
    switch (patch.op) {
      case 'add':
        // Item was added → undo = remove it (find by equality)
        { const idx = arr.findIndex(x => JSON.stringify(x) === JSON.stringify(patch.item));
          if (idx >= 0) arr.splice(idx, 1);
        }
        break;
      case 'remove':
        // Item was removed → undo = re-insert at original index
        arr.splice(patch.index, 0, patch.item);
        break;
      case 'update':
        // Item was updated → undo = restore prev at index
        if (patch.index < arr.length) arr[patch.index] = patch.prev;
        break;
    }
    return { ...k, [field]: arr };
  }
  // Scalar overwrite
  return { ...k, [field]: patch.prev };
}

/** Filter out legacy undo entries (pre-patch format: full karakter snapshots). */
export function sanitizeUndo(raw: unknown): UndoEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e: any) => Array.isArray(e?.patches)) as UndoEntry[];
}

function loadInitialUndo(): UndoEntry[] {
  try {
    const activeUid = localStorage.getItem('szilank_active');
    if (activeUid) {
      const charData = localStorage.getItem(`szilank_char_${activeUid}`);
      if (charData) {
        const p = JSON.parse(charData);
        return sanitizeUndo(p._undo);
      }
    }
    return [];
  } catch { return []; }
}

/** Fields eligible for coalescing (consecutive edits to same element merge into one entry). */
const COALESCE_FIELDS = new Set(['HM_TÉ', 'HM_VÉ', 'CM', 'képzettségek', 'fortélyok', 'tulajdonságok']);

/**
 * Determine a coalescing key for an entry's patches.
 * Returns a string key if the entry is coalescable, or null otherwise.
 * Two entries with the same key targeting the same element can be merged.
 */
function coalesceKey(patches: UndoPatch[]): string | null {
  if (patches.length !== 1) return null;
  const p = patches[0];
  if (!COALESCE_FIELDS.has(p.field)) return null;
  if ('op' in p) {
    // Array element: key by field + item identity
    if (p.op === 'update') {
      const prev = p.prev as Record<string, unknown>;
      return `${p.field}:${prev?.['név'] ?? ''}:${prev?.['spec_elem'] ?? ''}`;
    }
    if (p.op === 'add') {
      const item = p.item as Record<string, unknown>;
      return `${p.field}:${item?.['név'] ?? ''}:${item?.['spec_elem'] ?? ''}`;
    }
    if (p.op === 'remove') {
      const item = p.item as Record<string, unknown>;
      return `${p.field}:${item?.['név'] ?? ''}:${item?.['spec_elem'] ?? ''}`;
    }
  }
  // Scalar field
  return p.field;
}

/**
 * After coalescing, check if undoing would be a noop (prev === current post-modification value).
 * This happens when a user toggles a value back to its original state (e.g. erő 3→4→3).
 */
function isNoopAfterCoalesce(patches: UndoPatch[], nextValue: unknown): boolean {
  if (patches.length !== 1) return false;
  const p = patches[0];
  if ('op' in p) {
    // Array update: compare prev item with the next array's element at the same position
    if (p.op === 'update') {
      const nextArr = nextValue as unknown[];
      if (!Array.isArray(nextArr) || p.index >= nextArr.length) return false;
      return JSON.stringify(p.prev) === JSON.stringify(nextArr[p.index]);
    }
    // add/remove noop is complex — skip for now
    return false;
  }
  // Scalar: compare prev with nextValue directly
  return JSON.stringify(p.prev) === JSON.stringify(nextValue);
}

export function useUndo(
  karakterRef: React.RefObject<Karakter | null>,
  karakter: Karakter | null,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
  testMode: boolean,
  setTestMode: (v: boolean) => void,
  isDirty: boolean,
  setIsDirty: (v: boolean) => void,
) {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>(loadInitialUndo);

  /**
   * Push an undo entry with minimal inverse patches.
   * If the top entry has the same coalesce key, merge (keep original patch, update leírás).
   * If after merging the stored prev equals nextValue, the entry is a noop and gets dropped.
   *
   * @param nextValue - The value AFTER the current modification (used for noop detection on coalesce).
   */
  const pushUndo = useCallback((leírás: string, patches?: UndoPatch[], nextValue?: unknown) => {
    const k = karakterRef.current;
    if (!k) return;
    if (testMode) setTestMode(false);
    if (!isDirty) setIsDirty(true);

    // If no explicit patches, fall back to full scalar snapshot
    const entry: UndoEntry = patches
      ? { timestamp: Date.now(), leírás, patches }
      : (() => {
          const clone = structuredClone(k);
          delete (clone as any)._undo;
          const { jegyzetek: _n, napló: _na, ...rest } = clone;
          const allPatches: UndoPatch[] = Object.entries(rest).map(
            ([field, prev]) => ({ field, prev })
          );
          return { timestamp: Date.now(), leírás, patches: allPatches };
        })();

    setUndoStack(prev => {
      const newKey = coalesceKey(entry.patches);
      if (newKey && prev.length > 0) {
        const topKey = coalesceKey(prev[0].patches);
        if (topKey === newKey) {
          // Coalesce: keep the original patch (oldest prev value), update leírás + timestamp
          const merged: UndoEntry = { timestamp: entry.timestamp, leírás: entry.leírás, patches: prev[0].patches };
          // Noop detection: if the merged prev equals the post-modification value, drop the entry
          if (nextValue !== undefined && isNoopAfterCoalesce(merged.patches, nextValue)) {
            return prev.slice(1);
          }
          return [merged, ...prev.slice(1)].slice(0, UNDO_MAX);
        }
      }
      return [entry, ...prev].slice(0, UNDO_MAX);
    });
  }, [testMode, isDirty]);

  /** Sequential undo: apply patches from entry 0 through index (inclusive). */
  const undoTo = useCallback((index: number) => {
    if (!karakter) return;
    let result = { ...karakter };
    for (let i = 0; i <= index; i++) {
      for (const patch of undoStack[i].patches) {
        result = applyPatch(result, patch);
      }
    }
    // Always preserve these fields
    result.jegyzetek = karakter.jegyzetek;
    result.napló = karakter.napló;
    setKarakter(result);
    setUndoStack(prev => prev.slice(index + 1));
  }, [karakter, undoStack]);

  return { undoStack, setUndoStack, pushUndo, undoTo };
}
