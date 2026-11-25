import type { HarcTerület } from '../../engine/taktika/taktika-helpers';
import { TaktikaPickerPopup } from './TaktikaPickerPopup';
import { HelyzetPickerPopup } from './HelyzetPickerPopup';
import type { SessionProps } from '../session-props';

/** The Taktika or Harci helyzet picker of a roll popup (the popup switches to it as a sub-popup). */
export function TaktikaHelyzetPicker({ fajta, terület, onClose, ...p }: SessionProps & {
  fajta: 'taktika' | 'helyzet'; terület: HarcTerület; onClose: () => void;
}) {
  return fajta === 'taktika'
    ? <TaktikaPickerPopup {...p} terület={terület} onClose={onClose} />
    : <HelyzetPickerPopup {...p} terület={terület} onClose={onClose} />;
}
