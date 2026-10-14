import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
  children: ReactNode;
  /** If true, clicking the backdrop closes the overlay via onClose */
  dismissible?: boolean;
  onClose?: () => void;
  /** Escape handler; defaults to onClose. Use when Escape must cancel while a
   *  backdrop click does something else (e.g. commits the typed value). */
  onEscape?: () => void;
}

export function OverlayPortal({ children, dismissible, onClose, onEscape }: Props) {
  const escapeHandler = onEscape ?? onClose;
  useEscapeClose(!!escapeHandler, escapeHandler ?? (() => {}));

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    // Csak a SAJÁT backdrop közvetlen kattintására zárunk. A `e.target === e.currentTarget`
    // kizárja, hogy egy beágyazott portál (pl. a Felszerelés picker, ami szintén
    // `.kep-prompt-overlay`) kattintása a React-fa szerint FELbuborékoljon ebbe a szülő
    // kezelőbe és bezárja az egész overlay-láncot (a React a portált a komponensfa, nem a
    // DOM-fa szerint buborékoltatja).
    if (dismissible && onClose && e.target === e.currentTarget) {
      e.stopPropagation();
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
