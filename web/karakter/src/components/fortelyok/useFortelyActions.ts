import { useState } from 'react';
import type { FortelySummary } from '../../engine/data-loader';
import type { GameData } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';
import type { SzabadTypePicker } from './types';

interface Opts {
  data: GameData;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
}

export function useFortelyActions({ data, fortélyok, setFortélyok }: Opts) {
  const [pendingFortIdx, setPendingFortIdx] = useState<number | null>(null);
  const [multiPickerDef, setMultiPickerDef] = useState<FortelySummary | null>(null);
  const [szabadTypePicker, setSzabadTypePicker] = useState<SzabadTypePicker | null>(null);

  function setFok(idx: number, fok: number) {
    setFortélyok(prev => prev.map((f, i) => i === idx ? { ...f, fok } : f));
  }

  function addFortely(név: string) {
    const def = data.fortelySummaries.find(d => d.név === név);
    if (def && def.csoport === 'szabad') {
      if (def.többszörös_típus) { setMultiPickerDef(def); return; }
      setSzabadTypePicker({ név, spec_típus: '', spec_elem: '' });
      return;
    }
    if (def && def.többszörös_típus) { setMultiPickerDef(def); return; }
    setFortélyok(prev => {
      if (def && def.maxfok > 1) {
        setPendingFortIdx(prev.length);
        return [...prev, { név, fok: 0, spec_típus: '', spec_elem: '' }];
      }
      return [...prev, { név, fok: 1, spec_típus: '', spec_elem: '' }];
    });
  }

  function addMultiInstance(subName: string) {
    if (!multiPickerDef) return;
    if (multiPickerDef.csoport === 'szabad' || multiPickerDef.csoport === 'kiemelt' || multiPickerDef.csoport === 'misztikus') {
      setSzabadTypePicker({ név: multiPickerDef.név, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName });
      setMultiPickerDef(null);
      return;
    }
    const maxfok = multiPickerDef.maxfok;
    setFortélyok(prev => {
      if (maxfok > 1) setPendingFortIdx(prev.length);
      return [...prev, { név: multiPickerDef.név, fok: maxfok > 1 ? 0 : 1, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName }];
    });
    setMultiPickerDef(null);
  }

  function confirmSzabad(kiérdemelt: boolean) {
    if (!szabadTypePicker) return;
    const p = szabadTypePicker;
    setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem, ...(kiérdemelt ? { kiérdemelt: true } : {}) }]);
    setSzabadTypePicker(null);
  }

  function confirmFok(fok: number) {
    if (pendingFortIdx === null) return;
    setFok(pendingFortIdx, fok);
    setPendingFortIdx(null);
  }

  return {
    pendingFortIdx, multiPickerDef, szabadTypePicker,
    setPendingFortIdx, setMultiPickerDef, setSzabadTypePicker,
    setFok, addFortely, addMultiInstance, confirmSzabad, confirmFok,
    pendingSlot: pendingFortIdx !== null ? fortélyok[pendingFortIdx] : null,
  };
}
