import type { Session } from '../../engine/types';
import { PopupOverlay } from '../PopupOverlay';
import { Ikon } from '../common/Ikon';

interface HarcPopupsProps {
  session: Session;
  showVéHistory: boolean;
  támInfo: { név: string; sebesség: number; harckeret: number; hk_harcmodor: number; hk_gyorsaság: number; hk_mgt: number; hk_fortély: number } | null;
  onVéReset: () => void;
  onCloseAll: () => void;
}

export function HarcPopups({ session, showVéHistory, támInfo, onVéReset, onCloseAll }: HarcPopupsProps) {
  if (!showVéHistory && !támInfo) return null;

  return (
    <>
      {showVéHistory && (
        <PopupOverlay onClose={onCloseAll} centerText>
          <label className="harc-popup-label">VÉ csökkenés történet</label>
          <div className="harc-popup-text ve-history-list">
            {session.vé_history.length === 0 ? '-' : session.vé_history.map((v, i) => (
              <span key={i}>{v > 0 ? `+${v}` : String(v)}</span>
            ))}
          </div>
          {/* Quiet (outline) danger button: this popup is mainly for viewing */}
          <button className="btn-halvany-veszely ve-history-reset" onClick={onVéReset}><Ikon név="reset" />Visszaállítás</button>
        </PopupOverlay>
      )}

      {támInfo && (
        <PopupOverlay onClose={onCloseAll}>
          <label className="harc-popup-label">{támInfo.név}</label>
          <div className="harc-popup-col">
            <span>Sebesség: {támInfo.sebesség}</span>
            <span>Harckeret: {támInfo.harckeret}</span>
            {(támInfo.hk_harcmodor !== 0 || támInfo.hk_gyorsaság !== 0 || támInfo.hk_fortély !== 0 || támInfo.hk_mgt !== 0) && <>
              {támInfo.hk_harcmodor !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_harcmodor} (Harcmodor)</span>}
              {támInfo.hk_gyorsaság !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_gyorsaság} (Gyorsaság)</span>}
              {támInfo.hk_fortély !== 0 && <span className="harc-popup-detail"> + {támInfo.hk_fortély} (fortély)</span>}
              {támInfo.hk_mgt !== 0 && <span className="harc-popup-detail"> -{támInfo.hk_mgt} (MGT)</span>}
            </>}
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
