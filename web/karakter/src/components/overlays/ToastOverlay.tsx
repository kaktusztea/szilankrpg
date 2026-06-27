import { createPortal } from 'react-dom';

interface Props {
  msg: string;
  type: 'success' | 'error';
}

export function ToastOverlay({ msg, type }: Props) {
  return createPortal(
    <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
      {msg}
    </div>,
    document.body
  );
}
