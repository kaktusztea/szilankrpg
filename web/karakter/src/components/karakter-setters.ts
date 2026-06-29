import type { Karakter } from '../engine/types';

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
