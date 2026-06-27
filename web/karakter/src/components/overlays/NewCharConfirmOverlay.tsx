import { OverlayPortal } from './OverlayPortal';

interface Props {
  onConfirm: () => void;
}

export function NewCharConfirmOverlay({ onConfirm }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label">Új karakter?</label>
        <span className="overlay-desc">Az aktuális karakter NEM vész el, hanem mentésre kerül.<br/>A Karakterek menü alatt elérhető.</span>
        <button className="btn-del-confirm overlay-ok-btn" onClick={onConfirm}>Új karakter</button>
      </div>
    </OverlayPortal>
  );
}
