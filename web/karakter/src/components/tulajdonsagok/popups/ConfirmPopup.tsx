import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  label: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPopup({ label, confirmText, onConfirm, onCancel }: Props) {
  return (
    <OverlayPortal dismissible onClose={onCancel}>
      <div className="kep-prompt kep-prompt-align-center">
        <label>{label}</label>
        <button className="btn-del-confirm he-del-confirm" onClick={onConfirm}>{confirmText}</button>
      </div>
    </OverlayPortal>
  );
}
