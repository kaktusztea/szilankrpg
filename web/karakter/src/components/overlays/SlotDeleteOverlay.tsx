import { OverlayPortal } from './OverlayPortal';

interface Props {
  név: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function SlotDeleteOverlay({ név, onConfirm, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label">Karakter törlése</label>
        <span className="overlay-desc-dim">Törlöd: &ldquo;{név}&rdquo;?</span>
        <button className="btn-del-confirm overlay-ok-btn" onClick={onConfirm}>Törlés</button>
      </div>
    </OverlayPortal>
  );
}
