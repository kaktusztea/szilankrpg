import { useCallback } from 'react';
import type { Karakter, Session } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { generateIdLeíró, duplicateKarakter as dupKarakter, generateSaveFile, loadKarakterFromFile } from '../engine/file-ops';
import { encodeKarakterUrl } from '../engine/url-share';
import type { OverlayState } from '../components/AppOverlays';

interface Deps {
  data: GameData | null;
  karakter: Karakter | null;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  undoStack: { timestamp: number; leírás: string; session: Session; karakter: Karakter }[];
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setTestMode: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
}

export function useKarakterActions({ data, karakter, setKarakter, undoStack, setUndoStack, setTestMode, setIsDirty, setOverlay }: Deps) {

  const importKarakter = useCallback((k: Karakter, overwriteUid: string | false) => {
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

  function duplicateKarakter() {
    if (!karakter) return;
    const dup = dupKarakter(karakter);
    setKarakter(dup);
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(true);
    setTimeout(() => setOverlay('showSlotList', true), 100);
  }

  function handleGenerateSave(mode: 'single' | 'backup') {
    if (!karakter) return;
    setOverlay('saveFile', generateSaveFile(karakter, undoStack, mode));
    setOverlay('showSavePopup', false);
  }

  async function loadKarakter() {
    if (!data) return;
    const result = await loadKarakterFromFile(data);
    if ('error' in result) { setOverlay('loadError', result.error); return; }
    setKarakter(result.karakter);
    setUndoStack(result.undo);
    setTestMode(false);
    setIsDirty(true);
  }

  return { importKarakter, shareSlotUrl, duplicateKarakter, handleGenerateSave, loadKarakter };
}
