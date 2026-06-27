import { Overlay } from '../Overlay';

interface Props {
  target: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function TextPromptPopup({ target, value, onChange, onConfirm, onClose }: Props) {
  return (
    <Overlay onClose={onClose}>
      <div className="kep-prompt">
        <label>{target}: név</label>
        <input autoFocus maxLength={30} value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && value.trim()) onConfirm();
            if (e.key === 'Escape') onClose();
          }} />
        <div className="kep-prompt-btns">
          <button onClick={onConfirm} disabled={!value.trim()}>OK</button>
        </div>
      </div>
    </Overlay>
  );
}
