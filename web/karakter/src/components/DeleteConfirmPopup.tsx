import { PopupOverlay } from './PopupOverlay';

interface Props {
  label: string;
  buttonText: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Unified delete confirmation popup — label + red button, used across all screens. */
export function DeleteConfirmPopup({ label, buttonText, onConfirm, onClose }: Props) {
  return (
    <PopupOverlay onClose={onClose}>
      <label className="kep-prompt-label-bold">{label}</label>
      <button className="btn-del-confirm he-del-confirm" onClick={onConfirm}>{buttonText}</button>
    </PopupOverlay>
  );
}
