import { useState, useEffect, useRef, useCallback } from 'react';
import type { Karakter, Session } from '../engine/types';
import { useGameDataLoader } from './useGameDataLoader';
import { useAutoSave } from './useAutoSave';
import { useUndo } from './useUndo';
export type { UndoEntry } from './useUndo';

export function useKarakterState() {
  const { data, error, initialKarakter, initialDirty } = useGameDataLoader();

  const [karakter, setKarakter] = useState<Karakter | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const karakterRef = useRef(karakter);
  karakterRef.current = karakter;

  const { undoStack, setUndoStack, pushUndo, undoTo } = useUndo(
    karakterRef, karakter, setKarakter, testMode, setTestMode, isDirty, setIsDirty,
  );

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

  return {
    data, error, karakter, setKarakter,
    testMode, setTestMode, isDirty, setIsDirty,
    undoStack, setUndoStack, pushUndo, undoTo,
    setTulajdonságok, setKépzettségek, setFortélyok, setSession,
  };
}
