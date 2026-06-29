import { useState, useCallback } from 'react';
import type { Karakter, Session } from '../engine/types';
import { UNDO_MAX } from '../ui-constants';

export interface UndoEntry { timestamp: number; leírás: string; session: Session; karakter: Karakter; }

function loadInitialUndo(): UndoEntry[] {
  try {
    const activeUid = localStorage.getItem('szilank_active');
    if (activeUid) {
      const charData = localStorage.getItem(`szilank_char_${activeUid}`);
      if (charData) { const p = JSON.parse(charData); return p._undo || []; }
    }
    const s = localStorage.getItem('szilank_undo'); return s ? JSON.parse(s) : [];
  } catch { return []; }
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

  const pushUndo = useCallback((leírás: string) => {
    const k = karakterRef.current;
    if (!k) return;
    if (testMode) setTestMode(false);
    if (!isDirty) setIsDirty(true);
    setUndoStack(prev => [
      { timestamp: Date.now(), leírás, session: structuredClone(k.session), karakter: structuredClone(k) },
      ...prev
    ].slice(0, UNDO_MAX));
  }, [testMode, isDirty]);

  const undoTo = useCallback((index: number) => {
    if (!karakter) return;
    const entry = undoStack[index];
    setKarakter({ ...entry.karakter, jegyzetek: karakter.jegyzetek, napló: karakter.napló });
    setUndoStack(prev => prev.slice(index + 1));
  }, [karakter, undoStack]);

  return { undoStack, setUndoStack, pushUndo, undoTo };
}
