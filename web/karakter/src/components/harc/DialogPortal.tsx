import { createPortal } from 'react-dom';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export function DialogPortal({ onClose, children }: Props) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={onClose}>
      {children}
    </div>,
    document.body
  );
}
