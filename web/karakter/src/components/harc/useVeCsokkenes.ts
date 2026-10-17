import { useState, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Session } from '../../engine/types';
import type { HarcBaseProps } from './types';
import { coalesceVéHistory } from './shared';
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
    const newVal = reset ? 0 : Math.max(0, Math.min(session.vé_csökkenés + scaledDelta, maxVéCsökk));
    const diff = newVal - session.vé_csökkenés;
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`, [{ field: 'session', prev: session }]);
    const now = Date.now();
    const elapsed = now - lastVéChangeRef.current;
    lastVéChangeRef.current = now;
    // history bejegyzés előjele: csökkenés → negatív, visszanyerés → pozitív
    const historyDelta = diff > 0 ? -diff : Math.abs(diff);
    setSession(prev => ({
      ...prev,
      vé_csökkenés: newVal,
      vé_history: newVal === 0 ? [] : coalesceVéHistory(prev.vé_history, historyDelta, elapsed, VÉ_COALESCE_MS),
    }));
    triggerVéFlash(diff > 0 ? 'down' : 'up');
  }, [session.vé_csökkenés, pushUndo, setSession, triggerVéFlash, véVeszSzorzó, maxVéCsökk]);

  return { véFlash, changeVé, véSzorzóInfo, setVéSzorzóInfo };
}
