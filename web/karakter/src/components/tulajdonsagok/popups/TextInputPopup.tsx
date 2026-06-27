import { useEffect, useRef } from 'react';
import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInputPopup({ label, value, onChange, onConfirm, onCancel, maxLength = 40, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !disabled) onConfirm();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <OverlayPortal dismissible onClose={onCancel}>
      <div className="kep-prompt">
        <label>{label}</label>
        <input ref={inputRef} maxLength={maxLength} value={value}
          onChange={e => onChange(e.target.value)} onKeyDown={handleKey} />
        <div className="kep-prompt-btns">
          <button onClick={onConfirm} disabled={disabled}>OK</button>
          <button onClick={onCancel}>Mégse</button>
        </div>
      </div>
    </OverlayPortal>
  );
}
