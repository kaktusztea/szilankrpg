import type { ReactNode } from 'react';
import { OverlayPortal } from './overlays/OverlayPortal';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  /** Escape handler; defaults to onClose (see OverlayPortal). */
  onEscape?: () => void;
  centerText?: boolean;
  className?: string;
  /** Extra osztály(ok) az overlay (backdrop) div-re - pl. mobil bottom-sheet pozíció. */
  overlayClassName?: string;
}

/** Popup overlay with portal, Escape close, background click close, and kep-prompt wrapper. */
export function PopupOverlay({ children, onClose, onEscape, centerText, className, overlayClassName }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose} onEscape={onEscape} overlayClassName={overlayClassName}>
      <div className={`${className ?? 'kep-prompt'}${centerText ? ' kep-prompt-text-center' : ''}`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </OverlayPortal>
  );
}
