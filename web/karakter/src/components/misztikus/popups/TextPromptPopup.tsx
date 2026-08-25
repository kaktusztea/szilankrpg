import { OverlayPortal } from '../../overlays/OverlayPortal';
import { MAX_FREETEXT_NÉV } from '../../../ui-constants';

interface Props {
  target: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function TextPromptPopup({ target, value, onChange, onConfirm, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt" onClick={e => e.stopPropagation()}>
        <label>{target}: név</label>
        <input autoFocus maxLength={MAX_FREETEXT_NÉV} value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && value.trim()) onConfirm();
            if (e.key === 'Escape') onClose();
          }} />
        <div className="kep-prompt-btns">
          <button onClick={onConfirm} disabled={!value.trim()}>OK</button>
        </div>
      </div>
    </OverlayPortal>
  );
}
