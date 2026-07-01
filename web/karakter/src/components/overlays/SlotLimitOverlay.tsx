import { OverlayPortal } from './OverlayPortal';
import { MAX_KARAKTER_DB } from '../../ui-constants';

interface Props {
  onClose: () => void;
}

export function SlotLimitOverlay({ onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label overlay-label-error">Karakter limit</label>
        <span className="overlay-desc">
          Nem hozható létre új karakter.<br />
          Maximum tárolható karakterek száma: {MAX_KARAKTER_DB}<br />
          Törölj egy régebbi karaktert, ha újat akarsz létrehozni.
        </span>
      </div>
    </OverlayPortal>
  );
}
