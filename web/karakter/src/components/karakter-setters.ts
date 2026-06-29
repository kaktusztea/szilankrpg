import type { Karakter, Fortely } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { lookupFegyver } from '../engine/utils';

/** Generikus undo-aware field setter gyár. */
export function makeFieldSetter(
  pushUndo: (leírás: string) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  return function setField<K extends keyof Karakter>(
    field: K,
    undoLabel: (prev: Karakter[K], next: Karakter[K]) => string,
  ) {
    return (val: Karakter[K]) => {
      setKarakter(prev => {
        if (!prev) return prev;
        pushUndo(undoLabel(prev[field], val));
        return { ...prev, [field]: val };
      });
    };
  };
}

/** Anyanyelv setter factory (Nyelvismeret kiérdemelt szinkronnal). */
export function makeAnyanyelvSetter(
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
  közösNyelv: string,
) {
  return (v: string) => setKarakter(prev => {
    if (!prev) return prev;
    const filtered = prev.fortélyok.filter(f => !(f.név === 'Nyelvismeret' && f.kiérdemelt));
    const ingyenesek: Fortely[] = [
      { név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: közösNyelv, kiérdemelt: true },
    ];
    if (v && v !== közösNyelv) {
      ingyenesek.push({ név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: v, kiérdemelt: true });
    }
    return { ...prev, anyanyelv: v, fortélyok: [...ingyenesek, ...filtered] };
  });
}

/** Fortélyok screen props builder. */
export function buildFortelyokProps(karakter: Karakter, data: GameData) {
  const fegyverNevek = karakter.fegyverek.map(f => {
    const fd = lookupFegyver(data.fegyverek, f.alap);
    return fd?.Alapnév || f.alap;
  });
  const nyelvtanulásSzint = karakter.képzettségek.find(k => k.név === 'Nyelvtanulás')?.szint ?? 0;
  return { fegyverNevek, távfegyverNevek: karakter.távfegyverek.map(tf => tf.alap), nyelvtanulásSzint };
}
