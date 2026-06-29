import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEscapeClose } from '../hooks/useEscapeClose';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  centerText?: boolean;
  className?: string;
}

/** Generic popup overlay with portal, Escape close, background click close. */
export function PopupOverlay({ children, onClose, centerText, className }: Props) {
  useEscapeClose(!!onClose, onClose ?? (() => {}));
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => {
      if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose?.();
    }}>
      <div className={`${className ?? 'kep-prompt'}${centerText ? ' kep-prompt-text-center' : ''}`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
