import { Overlay } from '../Overlay';

interface Props {
  target: string;
  label?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmPopup({ target, label = 'Képzettség törlése', onConfirm, onClose }: Props) {
  return (
    <Overlay onClose={onClose}>
      <div className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
        <label className="kep-prompt-label-bold">{target}</label>
        <button className="btn-del-confirm he-del-confirm" onClick={onConfirm}>{label}</button>
      </div>
    </Overlay>
  );
}
