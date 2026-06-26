import { useCallback } from 'react';
import type { GameData } from '../../../engine/data-loader';
import type { Karakter, FegyverPeldany, PancelPeldany } from '../../../engine/types';
import { lookupFegyver } from '../../../engine/helpers';

type SetKarakter = React.Dispatch<React.SetStateAction<Karakter | null>>;

export function useKarakterMutators(data: GameData, setKarakter: SetKarakter) {
  const updateFegyver = useCallback((idx: number, patch: Partial<FegyverPeldany>) => {
    setKarakter(prev => {
      if (!prev) return prev;
      return { ...prev, fegyverek: prev.fegyverek.map((f, i) => i === idx ? { ...f, ...patch } : f) };
    });
  }, [setKarakter]);

  const removeFegyver = useCallback((idx: number) => {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.fegyverek[idx];
      const fegyverek = prev.fegyverek.filter((_, i) => i !== idx);
      const fDef = lookupFegyver(data.fegyverek, removed.alap);
      const displayName = fDef?.Alapnév || removed.alap;
      const fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === removed.alap)));
      const session = { ...prev.session };
      if (session.aktív_fegyver_index >= fegyverek.length) { session.aktív_fegyver_index = 0; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_bal_index >= fegyverek.length) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_index === session.aktív_fegyver_bal_index) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      return { ...prev, fegyverek, fortélyok, session };
    });
  }, [data, setKarakter]);

  const updatePancel = useCallback((patch: Partial<PancelPeldany>) => {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }, [setKarakter]);

  const updatePajzs = useCallback((patch: Partial<{ méret: string }>) => {
    setKarakter(prev => prev ? { ...prev, pajzs: { ...prev.pajzs, ...patch } } : prev);
  }, [setKarakter]);

  const setMfFok = useCallback((fegyverAlap: string, fok: number) => {
    const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
    const displayName = fDef?.Alapnév || fegyverAlap;
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fegyverAlap)));
      if (fok > 0) fortélyok = [{ név: 'Mesterfegyver', fok, spec_típus: 'fegyver', spec_elem: displayName }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }, [data, setKarakter]);

  const setPajzsFok = useCallback((fok: number) => {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Pajzshasználat');
      if (fok > 0) fortélyok = [{ név: 'Pajzshasználat', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }, [setKarakter]);

  const setMerevvertFok = useCallback((fok: number) => {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Merevvértviselet');
      if (fok > 0) fortélyok = [{ név: 'Merevvértviselet', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }, [setKarakter]);

  return { updateFegyver, removeFegyver, updatePancel, updatePajzs, setMfFok, setPajzsFok, setMerevvertFok };
}
