import { useEffect } from 'react';
import type { Karakter } from '../engine/types';
import type { UndoEntry } from './useUndo';
import { generateIdLeíró } from '../engine/file-ops';
import { MAX_SLOT } from '../ui-constants';

/**
 * Persists karakter + undoStack to localStorage whenever they change.
 * Skips save if testMode, !isDirty, or karakter is empty (no name/skills/feats).
 */
export function useAutoSave(
  karakter: Karakter | null,
  undoStack: UndoEntry[],
  isDirty: boolean,
  testMode: boolean,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  useEffect(() => {
    if (!karakter || testMode || !isDirty) return;
    const tulajDefault = Object.values(karakter.tulajdonságok).every(v => v === 0);
    if (!karakter.név && karakter.képzettségek.length === 0 && karakter.fortélyok.length === 0 && tulajDefault) return;

    const expectedLeíró = generateIdLeíró(karakter.név, karakter.tsz);
    if (karakter.id_leíró !== expectedLeíró) {
      setKarakter(prev => prev ? { ...prev, id_leíró: expectedLeíró } : prev);
      return;
    }

    const toSave = { ...karakter, _undo: undoStack } as Karakter & { _undo: unknown };
    try {
      localStorage.setItem(`szilank_char_${karakter.uid}`, JSON.stringify(toSave));
      localStorage.setItem('szilank_active', karakter.uid);

      let slots: { uid: string; id_leíró: string; név: string; tsz: number; mentés_dátum: string }[] = [];
      try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { slots = []; }
      const existing = slots.findIndex(s => s.uid === karakter.uid);
      const entry = { uid: karakter.uid, id_leíró: karakter.id_leíró, név: karakter.név, tsz: karakter.tsz, mentés_dátum: new Date().toISOString() };
      if (existing >= 0) slots[existing] = entry; else slots.unshift(entry);
      slots = slots.slice(0, MAX_SLOT);
      localStorage.setItem('szilank_slots', JSON.stringify(slots));
    } catch { /* quota exceeded */ }
  }, [karakter, undoStack, isDirty, testMode]);
}
