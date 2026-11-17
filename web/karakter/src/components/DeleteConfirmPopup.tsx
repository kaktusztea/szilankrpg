import { PopupOverlay } from './PopupOverlay';
import { Ikon } from './common/Ikon';

interface Props {
  label: string;
  buttonText: string;
  /** Optional dim line under the title: what gets deleted / how to undo. */
  leírás?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Unified delete confirmation popup (ÉP / VÉ reset look): title + optional dim description + quiet danger button. Cancel = tap outside / Escape. */
export function DeleteConfirmPopup({ label, buttonText, leírás, onConfirm, onClose }: Props) {
  return (
    <PopupOverlay onClose={onClose} centerText className="kep-prompt torles-megerosites">
      <label className="kep-prompt-label-bold">{label}</label>
      {leírás && <span className="overlay-desc-dim">{leírás}</span>}
      <button className="btn-halvany-veszely torles-megerosites-btn" onClick={onConfirm}><Ikon név="kuka" />{buttonText}</button>
    </PopupOverlay>
  );
}
