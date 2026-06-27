import { OverlayPortal } from './OverlayPortal';

interface Props {
  message: string;
  onClose: () => void;
}

export function LoadErrorOverlay({ message, onClose }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label overlay-label-error">Betöltési hiba</label>
        <span className="overlay-desc">{message}</span>
        <button className="btn-del-confirm overlay-ok-btn" onClick={onClose}>OK</button>
      </div>
    </OverlayPortal>
  );
}
