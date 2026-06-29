import type { ReactNode } from 'react';
import { OverlayPortal } from '../overlays/OverlayPortal';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function PickerOverlay({ title, onClose, children }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="aktiv-picker" onClick={e => e.stopPropagation()}>
        <div className="aktiv-picker-header"><label>{title}</label></div>
        <div className="aktiv-picker-list">{children}</div>
      </div>
    </OverlayPortal>
  );
}
