import { useState, useEffect, useRef, useCallback } from 'react';
import { loadGameData } from '../engine/data-loader';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import { validateKarakter, validateKarakterData } from '../engine/validate';
import { generateUid, generateIdLeíró } from '../engine/file-ops';

export interface UndoEntry { timestamp: number; leírás: string; session: Session; karakter: Karakter; }

const UNDO_MAX = 6;

export function useKarakterState() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const [karakter, setKarakter] = useState<Karakter | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [undoStack, setUndoStack] = useState<UndoEntry[]>(() => {
    try {
      const activeUid = localStorage.getItem('szilank_active');
      if (activeUid) {
        const charData = localStorage.getItem(`szilank_char_${activeUid}`);
        if (charData) { const p = JSON.parse(charData); return p._undo || []; }
      }
      const s = localStorage.getItem('szilank_undo'); return s ? JSON.parse(s) : [];
    } catch { return []; }
  });

  const karakterRef = useRef(karakter);
  karakterRef.current = karakter;

  // --- Load game data & karakter ---
  useEffect(() => {
    loadGameData().then(d => {
      setData(d);
      if (!validateKarakter(d.emptyKarakter)) {
        setError('Az empty_karakter.json érvénytelen (schema_version !== 2 vagy hiányzó mezők). Ellenőrizd a data/karakter/empty_karakter.json fájlt.');
        return;
      }
      const refErr = validateKarakterData(d.emptyKarakter, d);
      if (refErr) {
        setError(`empty_karakter.json referencia hiba: ${refErr}`);
        return;
      }
      const saved = localStorage.getItem('szilank_karakter');
      // Migráció: régi single-key → multi-slot
      if (saved && !localStorage.getItem('szilank_slots')) {
        try {
          const parsed = JSON.parse(saved);
          if (validateKarakter(parsed)) {
            const uid = parsed.uid || ((parsed as any).id) || generateUid();
            const migrated = { ...parsed, uid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } };
            localStorage.setItem(`szilank_char_${uid}`, JSON.stringify(migrated));
            localStorage.setItem('szilank_slots', JSON.stringify([{ uid, id_leíró: migrated.id_leíró, név: migrated.név, tsz: migrated.tsz, mentés_dátum: new Date().toISOString() }]));
            localStorage.setItem('szilank_active', uid);
            localStorage.removeItem('szilank_karakter');
            localStorage.removeItem('szilank_undo');
            setKarakter(migrated);
            setIsDirty(true);
            return;
          }
        } catch { /* fall through */ }
      }
      // Multi-slot betöltés
      const activeUid = localStorage.getItem('szilank_active');
      if (activeUid) {
        const charData = localStorage.getItem(`szilank_char_${activeUid}`);
        if (charData) {
          try {
            const parsed = JSON.parse(charData);
            if (validateKarakter(parsed)) {
              setKarakter({ ...parsed, uid: parsed.uid || activeUid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } });
              setIsDirty(true);
              return;
            }
          } catch { /* fall through */ }
        }
      }
      setKarakter({ ...d.emptyKarakter, uid: generateUid(), id_leíró: generateIdLeíró("", d.emptyKarakter.tsz) });
    }).catch(e => setError(`Betöltési hiba: ${String(e)}`));
  }, []);

  // --- Autosave ---
  useEffect(() => {
    if (!karakter || testMode || !isDirty) return;
    if (!karakter.név && karakter.képzettségek.length === 0 && karakter.fortélyok.length === 0) return;
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
      slots = slots.slice(0, 10);
      localStorage.setItem('szilank_slots', JSON.stringify(slots));
    } catch { /* quota exceeded */ }
  }, [karakter, undoStack, isDirty, testMode]);

  // --- Setters ---
  const setTulajdonságok = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, tulajdonságok: typeof val === 'function' ? val(prev.tulajdonságok) : val } : prev);
  }, []);

  const setKépzettségek = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, képzettségek: typeof val === 'function' ? val(prev.képzettségek) : val } : prev);
  }, []);

  const setFortélyok = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, fortélyok: typeof val === 'function' ? val(prev.fortélyok) : val } : prev);
  }, []);

  const setSession = useCallback((val: Session | ((prev: Session) => Session)) => {
    setKarakter(prev => prev ? { ...prev, session: typeof val === 'function' ? val(prev.session) : val } : prev);
  }, []);

  // --- Undo ---
  function pushUndo(leírás: string) {
    const k = karakterRef.current;
    if (!k) return;
    if (testMode) setTestMode(false);
    if (!isDirty) setIsDirty(true);
    setUndoStack(prev => [
      { timestamp: Date.now(), leírás, session: structuredClone(k.session), karakter: structuredClone(k) },
      ...prev
    ].slice(0, UNDO_MAX));
  }

  function undoTo(index: number) {
    if (!karakter) return;
    const entry = undoStack[index];
    const restoredKarakter = { ...entry.karakter, jegyzetek: karakter.jegyzetek, napló: karakter.napló };
    setKarakter(restoredKarakter);
    setUndoStack(prev => prev.slice(index + 1));
  }

  // --- Document title ---
  useEffect(() => {
    document.title = karakter?.becenév || 'Szilánk';
  }, [karakter?.becenév]);

  return {
    data, error, karakter, setKarakter,
    testMode, setTestMode, isDirty, setIsDirty,
    undoStack, setUndoStack, pushUndo, undoTo,
    setTulajdonságok, setKépzettségek, setFortélyok, setSession,
  };
}
