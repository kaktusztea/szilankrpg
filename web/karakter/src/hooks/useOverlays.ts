import { useState, useEffect, useCallback, useRef } from 'react';
import type { OverlayState } from '../components/AppOverlays';
import { TOAST_DURATION_MS } from '../ui-constants';

const INITIAL_OVERLAYS: OverlayState = {
  showSzilánkPicker: false, showSlotList: false,
  slotDeleteTarget: null, saveFile: null,
  loadError: '', showFullscreenHint: false, showNewConfirm: false, showTestConfirm: false,
  showUndo: false, undoSelected: null, overlayScreen: false,
  sharePopup: null, toast: null, importConfirm: null, showSlotLimit: false,
  backupRestore: null,
};

export function useOverlays() {
  const [overlays, setOverlays] = useState<OverlayState>(INITIAL_OVERLAYS);
  // Timestamp of the last backdrop dismiss — used to swallow the synthesized
  // "ghost" click-through iOS Safari fires on the element exposed beneath a
  // just-closed overlay (closes a stacked confirm, then the SlotList behind it).
  const lastBackdropDismiss = useRef(0);

  const setOverlay = useCallback(<K extends keyof OverlayState>(key: K, value: OverlayState[K]) => {
    setOverlays(prev => ({ ...prev, [key]: value }));
  }, []);

  const anyOverlayOpen = overlays.showNewConfirm || overlays.showTestConfirm || overlays.showSlotList || overlays.showUndo
    || !!overlays.loadError || !!overlays.overlayScreen
    || overlays.showFullscreenHint || overlays.showSzilánkPicker || !!overlays.sharePopup
    || !!overlays.slotDeleteTarget || !!overlays.saveFile
    || !!overlays.backupRestore;

  // Close the topmost overlay: a stacked confirm (slotDeleteTarget) closes on its
  // own without dismissing the SlotList behind it; otherwise reset everything.
  const closeTopmost = useCallback(() => {
    setOverlays(prev => prev.slotDeleteTarget
      ? { ...prev, slotDeleteTarget: null }
      : { ...INITIAL_OVERLAYS, toast: prev.toast, importConfirm: prev.importConfirm, backupRestore: prev.backupRestore });
  }, []);

  // ESC closes overlays
  useEffect(() => {
    if (!anyOverlayOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeTopmost();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOverlayOpen, closeTopmost]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!overlays.toast) return;
    const t = setTimeout(() => setOverlay('toast', null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [overlays.toast, setOverlay]);

  // Dismiss overlay on background click (.kep-prompt-overlay)
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (el.classList.contains('kep-prompt-overlay')) {
        // WORKAROUND: iOS-ghost-click — 400ms guard prevents iOS ghost click-through
        // onto the newly exposed backdrop after overlay dismiss. Ceiling: two deliberate
        // backdrop taps <400ms apart register as one — acceptable for modal overlays.
        const now = Date.now();
        if (now - lastBackdropDismiss.current < 400) return;
        lastBackdropDismiss.current = now;
        closeTopmost();
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [closeTopmost]);

  return { overlays, setOverlay, setOverlays, anyOverlayOpen, INITIAL_OVERLAYS };
}
