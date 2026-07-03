import { useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import { PickerOverlay } from './PickerOverlay';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  manőverBónuszok: { manőver: string; érték: number; név: string }[];
}

const MANŐVER_TÍPUSOK = [
  { id: 'általános', label: 'Általános' },
  { id: 'belharcos', label: 'Belharci' },
  { id: 'lovas', label: 'Lovas' },
] as const;

export function AktivManover({ data, session, setSession, manőverBónuszok }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div className="aktiv-section">
        <h3>Manőver
          <button className={`aktiv-add-btn aktiv-add-btn-sm${session.aktív_manőver ? ' aktiv-add-btn-hidden' : ''}`}
            onClick={() => setShowPicker(true)}>+</button>
        </h3>
        {session.aktív_manőver && (() => {
          const m = data.manoverek.find(d => d.név === session.aktív_manőver);
          if (!m) return null;
          return (
            <div className="aktiv-manover-flex">
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
          <div key={`mb${i}`} className="item-row aktiv-sub-row">
            <span className="aktiv-manover-bonus">{data.manoverek.find(m => m.id === mb.manőver)?.név ?? mb.manőver.replace(/_/g, ' ')}: +{mb.érték} ({mb.név})</span>
          </div>
        ))}
      </div>

      {showPicker && (
        <PickerOverlay title="Manőver választó" onClose={() => setShowPicker(false)}>
          {MANŐVER_TÍPUSOK.map(({ id, label }) => {
            const items = data.manoverek.filter(m => m.típus === id);
            if (items.length === 0) return null;
            return (
              <div key={id}>
                <div className="aktiv-picker-category">{label}</div>
                {items.map(m => (
                  <div key={m.név}
                    className={`aktiv-picker-item${session.aktív_manőver === m.név ? ' active' : ''}`}
                    onClick={() => { setSession(s => ({ ...s, aktív_manőver: m.név })); setShowPicker(false); }}>
                    <span className="aktiv-picker-item-name">{m.név}</span>
                    <span className="aktiv-picker-item-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                    <span className="aktiv-picker-item-hatas">{m.hatás}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </PickerOverlay>
      )}
    </>
  );
}
