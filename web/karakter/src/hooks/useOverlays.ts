import { useState, useEffect, useCallback } from 'react';
import type { OverlayState } from '../components/AppOverlays';

const INITIAL_OVERLAYS: OverlayState = {
  showMenu: false, showSzilánkPicker: false, showSlotList: false,
  slotDeleteTarget: null, showSavePopup: false, saveFile: null,
  loadError: '', showFullscreenHint: false, showNewConfirm: false,
  showUndo: false, undoSelected: null, overlayScreen: null,
  sharePopup: null, toast: null, importConfirm: null, showSlotLimit: false,
};

export function useOverlays() {
  const [overlays, setOverlays] = useState<OverlayState>(INITIAL_OVERLAYS);

  const setOverlay = useCallback(<K extends keyof OverlayState>(key: K, value: OverlayState[K]) => {
    setOverlays(prev => ({ ...prev, [key]: value }));
  }, []);

  const anyOverlayOpen = overlays.showNewConfirm || overlays.showSlotList || overlays.showUndo
    || overlays.showMenu || !!overlays.loadError || !!overlays.overlayScreen
    || overlays.showFullscreenHint || overlays.showSzilánkPicker || !!overlays.sharePopup
    || !!overlays.slotDeleteTarget || overlays.showSavePopup || !!overlays.saveFile;

  // ESC closes overlays
  useEffect(() => {
    if (!anyOverlayOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOverlays(prev => ({ ...INITIAL_OVERLAYS, toast: prev.toast, importConfirm: prev.importConfirm }));
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOverlayOpen]);

  // Ctrl+S → save popup
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); setOverlay('showSavePopup', true); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setOverlay]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!overlays.toast) return;
    const t = setTimeout(() => setOverlay('toast', null), 2500);
    return () => clearTimeout(t);
  }, [overlays.toast, setOverlay]);

  // Dismiss overlay on background click (.kep-prompt-overlay)
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (el.classList.contains('kep-prompt-overlay')) {
        setOverlays(prev => ({ ...INITIAL_OVERLAYS, toast: prev.toast, importConfirm: prev.importConfirm }));
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return { overlays, setOverlay, setOverlays, anyOverlayOpen, INITIAL_OVERLAYS };
}
