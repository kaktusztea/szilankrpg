import type { Karakter, Fortely } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { UndoPatch } from '../hooks/useUndo';

/** Generikus undo-aware field setter gyár. */
export function makeFieldSetter(
  karakter: Karakter,
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  return function setField<K extends keyof Karakter>(
    field: K,
    undoLabel: (prev: Karakter[K], next: Karakter[K]) => string,
  ) {
    return (val: Karakter[K]) => {
      // pushUndo must run OUTSIDE the setKarakter updater — StrictMode invokes
      // updaters twice in dev, which would push the undo entry twice.
      pushUndo(undoLabel(karakter[field], val), [{ field: field as string, prev: karakter[field] }], val);
      setKarakter(prev => prev ? { ...prev, [field]: val } : prev);
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
  const fegyverNevek = [...new Set(data.fegyverek.map(f => f.Alapnév || f.Fegyver))];
  const nyelvtanulásSzint = karakter.képzettségek.find(k => k.név === 'Nyelvtanulás')?.szint ?? 0;
  return { fegyverNevek, nyelvtanulásSzint };
}

/** Faj setter (nested hátterek.faj). */
export function makeFajSetter(
  karakter: Karakter,
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
) {
  return (v: string) => {
    // pushUndo outside the updater (StrictMode double-invokes updaters in dev).
    const nextHátterek = { ...karakter.hátterek, faj: v };
    pushUndo(`Faj: ${v}`, [{ field: 'hátterek', prev: karakter.hátterek }], nextHátterek);
    setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, faj: v } } : prev);
  };
}

/** Generic undo-wrapping setKarakter (fixed label). */
export function makeUndoKarakterSetter(
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void,
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>,
  undoLabel: string,
) {
  return (updater: React.SetStateAction<Karakter | null>) => {
    // No explicit patches — pushUndo will snapshot the full karakter as fallback
    pushUndo(undoLabel);
    setKarakter(updater);
  };
}
