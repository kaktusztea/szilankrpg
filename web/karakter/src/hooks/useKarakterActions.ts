import { useCallback } from 'react';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { generateUid, generateIdLeíró, duplicateKarakter as dupKarakter, generateSaveFile, loadKarakterFromFile, downloadFile, shareFile } from '../engine/file-ops';
import { encodeKarakterUrl } from '../engine/url-share';
import type { OverlayState } from '../components/AppOverlays';
import type { UndoEntry } from './useUndo';
import { sanitizeUndo } from './useUndo';
import { isSlotFull } from './slot-utils';

interface Deps {
  data: GameData | null;
  karakter: Karakter | null;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  undoStack: UndoEntry[];
  setUndoStack: React.Dispatch<React.SetStateAction<UndoEntry[]>>;
  setTestMode: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
}

export function useKarakterActions({ data, karakter, setKarakter, undoStack, setUndoStack, setTestMode, setIsDirty, setOverlay }: Deps) {

  const importKarakter = useCallback((k: Karakter, overwriteUid: string | false) => {
    if (!overwriteUid && isSlotFull()) { setOverlay('showSlotLimit', true); setOverlay('importConfirm', null); return; }
    if (overwriteUid) {
      const final = { ...k, uid: overwriteUid, id_leíró: generateIdLeíró(k.név, k.tsz) };
      localStorage.setItem(`szilank_char_${overwriteUid}`, JSON.stringify(final));
      setKarakter(final);
    } else {
      setKarakter(k);
    }
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(true);
    setOverlay('toast', { msg: `Karakter importálva: ${k.név} (${k.tsz}sz)`, type: 'success' });
    setOverlay('importConfirm', null);
  }, [setKarakter, setUndoStack, setTestMode, setIsDirty, setOverlay]);

  async function shareSlotUrl(slotUid: string) {
    const charData = localStorage.getItem(`szilank_char_${slotUid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData) as Karakter;
      const url = encodeKarakterUrl(parsed);
      let copied = false;
      try { await navigator.clipboard.writeText(url); copied = true; } catch { /* clipboard blocked */ }
      setOverlay('sharePopup', { név: parsed.név || 'Névtelen', copied, url });
    } catch { setOverlay('toast', { msg: 'Hiba az URL generálásakor.', type: 'error' }); }
  }

  // Save a single stored slot to a file (download or share) — operates on the given slot, not the active character
  async function saveSlotToFile(slotUid: string, action: 'download' | 'share') {
    const charData = localStorage.getItem(`szilank_char_${slotUid}`);
    if (!charData) return;
    let parsed: Karakter & { _undo?: unknown };
    try { parsed = JSON.parse(charData); } catch { setOverlay('toast', { msg: 'Hiba a mentés generálásakor.', type: 'error' }); return; }
    const undo = sanitizeUndo((parsed as any)._undo);
    const { blob, filename } = generateSaveFile(parsed, undo, 'single');
    if (action === 'download') downloadFile(blob, filename);
    else await shareFile(blob, filename);
  }

  // Duplicate a specific stored slot (not necessarily the active character); the duplicate becomes active
  function duplicateSlot(uid: string) {
    if (isSlotFull()) { setOverlay('showSlotLimit', true); return; }
    const charData = localStorage.getItem(`szilank_char_${uid}`);
    if (!charData) return;
    let parsed: Karakter;
    try { parsed = JSON.parse(charData); } catch { setOverlay('toast', { msg: 'Hiba a duplikáláskor.', type: 'error' }); return; }
    const dup = dupKarakter(parsed);
    setKarakter(dup);
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(true);
    setTimeout(() => setOverlay('showSlotList', true), 100);
  }

  function handleGenerateSave(mode: 'single' | 'backup') {
    if (!karakter) return;
    const { blob, filename } = generateSaveFile(karakter, undoStack, mode);
    // Desktop (no Web Share API): only "Helyi mentés" would show — skip the
    // overlay and download directly. Mobile keeps the share/download choice.
    if (typeof navigator.share !== 'function') { downloadFile(blob, filename); return; }
    setOverlay('saveFile', { blob, filename });
  }

  function deleteSlot(uid: string) {
    localStorage.removeItem(`szilank_char_${uid}`);
    let sl: { uid: string; id_leíró: string; név: string; tsz: number; mentés_dátum: string }[] = [];
    try { sl = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
    sl = sl.filter(x => x.uid !== uid);
    localStorage.setItem('szilank_slots', JSON.stringify(sl));
    if (karakter?.uid === uid) {
      if (sl.length > 0) {
        const next = localStorage.getItem(`szilank_char_${sl[0].uid}`);
        if (next) { const p = JSON.parse(next); setKarakter({ ...p, session: { ...DEFAULT_SESSION, ...p.session } }); setUndoStack(sanitizeUndo((p as any)._undo)); }
      } else if (data) {
        setKarakter({ ...data.emptyKarakter, uid: generateUid(), id_leíró: generateIdLeíró('', data.emptyKarakter.tsz) });
        setUndoStack([]);
        setIsDirty(false);
      }
    }
  }

  async function loadKarakter() {
    if (!data) return;
    const result = await loadKarakterFromFile(data);
    if ('error' in result) { setOverlay('loadError', result.error); return; }

    if (result.type === 'backup') {
      // Open backup restore overlay — let user pick which characters to restore
      setOverlay('backupRestore', { karakterek: result.karakterek, dátum: result.dátum });
      return;
    }

    // Single character load — check uid collision
    let slots: { uid: string; név: string; tsz: number; mentés_dátum: string }[] = [];
    try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
    const match = slots.find(s => s.uid === result.karakter.uid);
    if (match) {
      // uid already exists → ask for confirmation
      setOverlay('importConfirm', { karakter: result.karakter, matchUid: match.uid });
    } else {
      if (isSlotFull()) { setOverlay('showSlotLimit', true); return; }
      setKarakter(result.karakter);
      setUndoStack(result.undo);
      setTestMode(false);
      setIsDirty(true);
    }
  }

  return { importKarakter, shareSlotUrl, saveSlotToFile, duplicateSlot, handleGenerateSave, loadKarakter, deleteSlot };
}
