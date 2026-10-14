import { useEffect, useRef } from 'react';

// Stack of currently active Escape handlers (stable tokens), top-most (last mounted) last.
// Egymásba ágyazott popupoknál (pl. Felszerelés overlay → méret picker) egy Escape lenyomás
// CSAK a legfelső popupot zárja. A stack elemei stabil token-ek (useRef), NEM a hívó
// `onClose` függvény-referenciái - így az inline arrow `onClose`-ok (amik minden rendernél
// új referenciát kapnak) sem borítják fel a stack sorrendjét/azonosítását.
const escapeStack: object[] = [];

/** Van-e egymásba ágyazott lokális popup (stack mélység ≥ 2, pl. Felszerelés overlay → méret-picker)?
 * Ilyenkor az ESC-et a legfelső lokális popup kezeli, a globális overlay-ESC (useOverlays.closeTopmost)
 * félreáll - különben az egész overlay-láncot bezárná. Egyszintű overlay-nél (mélység ≤ 1) a globális
 * kezelő a régi módon fut (pl. SlotList + törlés-confirm stacked logika változatlan).
 * ponytail: mélység-heurisztika; ha egy App-overlay egyszer több saját ESC-kezelőt regisztrálna
 * egymás fölé, az is "beágyazottnak" számít (ami ott is a helyes: csak a legfelső zárjon). */
export function nestedEscapeActive(): boolean {
  return escapeStack.length >= 2;
}

/**
 * Escape billentyűre meghívja a callback-et (popup bezárás).
 * Használd mindenhol inline useEffect helyett.
 */
export function useEscapeClose(active: boolean, onClose: () => void) {
  // Stabil token EZ a hook-példány azonosítására a stackben (render-független).
  const tokenRef = useRef<object>({});
  // A legfrissebb onClose-t ref-ben tartjuk, hogy a push/pop ne függjön a referenciától.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const token = tokenRef.current;
    escapeStack.push(token);
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // Csak a legfelső (utoljára felrakott) kezelő reagáljon.
      if (escapeStack[escapeStack.length - 1] === token) {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const idx = escapeStack.lastIndexOf(token);
      if (idx !== -1) escapeStack.splice(idx, 1);
    };
  }, [active]);
}
