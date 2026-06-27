import { useState, useEffect, useRef, useCallback } from 'react';
import type { Karakter, Session } from '../engine/types';
import { useGameDataLoader } from './useGameDataLoader';
import { useAutoSave } from './useAutoSave';

export interface UndoEntry { timestamp: number; leírás: string; session: Session; karakter: Karakter; }

const UNDO_MAX = 6;

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

export function useKarakterState() {
  const { data, error, initialKarakter, initialDirty } = useGameDataLoader();

  const [karakter, setKarakter] = useState<Karakter | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>(loadInitialUndo);

  const karakterRef = useRef(karakter);
  karakterRef.current = karakter;

  // Init karakter from loader
  useEffect(() => {
    if (initialKarakter && !karakter) {
      setKarakter(initialKarakter);
      if (initialDirty) setIsDirty(true);
    }
  }, [initialKarakter]);

  // Autosave
  useAutoSave(karakter, undoStack, isDirty, testMode, setKarakter);

  // Document title
  useEffect(() => { document.title = karakter?.becenév || 'Szilánk'; }, [karakter?.becenév]);

  // --- Field setters ---
  const setField = useCallback(<K extends keyof Karakter>(field: K) =>
    (val: Karakter[K] | ((prev: Karakter[K]) => Karakter[K])) => {
      setKarakter(prev => prev ? { ...prev, [field]: typeof val === 'function' ? (val as Function)(prev[field]) : val } : prev);
    }, []);

  const setTulajdonságok = useCallback(setField('tulajdonságok'), [setField]);
  const setKépzettségek = useCallback(setField('képzettségek'), [setField]);
  const setFortélyok = useCallback(setField('fortélyok'), [setField]);
  const setSession = useCallback((val: Session | ((prev: Session) => Session)) => {
    setKarakter(prev => prev ? { ...prev, session: typeof val === 'function' ? val(prev.session) : val } : prev);
  }, []);

  // --- Undo ---
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

  return {
    data, error, karakter, setKarakter,
    testMode, setTestMode, isDirty, setIsDirty,
    undoStack, setUndoStack, pushUndo, undoTo,
    setTulajdonságok, setKépzettségek, setFortélyok, setSession,
  };
}
