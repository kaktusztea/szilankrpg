import type { ReactNode } from 'react';
import { OverlayPortal } from './overlays/OverlayPortal';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  centerText?: boolean;
  className?: string;
}

/** Popup overlay with portal, Escape close, background click close, and kep-prompt wrapper. */
export function PopupOverlay({ children, onClose, centerText, className }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className={`${className ?? 'kep-prompt'}${centerText ? ' kep-prompt-text-center' : ''}`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </OverlayPortal>
  );
}
