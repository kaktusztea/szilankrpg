import { useRef, useCallback } from 'react';

/**
 * Long-press vs. short-tap megkülönböztető hook.
 * - Ha a pointer `delay` ms-ig lenyomva marad → `onLongPress` fut, és a rákövetkező
 *   kattintás elnyelődik (a short-tap handler NEM fut le).
 * - Ha korábban felengeded → `onClick` (short tap) fut.
 *
 * Egér és touch is támogatott. A `pressProps(arg)` egy gomb esemény-propjait adja vissza,
 * ahol `arg` a hívónak visszaadott azonosító (pl. lista index).
 */
export function useLongPress<T>(
  onLongPress: (arg: T) => void,
  onClick: (arg: T) => void,
  delayMs = 500,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const start = useCallback((arg: T) => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress(arg);
    }, delayMs);
  }, [onLongPress, delayMs]);

  const cancel = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const end = useCallback((arg: T) => {
    cancel();
    // A long-press már lefutott → a short-tap-et nyeljük el.
    if (firedRef.current) { firedRef.current = false; return; }
    onClick(arg);
  }, [cancel, onClick]);

  /** Egy elem (gomb) esemény-propjai. A `preventClick` a natív onClick-et helyettesíti. */
  const pressProps = useCallback((arg: T) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); start(arg); },
    onPointerUp: () => end(arg),
    onPointerLeave: cancel,
  }), [start, end, cancel]);

  return { pressProps };
}
