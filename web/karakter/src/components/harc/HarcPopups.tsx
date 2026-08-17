import type { Session } from '../../engine/types';
import { PopupOverlay } from '../PopupOverlay';

interface HarcPopupsProps {
  session: Session;
  showVéResetConfirm: boolean;
  showVéHistory: boolean;
  támInfo: { név: string; sebesség: number; harckeret: number; hk_harcmodor: number; hk_gyorsaság: number; hk_mgt: number; hk_felszerelés_mgt: number; hk_fortély: number } | null;
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
          <div className="harc-popup-text ve-history-list">
            {session.vé_history.length === 0 ? '—' : session.vé_history.map((v, i) => (
              <span key={i}>{v > 0 ? `+${v}` : String(v)}</span>
            ))}
          </div>
        </PopupOverlay>
      )}

      {támInfo && (
        <PopupOverlay onClose={onCloseAll}>
          <label className="harc-popup-label">{támInfo.név}</label>
          <div className="harc-popup-col">
            <span>Sebesség: {támInfo.sebesség}</span>
            <span>Harckeret: {támInfo.harckeret}</span>
            {(támInfo.hk_harcmodor !== 0 || támInfo.hk_gyorsaság !== 0 || támInfo.hk_fortély !== 0 || támInfo.hk_mgt + támInfo.hk_felszerelés_mgt !== 0) && <>
              {támInfo.hk_harcmodor !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_harcmodor} (Harcmodor)</span>}
              {támInfo.hk_gyorsaság !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_gyorsaság} (Gyorsaság)</span>}
              {támInfo.hk_fortély !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_fortély} (fortély)</span>}
              {(támInfo.hk_mgt + támInfo.hk_felszerelés_mgt) !== 0 && <span className="harc-popup-detail"> -{támInfo.hk_mgt + támInfo.hk_felszerelés_mgt} (MGT)</span>}
            </>}
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
