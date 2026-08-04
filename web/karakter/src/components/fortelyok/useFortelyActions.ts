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

export function useFortelyActions({ data, setFortélyok }: Opts) {
  const [pendingFort, setPendingFort] = useState<Fortely | null>(null);
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
    // maxfok > 1: defer the insert until the user picks a fok (cancel = no add, no undo)
    if (def && def.maxfok > 1) {
      setPendingFort({ név, fok: 0, spec_típus: '', spec_elem: '' });
      return;
    }
    setFortélyok(prev => [...prev, { név, fok: 1, spec_típus: '', spec_elem: '' }]);
  }

  function addMultiInstance(subName: string) {
    if (!multiPickerDef) return;
    if (multiPickerDef.csoport === 'szabad' || multiPickerDef.csoport === 'kiemelt' || multiPickerDef.csoport === 'misztikus') {
      setSzabadTypePicker({ név: multiPickerDef.név, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName });
      setMultiPickerDef(null);
      return;
    }
    // maxfok > 1: defer the insert until the user picks a fok (cancel = no add, no undo)
    if (multiPickerDef.maxfok > 1) {
      setPendingFort({ név: multiPickerDef.név, fok: 0, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName });
      setMultiPickerDef(null);
      return;
    }
    setFortélyok(prev => [...prev, { név: multiPickerDef.név, fok: 1, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName }]);
    setMultiPickerDef(null);
  }

  function confirmSzabad(kiérdemelt: boolean) {
    if (!szabadTypePicker) return;
    const p = szabadTypePicker;
    setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem, ...(kiérdemelt ? { kiérdemelt: true } : {}) }]);
    setSzabadTypePicker(null);
  }

  function confirmFok(fok: number) {
    if (!pendingFort) return;
    setFortélyok(prev => [...prev, { ...pendingFort, fok }]);
    setPendingFort(null);
  }

  return {
    pendingFort, multiPickerDef, szabadTypePicker,
    setPendingFort, setMultiPickerDef, setSzabadTypePicker,
    setFok, addFortely, addMultiInstance, confirmSzabad, confirmFok,
    pendingSlot: pendingFort,
  };
}
