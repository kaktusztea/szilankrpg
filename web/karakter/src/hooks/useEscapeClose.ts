import { useEffect } from 'react';

// Stack of currently mounted close-handlers, top-most (last mounted) last.
// Egymásba ágyazott popupoknál (pl. Sebzés popup → Statikus bónuszok popup)
// egy Escape lenyomás csak a LEGFELSŐ popupot zárja, nem az egész stacket.
const escapeStack: (() => void)[] = [];

/**
 * Escape billentyűre meghívja a callback-et (popup bezárás).
 * Használd mindenhol inline useEffect helyett.
 */
export function useEscapeClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    escapeStack.push(onClose);
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      const top = escapeStack[escapeStack.length - 1];
      if (top === onClose) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const idx = escapeStack.lastIndexOf(onClose);
      if (idx !== -1) escapeStack.splice(idx, 1);
    };
  }, [active, onClose]);
}
