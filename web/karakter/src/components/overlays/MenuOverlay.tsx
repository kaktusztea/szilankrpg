import { OverlayPortal } from './OverlayPortal';

interface Props {
  undoCount: number;
  onUndo: () => void;
  onSlots: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onNew: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function MenuOverlay({ undoCount, onUndo, onSlots, onDuplicate, onSave, onNew, onFullscreenHint, onClose }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-menu">
        <button className="menu-item" disabled={undoCount === 0} onClick={onUndo}>
          ↩ Visszavonás{undoCount > 0 ? ` (${undoCount})` : ''}
        </button>
        <button className="menu-item" onClick={onSlots}>📂 Karakterek</button>
        <button className="menu-item" onClick={onDuplicate}>📋 Duplikál</button>
        <button className="menu-item" onClick={onSave}>💾 Mentés</button>
        <button className="menu-item" onClick={onNew}>📄 Új karakter</button>
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
      </div>
    </OverlayPortal>
  );
}
