import { useState, useEffect } from 'react';

export interface PopupState {
  ideaTarget: { type: 'fegyver' | 'páncél'; idx: number } | null;
  mfTarget: number | null;
  anyagTarget: number | null;
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
  const [pancelPopup, setPancelPopup] = useState<string | null>(null);
  const [pajzsPopup, setPajzsPopup] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteKepzTarget, setDeleteKepzTarget] = useState<string | null>(null);
  const [kepzSzintTarget, setKepzSzintTarget] = useState<string | null>(null);

  const anyOpen = !!(ideaTarget || mfTarget !== null || anyagTarget !== null || pancelPopup || pajzsPopup || deleteTarget !== null || deleteKepzTarget || kepzSzintTarget);

  useEffect(() => {
    if (!anyOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (kepzSzintTarget) onEscapeKepz?.(kepzSzintTarget);
        closeAll();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOpen, kepzSzintTarget]);

  function closeAll() {
    setIdeaTarget(null);
    setMfTarget(null);
    setAnyagTarget(null);
    setPancelPopup(null);
    setPajzsPopup(null);
    setDeleteTarget(null);
    setDeleteKepzTarget(null);
    setKepzSzintTarget(null);
  }

  function close(key: keyof PopupState) {
    const setters: Record<keyof PopupState, (v: any) => void> = {
      ideaTarget: setIdeaTarget,
      mfTarget: setMfTarget,
      anyagTarget: setAnyagTarget,
      pancelPopup: setPancelPopup,
      pajzsPopup: setPajzsPopup,
      deleteTarget: setDeleteTarget,
      deleteKepzTarget: setDeleteKepzTarget,
      kepzSzintTarget: setKepzSzintTarget,
    };
    setters[key](null);
  }

  const state: PopupState = { ideaTarget, mfTarget, anyagTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget };

  return {
    state,
    close,
    setIdeaTarget,
    setMfTarget,
    setAnyagTarget,
    setPancelPopup,
    setPajzsPopup,
    setDeleteTarget,
    setDeleteKepzTarget,
    setKepzSzintTarget,
  };
}
