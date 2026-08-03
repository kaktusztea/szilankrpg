import { OverlayPortal } from './OverlayPortal';

interface Props {
  isNewDisabled: boolean;
  onSlots: () => void;
  onSave: () => void;
  onNew: () => void;
  onNaplo: () => void;
  onTest: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function MenuOverlay({ isNewDisabled, onSlots, onSave, onNew, onNaplo, onTest, onFullscreenHint, onClose }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-menu">
        <button className="menu-item" onClick={onSlots}>📂 Karakterek</button>
        <button className="menu-item" disabled={isNewDisabled} onClick={onSave}>💾 Mentés háttértárra</button>
        <button className="menu-item" disabled={isNewDisabled} onClick={onNew}>📄 Új karakter</button>
        <button className="menu-item" onClick={onNaplo}>📅 Napló</button>
        <div className="menu-footer">
          <button className="menu-test-chip" onClick={onTest}>T</button>
          <span className="menu-build">{__APP_VERSION__}</span>
          {document.fullscreenEnabled ? (
            <button className="menu-fs-chip" title="Teljes képernyő" onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
              onClose();
            }}>⛶</button>
          ) : (!window.matchMedia('(display-mode: standalone)').matches && (
            <button className="menu-fs-chip" title="Teljes képernyő" onClick={onFullscreenHint}>⛶</button>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
}
