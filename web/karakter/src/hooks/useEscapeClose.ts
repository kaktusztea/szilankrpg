import { useEffect } from 'react';

/**
 * Escape billentyűre meghívja a callback-et (popup bezárás).
 * Használd mindenhol inline useEffect helyett.
 */
export function useEscapeClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, onClose]);
}
