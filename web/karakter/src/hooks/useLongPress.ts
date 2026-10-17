import { useRef, useCallback } from 'react';

/**
 * Tap-osztályozás dupla-tap detektáláshoz (pure - tesztelhető a React nélkül).
 * @param most      a jelenlegi tap ideje (ms)
 * @param utolsóTap az előző tap ideje (ms, 0 = nincs)
 * @param dblMs     dupla-tap ablak
 * @returns 'dupla' ha `most - utolsóTap < dblMs` (a második gyors tap), különben 'első'.
 */
export function tapKlasszifikáció(most: number, utolsóTap: number, dblMs: number): 'dupla' | 'első' {
  return most - utolsóTap < dblMs ? 'dupla' : 'első';
}

/**
 * Long-press vs. short-tap (vs. dupla-tap) megkülönböztető hook.
 * - Ha a pointer `delay` ms-ig lenyomva marad → `onLongPress` fut, és a rákövetkező
 *   kattintás elnyelődik (a short-tap handler NEM fut le).
 * - Ha korábban felengeded → `onClick` (short tap) fut.
 * - Ha megadsz `onDoubleClick`-et: két gyors tap (`dblMs`-en belül) → `onDoubleClick`, és a
 *   második tap single-click-je elnyelődik. Ilyenkor a single tap `dblMs`-mal KÉSIK (meg kell
 *   várni, hátha jön a második tap) - csak ott kapcsold be, ahol ez elfogadható.
 *
 * Egér és touch is támogatott. A `pressProps(arg)` egy gomb esemény-propjait adja vissza,
 * ahol `arg` a hívónak visszaadott azonosító (pl. lista index).
 */
export function useLongPress<T>(
  onLongPress: (arg: T) => void,
  onClick: (arg: T) => void,
  delayMs = 500,
  onDoubleClick?: (arg: T) => void,
  dblMs = 280,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  // Dupla-tap detektáláshoz: a legutóbbi tap ideje + a késleltetett single-tap timer.
  const lastTapRef = useRef(0);
  const singleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (!onDoubleClick) { onClick(arg); return; }

    // Dupla-tap ág: a második tap a dblMs ablakon belül → onDoubleClick, single elnyelve.
    const now = Date.now();
    if (tapKlasszifikáció(now, lastTapRef.current, dblMs) === 'dupla') {
      lastTapRef.current = 0;
      if (singleTimerRef.current) { clearTimeout(singleTimerRef.current); singleTimerRef.current = null; }
      onDoubleClick(arg);
      return;
    }
    // Első tap: késleltetve indítjuk a single-et, hátha jön a második.
    lastTapRef.current = now;
    singleTimerRef.current = setTimeout(() => {
      lastTapRef.current = 0;
      singleTimerRef.current = null;
      onClick(arg);
    }, dblMs);
  }, [cancel, onClick, onDoubleClick, dblMs]);

  /** Egy elem (gomb) esemény-propjai. A `preventClick` a natív onClick-et helyettesíti. */
  const pressProps = useCallback((arg: T) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); start(arg); },
    onPointerUp: () => end(arg),
    onPointerLeave: cancel,
  }), [start, end, cancel]);

  return { pressProps };
}
