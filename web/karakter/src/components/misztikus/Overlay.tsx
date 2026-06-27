import { createPortal } from 'react-dom';

export function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => {
      if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onClose();
    }}>
      {children}
    </div>,
    document.body
  );
}
