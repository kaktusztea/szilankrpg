import { useCallback } from 'react';
import type { Karakter, Fortely } from '../engine/types';
import { describeKepChange } from '../engine/undo-helpers';

interface Deps {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
}

export function useUndoWrappedSetters({ karakter, setKarakter, pushUndo }: Deps) {
  const tulajdonságok = karakter.tulajdonságok;
  const képzettségek = karakter.képzettségek;
  const fortélyok = karakter.fortélyok;

  const setTulajdonságokUndo = useCallback((v: any) => {
    const newVal = typeof v === 'function' ? v(tulajdonságok) : v;
    const tul = tulajdonságok as unknown as Record<string, number>;
    const changed = Object.keys(newVal).find(k => newVal[k] !== tul[k]);
    pushUndo(changed ? `${changed}: ${tul[changed!]} → ${newVal[changed!]}` : 'Tulajdonság módosítás');
    setKarakter(prev => prev ? { ...prev, tulajdonságok: newVal } : prev);
  }, [tulajdonságok, pushUndo, setKarakter]);

  const setKépzettségekUndo = useCallback((v: any) => {
    const newVal: { név: string; szint: number }[] = typeof v === 'function' ? v(képzettségek) : v;
    const desc = describeKepChange(képzettségek, newVal);
    if (desc) pushUndo(desc);
    setKarakter(prev => prev ? { ...prev, képzettségek: newVal } : prev);
  }, [képzettségek, pushUndo, setKarakter]);

  const setFortélyokUndo = useCallback((v: any) => {
    const newVal: Fortely[] = typeof v === 'function' ? v(fortélyok) : v;
    let desc = '';
    if (newVal.length > fortélyok.length) {
      const added = newVal.find(n => !fortélyok.some(f => f.név === n.név && f.spec_elem === n.spec_elem));
      if (added && added.fok > 0) desc = `Fortély: ${added.név}${added.spec_elem ? ` (${added.spec_elem})` : ""} 0→${added.fok}`;
    } else if (newVal.length < fortélyok.length) {
      const removed = fortélyok.find(f => !newVal.some(n => n.név === f.név && n.spec_elem === f.spec_elem));
      if (removed) desc = `Fortély: ${removed.név}${removed.spec_elem ? ` (${removed.spec_elem})` : ""} ${removed.fok}→0❌`;
    } else {
      const changed = newVal.find((n, i) => n.fok !== fortélyok[i]?.fok);
      if (changed) {
        const old = fortélyok.find(f => f.név === changed.név && f.spec_elem === changed.spec_elem);
        if (old && old.fok !== changed.fok) desc = `Fortély: ${changed.név}${changed.spec_elem ? ` (${changed.spec_elem})` : ""} ${old.fok}→${changed.fok}`;
      }
    }
    if (desc) pushUndo(desc);
    setKarakter(prev => prev ? { ...prev, fortélyok: newVal } : prev);
  }, [fortélyok, pushUndo, setKarakter]);

  return { setTulajdonságokUndo, setKépzettségekUndo, setFortélyokUndo };
}
