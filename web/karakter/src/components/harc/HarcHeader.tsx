import { useState } from 'react';
import type { Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { UndoPatch } from '../../hooks/useUndo';
import { PopupOverlay } from '../PopupOverlay';

interface HarcHeaderProps {
  ké: number;
  aktívTÉ: number | null;
  aktívVÉ: number | null;
  sfé_fizikai: number;
  sfé_energia: number;
  páncélLefedettség: number;
  manöverPont: number;
  maxVéCsökk: number;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  konstansok: GameData['konstansok'];
  onVéChange: (newVal: number) => void;
  onVéLabelTap: () => void;
  onVéResetClick: () => void;
  onKéClick: () => void;
  onTéClick: () => void;
  onSféClick: () => void;
  onManőverClick: () => void;
  gameMode?: boolean;
}

export function HarcHeader({
  ké, aktívTÉ, aktívVÉ, sfé_fizikai, sfé_energia, páncélLefedettség, manöverPont,
  maxVéCsökk, session, setSession, pushUndo, konstansok,
  onVéChange, onVéLabelTap, onVéResetClick, onKéClick, onTéClick, onSféClick, onManőverClick, gameMode,
}: HarcHeaderProps) {
  const [showMpPicker, setShowMpPicker] = useState(false);
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  return (
    <div className="harc-header">
      {/* Row 1: KÉ + TÉ (mobile) / KÉ + TÉ + SFÉ + VÉ csökk (desktop) */}
      <div className="ke-box" onClick={gameMode ? onKéClick : undefined} style={gameMode ? undefined : { cursor: 'default' }}>
        <span className="label">KÉ</span>
        <span className="value">{ké}</span>
        {session.ké_dobások.length > 0 && (
          <div className="ke-history">
            {session.ké_dobások.map((d, i) => (
              <span key={i} className="ke-history-item">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div className="te-box" onClick={gameMode && aktívTÉ != null ? onTéClick : undefined}
        style={gameMode && aktívTÉ != null ? undefined : { cursor: 'default' }}>
        <span className="label">TÉ</span>
        <span className="value">{aktívTÉ ?? '—'}</span>
        {(session.té_dobások ?? []).length > 0 && (
          <div className="ke-history">
            {(session.té_dobások ?? []).map((d, i) => (
              <span key={i} className="ke-history-item">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div className="sfe-box" onClick={onSféClick} style={{ cursor: 'pointer' }}>
        <span className="label">SFÉ (<span className="harc-monospace">{páncélLefedettség}%</span>)</span>
        <div className="sfe-values">
          <span className="sfe-line-fizikai"><strong>{sfé_fizikai}</strong>F</span>
          <span className="sfe-sep">/</span>
          <span className="sfe-line-energia"><strong>{sfé_energia}</strong>E</span>
        </div>
      </div>

      <div className="ve-csokk-box">
        <span className="label" onClick={onVéLabelTap}>VÉ</span>
        <button className="ve-reset-btn" disabled={!gameMode || session.vé_csökkenés === 0} onClick={onVéResetClick}>⟲</button>
        <div className="ve-value-row" onClick={onVéLabelTap}>
          <span className="value">{aktívVÉ ?? '—'}</span>
          {session.vé_csökkenés > 0 && <span className="ve-csokk-badge">(-{session.vé_csökkenés})</span>}
        </div>
        <div className="ve-btns">
          {(konstansok.vé_csökkentés_gombok as number[]).map(n => (
            <button key={n} disabled={!gameMode || session.vé_csökkenés >= maxVéCsökk}
              onClick={() => onVéChange(Math.min(session.vé_csökkenés + n, maxVéCsökk))}>-{n}</button>
          ))}
          <button disabled={!gameMode || session.vé_csökkenés === 0}
            onClick={() => onVéChange(Math.max(0, session.vé_csökkenés - 1))}>+1</button>
        </div>
      </div>

      {/* Row 3 (mobile) / Row 2 (desktop): Manőver + MP */}
      <div className="harc-header-bottom">
        {gameMode && (
          <button className="harc-manover-btn" onClick={onManőverClick}>⚔️ Manőver végrehajtása</button>
        )}
        <div className="mp-box" onClick={gameMode ? () => setShowMpPicker(true) : undefined}
          style={gameMode ? { cursor: 'pointer' } : undefined}>
          <span className="label">MP</span>
          <span className="mp-value">{aktMP}/{manöverPont}</span>
        </div>
      </div>

      {showMpPicker && (
        <PopupOverlay onClose={() => setShowMpPicker(false)}>
          <div className="mp-picker-popup">
            <div className="mp-picker-title">Manőver Pont</div>
            <div className="mp-picker-grid">
              {Array.from({ length: manöverPont + 1 }, (_, i) => (
                <button key={i} className={`fort-fok-btn${i === aktMP ? ' active' : ''}`}
                  onClick={() => {
                    const használt = manöverPont - i;
                    if (használt !== session.manőver_pont_használt) {
                      pushUndo(`MP: ${aktMP} → ${i}`, [{ field: 'session', prev: session }]);
                      setSession(prev => ({ ...prev, manőver_pont_használt: használt }));
                    }
                    setShowMpPicker(false);
                  }}>{i}</button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
