import { createPortal } from 'react-dom';
import type { Session } from '../../engine/types';

interface HarcPopupsProps {
  session: Session;
  showVéResetConfirm: boolean;
  showVéHistory: boolean;
  támInfo: { név: string; sebesség: number; harckeret: number } | null;
  onVéReset: () => void;
  onCloseAll: () => void;
}

/** Generikus overlay wrapper: háttér kattintásra bezár, tartalom stopPropagation. */
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={onClose}>
      <div className="kep-prompt" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function HarcPopups({ session, showVéResetConfirm, showVéHistory, támInfo, onVéReset, onCloseAll }: HarcPopupsProps) {
  if (!showVéResetConfirm && !showVéHistory && !támInfo) return null;

  return (
    <>
      {showVéResetConfirm && (
        <Overlay onClose={onCloseAll}>
          <button className="btn-del-confirm kep-prompt-btn-confirm" onClick={onVéReset}>VÉ Reset</button>
        </Overlay>
      )}

      {showVéHistory && (
        <Overlay onClose={onCloseAll}>
          <label className="harc-popup-label">VÉ csökkenés történet</label>
          <div className="harc-popup-text">
            {session.vé_history.length === 0 ? '—' : session.vé_history.map(v => (v > 0 ? `+${v}` : String(v))).join('; ')}
          </div>
        </Overlay>
      )}

      {támInfo && (
        <Overlay onClose={onCloseAll}>
          <label className="harc-popup-label">{támInfo.név}</label>
          <div className="harc-popup-col">
            <span>Sebesség: {támInfo.sebesség}</span>
            <span>Harckeret: {támInfo.harckeret}</span>
          </div>
        </Overlay>
      )}
    </>
  );
}
