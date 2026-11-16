import { useState, type ComponentProps } from 'react';
import { FortelyPickerOverlay } from './FortelyPickerOverlay';
import { Ikon } from '../common/Ikon';

type Props = Omit<ComponentProps<typeof FortelyPickerOverlay>, 'onClose'>;

/** Small "+" button in the group header → fortély picker overlay. */
export function NewFortelySelect(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="csoport-uj-btn" title="Új fortély" aria-label="Új fortély"
        onClick={e => { e.stopPropagation(); setOpen(true); }}><Ikon név="új" /></button>
      {open && <FortelyPickerOverlay {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
