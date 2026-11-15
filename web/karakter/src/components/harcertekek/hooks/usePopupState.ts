import { useState, useEffect, useRef } from 'react';

export interface PopupState {
  ideaTarget: { type: 'fegyver' | 'páncél'; idx: number } | null;
  mfTarget: number | null;
  anyagTarget: number | null;
  becenévTarget: number | null;
  pancelPopup: string | null;
  pajzsPopup: string | null;
  deleteTarget: number | null;
  deleteKepzTarget: string | null;
  kepzSzintTarget: string | null;
}

export function usePopupState(onEscapeKepz?: (név: string) => void) {
  const [ideaTarget, setIdeaTarget] = useState<PopupState['ideaTarget']>(null);
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  const [anyagTarget, setAnyagTarget] = useState<number | null>(null);
  const [becenévTarget, setBecenévTarget] = useState<number | null>(null);
  const [pancelPopup, setPancelPopup] = useState<string | null>(null);
  const [pajzsPopup, setPajzsPopup] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteKepzTarget, setDeleteKepzTarget] = useState<string | null>(null);
  const [kepzSzintTarget, setKepzSzintTarget] = useState<string | null>(null);

  // Edit-menu return: a sub-popup opened from a card's edit menu goes back to that menu when it is
  // dismissed (tap outside / Escape / Mégse). A real selection closes everything (close()).
  const menüVissza = useRef<(() => void) | null>(null);
  function nyitMenüből(vissza: () => void) { menüVissza.current = vissza; }
  function visszaMenübe() {
    const vissza = menüVissza.current;
    menüVissza.current = null;
    vissza?.();
  }

  const anyOpen = !!(ideaTarget || mfTarget !== null || anyagTarget !== null || becenévTarget !== null || pancelPopup || pajzsPopup || deleteTarget !== null || deleteKepzTarget || kepzSzintTarget);

  useEffect(() => {
    if (!anyOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (kepzSzintTarget) onEscapeKepz?.(kepzSzintTarget);
        closeAll();
        visszaMenübe();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOpen, kepzSzintTarget, onEscapeKepz]);

  function closeAll() {
    setIdeaTarget(null);
    setMfTarget(null);
    setAnyagTarget(null);
    setBecenévTarget(null);
    setPancelPopup(null);
    setPajzsPopup(null);
    setDeleteTarget(null);
    setDeleteKepzTarget(null);
    setKepzSzintTarget(null);
  }

  function close(key: keyof PopupState) {
    const setters: Record<keyof PopupState, (v: null) => void> = {
      ideaTarget: setIdeaTarget,
      mfTarget: setMfTarget,
      anyagTarget: setAnyagTarget,
      becenévTarget: setBecenévTarget,
      pancelPopup: setPancelPopup,
      pajzsPopup: setPajzsPopup,
      deleteTarget: setDeleteTarget,
      deleteKepzTarget: setDeleteKepzTarget,
      kepzSzintTarget: setKepzSzintTarget,
    };
    setters[key](null);
    menüVissza.current = null;
  }

  /** Close without a selection (tap outside / Escape / Mégse): back to the edit menu if opened from there. */
  function dismiss(key: keyof PopupState) {
    const vissza = menüVissza.current;
    close(key);
    vissza?.();
  }

  const state: PopupState = { ideaTarget, mfTarget, anyagTarget, becenévTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget };

  return {
    state,
    close,
    dismiss,
    nyitMenüből,
    setIdeaTarget,
    setMfTarget,
    setAnyagTarget,
    setBecenévTarget,
    setPancelPopup,
    setPajzsPopup,
    setDeleteTarget,
    setDeleteKepzTarget,
    setKepzSzintTarget,
  };
}
