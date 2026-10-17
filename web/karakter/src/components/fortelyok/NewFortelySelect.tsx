import { useState, type ComponentProps } from 'react';
import { FortelyPickerOverlay } from './FortelyPickerOverlay';

type Props = Omit<ComponentProps<typeof FortelyPickerOverlay>, 'onClose'>;

/** "+ Új fortély..." gomb → fortély picker overlay. */
export function NewFortelySelect(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="item-row item-row-new">
        <button type="button" className="field-select fort-select fort-picker-btn" onClick={() => setOpen(true)}>
          + Új fortély...
        </button>
      </div>
      {open && <FortelyPickerOverlay {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
