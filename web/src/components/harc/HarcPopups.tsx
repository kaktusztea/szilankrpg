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
          <div className="kep-prompt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
            <button className="btn-del-confirm" style={{ fontSize: '16px', padding: '6px 14px' }} onClick={onVéReset}>VÉ Reset</button>
          </div>
        </div>,
        document.body
      )}

      {showVéHistory && createPortal(
        <div className="kep-prompt-overlay" onClick={onCloseAll}>
          <div className="kep-prompt" onClick={e => e.stopPropagation()}>
            <label style={{ fontWeight: 'bold' }}>VÉ csökkenés történet</label>
            <div style={{ fontSize: '15px', color: 'var(--text)' }}>
              {session.vé_history.length === 0 ? '—' : session.vé_history.map(v => (v > 0 ? `+${v}` : String(v))).join('; ')}
            </div>
          </div>
        </div>,
        document.body
      )}

      {támInfo && createPortal(
        <div className="kep-prompt-overlay" onClick={onCloseAll}>
          <div className="kep-prompt" onClick={e => e.stopPropagation()}>
            <label style={{ fontWeight: 'bold' }}>{támInfo.név}</label>
            <div style={{ fontSize: '15px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
