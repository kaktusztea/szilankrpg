import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
  onClose: () => void;
  children: ReactNode;
}

/** Bare overlay shell: portal + background click close + Escape close. No inner wrapper div. */
export function Overlay({ onClose, children }: Props) {
  useEscapeClose(true, onClose);
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => {
      if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose();
    }}>
      {children}
    </div>,
    document.body
  );
}
