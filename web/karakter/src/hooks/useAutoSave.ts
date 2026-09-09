import { useEffect, useState } from 'react';
import type { Karakter, StoredKarakter } from '../engine/types';
import type { UndoEntry } from './useUndo';
import { generateIdLeíró } from '../engine/file-ops';
import { upsertSlotEntry } from './slot-utils';

/**
 * Persists karakter + undoStack to localStorage whenever they change.
 * Skips save if testMode, !isDirty, or viewingCheckpoint.
 * Visszaadja a sikertelen mentések számlálóját (kvóta tele) — a hívó ebből
 * tud figyelmeztetést megjeleníteni, hogy a hiba ne maradjon néma.
 */
export function useAutoSave(
  karakter: Karakter | null,
  undoStack: UndoEntry[],
  isDirty: boolean,
  testMode: boolean,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
  viewingCheckpoint = false,
): number {
  const [saveErrors, setSaveErrors] = useState(0);

  useEffect(() => {
    if (!karakter || testMode || !isDirty || viewingCheckpoint) return;

    const expectedLeíró = generateIdLeíró(karakter.név, karakter.tsz);
    if (karakter.id_leíró !== expectedLeíró) {
      setKarakter(prev => prev ? { ...prev, id_leíró: expectedLeíró } : prev);
      return;
    }

    const toSave: StoredKarakter = { ...karakter, _undo: undoStack };
    try {
      localStorage.setItem(`szilank_char_${karakter.uid}`, JSON.stringify(toSave));
      localStorage.setItem('szilank_active', karakter.uid);
      upsertSlotEntry(karakter);
    } catch {
      // quota exceeded (vagy blokkolt storage) → jelezzük a hívónak
      setSaveErrors(n => n + 1);
    }
  }, [karakter, undoStack, isDirty, testMode, viewingCheckpoint]);

  return saveErrors;
}
