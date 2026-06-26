import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Session } from '../engine/types';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  manőverBónuszok: { manőver: string; érték: number; név: string }[];
}

export function AktivManover({ data, session, setSession, manőverBónuszok }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="aktiv-section">
        <span className="aktiv-label">Manőver
          <button className={`aktiv-add-btn aktiv-add-btn-sm${session.aktív_manőver ? ' aktiv-add-btn-hidden' : ''}`}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_manőver && (() => {
          const m = data.manoverek.find(d => d.név === session.aktív_manőver);
          if (!m) return null;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="aktiv-field-btn">
                <strong className="aktiv-manover-name">{session.aktív_manőver}</strong>
                <span className="taktika-chip-mods">Nehézség: {m.nehézség} • {m.fázisok}</span>
                <span className="taktika-chip-mods">{m.hatás}</span>
              </div>
              <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_manőver: '' }))}>✕</button>
            </div>
          );
        })()}
        {manőverBónuszok.map((mb, i) => (
          <div key={`mb${i}`} className="kep-row aktiv-sub-row">
            <span className="aktiv-manover-bonus">{data.manoverek.find(m => m.id === mb.manőver)?.név ?? mb.manőver.replace(/_/g, ' ')}: +{mb.érték} ({mb.név})</span>
          </div>
        ))}
      </div>

      {showPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowPicker(false); }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header"><label>Manőver választó</label></div>
            <div className="aktiv-picker-list">
              {['általános', 'belharcos', 'lovas'].map(tipus => {
                const items = data.manoverek.filter(m => m.típus === tipus);
                if (items.length === 0) return null;
                return (
                  <div key={tipus}>
                    <div className="aktiv-picker-category">{tipus === 'általános' ? 'Általános' : tipus === 'belharcos' ? 'Belharci' : 'Lovas'}</div>
                    {items.map(m => (
                      <div key={m.név}
                        className={`aktiv-picker-item ${session.aktív_manőver === m.név ? 'active' : ''}`}
                        onClick={() => { setSession(s => ({ ...s, aktív_manőver: m.név })); setShowPicker(false); }}>
                        <span className="aktiv-picker-item-name">{m.név}</span>
                        <span className="aktiv-picker-item-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                        <span className="aktiv-picker-item-hatas">{m.hatás}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
