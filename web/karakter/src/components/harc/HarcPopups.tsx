import type { Session } from '../../engine/types';
import { PopupOverlay } from '../PopupOverlay';

interface HarcPopupsProps {
  session: Session;
  showVéResetConfirm: boolean;
  showVéHistory: boolean;
  támInfo: { név: string; sebesség: number; harckeret: number } | null;
  onVéReset: () => void;
  onCloseAll: () => void;
}

export function HarcPopups({ session, showVéResetConfirm, showVéHistory, támInfo, onVéReset, onCloseAll }: HarcPopupsProps) {
  if (!showVéResetConfirm && !showVéHistory && !támInfo) return null;

  return (
    <>
      {showVéResetConfirm && (
        <PopupOverlay onClose={onCloseAll}>
          <button className="btn-del-confirm kep-prompt-btn-confirm" onClick={onVéReset}>VÉ Reset</button>
        </PopupOverlay>
      )}

      {showVéHistory && (
        <PopupOverlay onClose={onCloseAll}>
          <label className="harc-popup-label">VÉ csökkenés történet</label>
          <div className="harc-popup-text">
            {session.vé_history.length === 0 ? '—' : session.vé_history.map(v => (v > 0 ? `+${v}` : String(v))).join('; ')}
          </div>
        </PopupOverlay>
      )}

      {támInfo && (
        <PopupOverlay onClose={onCloseAll}>
          <label className="harc-popup-label">{támInfo.név}</label>
          <div className="harc-popup-col">
            <span>Sebesség: {támInfo.sebesség}</span>
            <span>Harckeret: {támInfo.harckeret}</span>
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
