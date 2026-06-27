import { OverlayPortal } from './OverlayPortal';

interface Props {
  onSingle: () => void;
  onBackup: () => void;
  onClose: () => void;
}

export function SaveOverlay({ onSingle, onBackup, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-menu">
        <label className="overlay-label-center">Mentés</label>
        <button className="menu-item" onClick={onSingle}>📄 Aktuális karakter</button>
        <button className="menu-item" onClick={onBackup}>📦 Összes karakter (backup)</button>
      </div>
    </OverlayPortal>
  );
}
