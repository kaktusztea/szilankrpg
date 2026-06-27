import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  centerText?: boolean;
}

/** Generic popup overlay with portal — replaces repeated createPortal + kep-prompt-overlay pattern */
export function PopupOverlay({ children, onClose, centerText }: Props) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => {
      if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose?.();
    }}>
      <div className={`kep-prompt${centerText ? ' kep-prompt-text-center' : ''}`}>{children}</div>
    </div>,
    document.body
  );
}
