import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
  children: ReactNode;
  /** If true, clicking the backdrop closes the overlay via onClose */
  dismissible?: boolean;
  onClose?: () => void;
}

export function OverlayPortal({ children, dismissible, onClose }: Props) {
  useEscapeClose(!!onClose, onClose ?? (() => {}));

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dismissible && onClose && (e.target as HTMLElement).classList.contains('kep-prompt-overlay')) {
      onClose();
    }
  };

  return createPortal(
    <div className="kep-prompt-overlay" onClick={handleBackdrop}>
      {children}
    </div>,
    document.body
  );
}
