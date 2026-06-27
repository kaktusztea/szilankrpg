import { OverlayPortal } from './OverlayPortal';

interface Props {
  név: string;
  copied: boolean;
  url?: string;
  onClose: () => void;
}

export function SharePopupOverlay({ név, copied, url, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-confirm">
        <label className="share-popup-label">🔗 Megosztás</label>
        <span className="share-popup-msg">
          {copied
            ? <>„{név}" link vágólapra másolva!</>
            : <>Másold ki a linket:</>}
        </span>
        {!copied && url && (
          <input readOnly value={url} onFocus={e => e.target.select()} className="share-popup-input" />
        )}
        <button className="menu-item overlay-ok-btn" onClick={onClose}>OK</button>
      </div>
    </OverlayPortal>
  );
}
