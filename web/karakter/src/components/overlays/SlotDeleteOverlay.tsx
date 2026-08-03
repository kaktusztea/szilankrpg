import { OverlayPortal } from './OverlayPortal';

interface Props {
  név: string;
  onConfirm: () => void;
}

// Backdrop/Escape dismiss is handled centrally by useOverlays (closeTopmost),
// so this stacked confirm does not self-dismiss — that would race with the
// global handler and also close the SlotList behind it.
export function SlotDeleteOverlay({ név, onConfirm }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label">Karakter törlése</label>
        <span className="overlay-desc-dim">Törlöd: &ldquo;{név}&rdquo;?</span>
        <button className="btn-del-confirm overlay-ok-btn" onClick={onConfirm}>Törlés</button>
      </div>
    </OverlayPortal>
  );
}
