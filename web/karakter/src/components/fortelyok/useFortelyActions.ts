import { useState } from 'react';
import type { FortelySummary } from '../../engine/data-loader';
import type { GameData } from '../../engine/data-loader';
import type { Fortely, Karakter } from '../../engine/types';
import type { SzabadTypePicker } from './types';
import { EGYEDI_FORTELY_SENTINEL } from '../../ui-constants';

interface Opts {
  data: GameData;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
}

export function useFortelyActions({ data, setFortélyok, karakter, setKarakter }: Opts) {
  const [pendingFort, setPendingFort] = useState<Fortely | null>(null);
  const [multiPickerDef, setMultiPickerDef] = useState<FortelySummary | null>(null);
  const [szabadTypePicker, setSzabadTypePicker] = useState<SzabadTypePicker | null>(null);
  const [egyediPicker, setEgyediPicker] = useState(false);

  function setFok(idx: number, fok: number) {
    setFortélyok(prev => prev.map((f, i) => i === idx ? { ...f, fok } : f));
  }

  function addFortely(név: string) {
    if (név === EGYEDI_FORTELY_SENTINEL) {
      setEgyediPicker(true);
      return;
    }
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

  function confirmEgyedi(név: string, kiterjeszti: string[]) {
    setEgyediPicker(false);
    setSzabadTypePicker({ név, spec_típus: 'egyedi', spec_elem: '', kiterjeszti: kiterjeszti.length > 0 ? kiterjeszti : undefined });
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
    setFortélyok(prev => [...prev, {
      név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem,
      ...(kiérdemelt ? { kiérdemelt: true } : {}),
      ...(p.kiterjeszti ? { kiterjeszti: p.kiterjeszti } : {}),
    }]);
    setSzabadTypePicker(null);
  }

  function confirmFok(fok: number) {
    if (!pendingFort) return;
    setFortélyok(prev => [...prev, { ...pendingFort, fok }]);
    // Auto-add weapon to karakter.fegyverek if this is a weapon-type fortély (Mesterfegyver)
    if (pendingFort.spec_típus === 'fegyver' && pendingFort.spec_elem) {
      ensureFegyverOnKarakter(pendingFort.spec_elem);
    }
    setPendingFort(null);
  }

  /** If the weapon is not yet in karakter.fegyverek, add it automatically. */
  function ensureFegyverOnKarakter(fegyverNév: string) {
    const already = karakter.fegyverek.some(f => f.alap.toLowerCase() === fegyverNév.toLowerCase());
    if (already) return;
    const defaultAnyag = (data.konstansok.fegyver_anyagok as string[])[0] ?? '';
    setKarakter(prev => {
      if (!prev) return prev;
      if (prev.fegyverek.some(f => f.alap.toLowerCase() === fegyverNév.toLowerCase())) return prev;
      return { ...prev, fegyverek: [...prev.fegyverek, { alap: fegyverNév, név: '', anyag: defaultAnyag, idea: 0 }] };
    });
  }

  return {
    pendingFort, multiPickerDef, szabadTypePicker, egyediPicker,
    setPendingFort, setMultiPickerDef, setSzabadTypePicker, setEgyediPicker,
    setFok, addFortely, addMultiInstance, confirmSzabad, confirmEgyedi, confirmFok,
    pendingSlot: pendingFort,
  };
}
