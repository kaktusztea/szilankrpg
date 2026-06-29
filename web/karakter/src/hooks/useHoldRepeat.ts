import { useRef, useCallback } from 'react';

/**
 * Hook for hold-to-repeat button behavior (accelerating).
 * Returns startHold/stopHold handlers for mouse/touch events.
 */
export function useHoldRepeat(onTick: (dir: 1 | -1, step?: number) => void, opts?: { initialDelay?: number; minDelay?: number; factor?: number; getStep?: (elapsed: number) => number }) {
  const { initialDelay = 200, minDelay = 50, factor = 0.85, getStep } = opts ?? {};
  const holdRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });

  const startHold = useCallback((dir: 1 | -1) => {
    holdRef.current.active = true;
    let delay = initialDelay;
    const startTime = Date.now();
    function tick() {
      if (!holdRef.current.active) return;
      const step = getStep ? getStep(Date.now() - startTime) : 1;
      onTick(dir, step);
      delay = Math.max(minDelay, delay * factor);
      holdRef.current.timer = setTimeout(tick, delay);
    }
    holdRef.current.timer = setTimeout(tick, delay);
  }, [onTick, initialDelay, minDelay, factor, getStep]);

  const stopHold = useCallback(() => {
    holdRef.current.active = false;
    if (holdRef.current.timer) {
      clearTimeout(holdRef.current.timer);
      holdRef.current.timer = null;
    }
  }, []);

  /** Convenience: returns event props for a button (mouse + touch) */
  const holdProps = useCallback((dir: 1 | -1) => ({
    onMouseDown: () => startHold(dir),
    onMouseUp: stopHold,
    onMouseLeave: stopHold,
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); startHold(dir); },
    onTouchEnd: stopHold,
  }), [startHold, stopHold]);

  return { startHold, stopHold, holdProps };
}
