import { useState, useRef, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Session } from '../../engine/types';
import type { HarcBaseProps } from './types';
import { coalesceVéHistory } from '../../engine/harc/shared';
import { VÉ_FLASH_MS, VÉ_COALESCE_MS } from '../../ui-constants';

/**
 * A Harc fül VÉ-csökkenés kezelése: változtatás (szorzóval, korláttal), undo, history-összevonás, flash animáció.
 * `véVeszSzorzó`: a "VÉ veszteség duplázódik" jellegű helyzetek szorzója; `maxVéCsökk`: a csökkenés felső korlátja.
 */
export function useVéCsökkenés(
  session: Session, setSession: Dispatch<SetStateAction<Session>>, pushUndo: HarcBaseProps['pushUndo'],
  véVeszSzorzó: number, maxVéCsökk: number,
) {
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVéChangeRef = useRef<number>(0);
  // Latest session, also advanced synchronously in changeVé: two taps can land before React
  // re-renders, and the closure's `session` would still hold the pre-tap value (lost update).
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Any interaction outside the VÉ adjust buttons (menu, popup, tab switch, ...) breaks the
  // coalescing window: the next VÉ change starts a new history entry even within VÉ_COALESCE_MS.
  useEffect(() => {
    const megszakít = (e: Event) => {
      if (!(e.target instanceof Element && e.target.closest('.ve-btns'))) lastVéChangeRef.current = 0;
    };
    document.addEventListener('pointerdown', megszakít, true);
    document.addEventListener('keydown', megszakít, true);
    return () => {
      document.removeEventListener('pointerdown', megszakít, true);
      document.removeEventListener('keydown', megszakít, true);
    };
  }, []);
  /** A szorzott csökkenés eredeti értéke (VeSzorzoInfoPopup), vagy null. */
  const [véSzorzóInfo, setVéSzorzóInfo] = useState<number | null>(null);

  // VÉ flash animation
  const triggerVéFlash = useCallback((dir: 'down' | 'up') => {
    setVéFlash(dir);
    if (véFlashTimer.current) clearTimeout(véFlashTimer.current);
    véFlashTimer.current = setTimeout(() => setVéFlash(''), VÉ_FLASH_MS);
  }, []);

  /** delta: nyers változás (pozitív = csökkenés, negatív = visszanyerés); reset=true → teljes törlés. */
  const changeVé = useCallback((delta: number, reset = false) => {
    // Csökkenéskor (delta > 0) a "VÉ veszteség duplázódik" jellegű harci helyzetek szorzót adnak
    // (Földön fekve, Helyhez kötve, VÉ kiterjesztés - l. harci_helyzetek.yaml `mód: szorzó`, cél: vé_veszteség).
    const scaledDelta = delta > 0 ? delta * véVeszSzorzó : delta;
    if (delta > 0 && véVeszSzorzó !== 1) setVéSzorzóInfo(delta);
    const cur = sessionRef.current;
    const newVal = reset ? 0 : Math.max(0, Math.min(cur.vé_csökkenés + scaledDelta, maxVéCsökk));
    const diff = newVal - cur.vé_csökkenés;
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`, [{ field: 'session', prev: cur }]);
    const now = Date.now();
    const elapsed = now - lastVéChangeRef.current;
    lastVéChangeRef.current = now;
    // history bejegyzés előjele: csökkenés → negatív, visszanyerés → pozitív
    const historyDelta = diff > 0 ? -diff : Math.abs(diff);
    const véHistory = newVal === 0 ? [] : coalesceVéHistory(cur.vé_history, historyDelta, elapsed, VÉ_COALESCE_MS);
    sessionRef.current = { ...cur, vé_csökkenés: newVal, vé_history: véHistory };
    setSession(prev => ({ ...prev, vé_csökkenés: newVal, vé_history: véHistory }));
    triggerVéFlash(diff > 0 ? 'down' : 'up');
  }, [pushUndo, setSession, triggerVéFlash, véVeszSzorzó, maxVéCsökk]);

  return { véFlash, changeVé, véSzorzóInfo, setVéSzorzóInfo };
}
