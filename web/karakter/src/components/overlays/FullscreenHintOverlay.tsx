import { OverlayPortal } from './OverlayPortal';

interface Props {
  onClose: () => void;
}

export function FullscreenHintOverlay({ onClose }: Props) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-confirm">
        <label className="overlay-label">Teljes képernyő</label>
        <span className="overlay-desc">
          {isIOS
            ? 'Megosztás ikon (⬆️) → Főképernyőhöz adás'
            : '⋮ menü → Telepítés / Hozzáadás a kezdőképernyőhöz'}
        </span>
        <button className="menu-item overlay-ok-btn" onClick={onClose}>OK</button>
      </div>
    </OverlayPortal>
  );
}
