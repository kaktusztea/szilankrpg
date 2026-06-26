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

export function HarcPopups({ session, showVéResetConfirm, showVéHistory, támInfo, onVéReset, onCloseAll }: HarcPopupsProps) {
  return (
    <>
      {showVéResetConfirm && createPortal(
        <div className="kep-prompt-overlay" onClick={onCloseAll}>
          <div className="kep-prompt harc-confirm-center" onClick={e => e.stopPropagation()}>
            <button className="btn-del-confirm kep-prompt-btn-confirm" onClick={onVéReset}>VÉ Reset</button>
          </div>
        </div>,
        document.body
      )}

      {showVéHistory && createPortal(
        <div className="kep-prompt-overlay" onClick={onCloseAll}>
          <div className="kep-prompt" onClick={e => e.stopPropagation()}>
            <label className="harc-popup-label">VÉ csökkenés történet</label>
            <div className="harc-popup-text">
              {session.vé_history.length === 0 ? '—' : session.vé_history.map(v => (v > 0 ? `+${v}` : String(v))).join('; ')}
            </div>
          </div>
        </div>,
        document.body
      )}

      {támInfo && createPortal(
        <div className="kep-prompt-overlay" onClick={onCloseAll}>
          <div className="kep-prompt" onClick={e => e.stopPropagation()}>
            <label className="harc-popup-label">{támInfo.név}</label>
            <div className="harc-popup-col">
              <span>Sebesség: {támInfo.sebesség}</span>
              <span>Harckeret: {támInfo.harckeret}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
