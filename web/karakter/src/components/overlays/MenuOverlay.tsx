import { OverlayPortal } from './OverlayPortal';

interface Props {
  isNewDisabled: boolean;
  onSlots: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onNew: () => void;
  onNaplo: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function MenuOverlay({ isNewDisabled, onSlots, onDuplicate, onSave, onNew, onNaplo, onFullscreenHint, onClose }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-menu">
        <button className="menu-item" onClick={onSlots}>📂 Karakterek</button>
        <button className="menu-item" disabled={isNewDisabled} onClick={onDuplicate}>📋 Duplikál</button>
        <button className="menu-item" disabled={isNewDisabled} onClick={onSave}>💾 Mentés háttértárra</button>
        <button className="menu-item" disabled={isNewDisabled} onClick={onNew}>📄 Új karakter</button>
        <button className="menu-item" onClick={onNaplo}>📅 Napló</button>
        {document.fullscreenEnabled && (
          <button className="menu-item" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
            onClose();
          }}>
            {document.fullscreenElement ? '⛶ Kilépés teljes képernyőből' : '⛶ Teljes képernyő'}
          </button>
        )}
        {!document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches && (
          <button className="menu-item" onClick={onFullscreenHint}>⛶ Teljes képernyő</button>
        )}
        <div className="menu-build">{__APP_VERSION__}</div>
      </div>
    </OverlayPortal>
  );
}
