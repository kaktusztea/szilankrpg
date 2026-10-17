import type { Kepzettseg } from '../../engine/types';
import type { KepzettsegDef } from '../../engine/data-loader';
import { useState } from 'react';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { FortelyPickerOverlay } from './FortelyPickerOverlay';

interface Props {
  available: FortelySummary[];
  csoport: string;
  slotok: Fortely[];
  tsz: number;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  nyelvtanulásSzint: number;
  képzettségek: Kepzettseg[];
  kepzettsegDefs: KepzettsegDef[];
  onAdd: (id: string) => void;
}

export function NewFortelySelect({ available, csoport, slotok, tsz, fortélyok, fegyverNevek, nyelvtanulásSzint, képzettségek, kepzettsegDefs, onAdd }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="item-row item-row-new">
        <button className="field-select fort-select fort-picker-btn" onClick={() => setOpen(true)}>
          + Új fortély...
        </button>
      </div>
      {open && (
        <FortelyPickerOverlay
          available={available}
          csoport={csoport}
          slotok={slotok}
          tsz={tsz}
          fortélyok={fortélyok}
          fegyverNevek={fegyverNevek}
          nyelvtanulásSzint={nyelvtanulásSzint}
          képzettségek={képzettségek}
          kepzettsegDefs={kepzettsegDefs}
          onAdd={onAdd}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
