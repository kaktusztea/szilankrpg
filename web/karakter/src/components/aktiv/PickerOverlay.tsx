import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function PickerOverlay({ title, onClose, children }: Props) {
  useEscapeClose(true, onClose);
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aktiv-picker">
        <div className="aktiv-picker-header"><label>{title}</label></div>
        <div className="aktiv-picker-list">{children}</div>
      </div>
    </div>,
    document.body
  );
}
