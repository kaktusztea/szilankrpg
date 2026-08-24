import { useEffect } from 'react';
import type { Karakter } from '../engine/types';
import type { UndoEntry } from './useUndo';
import { generateIdLeíró } from '../engine/file-ops';
import { readSlots, writeSlots } from './slot-utils';

/**
 * Persists karakter + undoStack to localStorage whenever they change.
 * Skips save if testMode, !isDirty, or viewingCheckpoint.
 */
export function useAutoSave(
  karakter: Karakter | null,
  undoStack: UndoEntry[],
  isDirty: boolean,
  testMode: boolean,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
  viewingCheckpoint = false,
) {
  useEffect(() => {
    if (!karakter || testMode || !isDirty || viewingCheckpoint) return;

    const expectedLeíró = generateIdLeíró(karakter.név, karakter.tsz);
    if (karakter.id_leíró !== expectedLeíró) {
      setKarakter(prev => prev ? { ...prev, id_leíró: expectedLeíró } : prev);
      return;
    }

    const toSave = { ...karakter, _undo: undoStack } as Karakter & { _undo: unknown };
    try {
      localStorage.setItem(`szilank_char_${karakter.uid}`, JSON.stringify(toSave));
      localStorage.setItem('szilank_active', karakter.uid);

      const slots = readSlots();
      const existing = slots.findIndex(s => s.uid === karakter.uid);
      const entry = { uid: karakter.uid, id_leíró: karakter.id_leíró, név: karakter.név, becenév: karakter.becenév, tsz: karakter.tsz, mentés_dátum: new Date().toISOString(), jk: karakter.jk ?? true };
      if (existing >= 0) slots[existing] = entry; else slots.unshift(entry);
      writeSlots(slots);
    } catch { /* quota exceeded */ }
  }, [karakter, undoStack, isDirty, testMode, viewingCheckpoint]);
}
