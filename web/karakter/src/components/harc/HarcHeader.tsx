import type { Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { UndoPatch } from '../../hooks/useUndo';

interface HarcHeaderProps {
  ké: number;
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
}

export function HarcHeader({
  ké, sfé_fizikai, sfé_energia, páncélLefedettség, manöverPont,
  maxVéCsökk, session, setSession, konstansok,
  onVéChange, onVéLabelTap, onVéResetClick, onKéClick,
}: HarcHeaderProps) {
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  return (
    <div className="harc-header">
      <div className="ke-box" onClick={onKéClick}>
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

      <div className="sfe-box">
        <span className="label">SFÉ (<span className="harc-monospace">{páncélLefedettség}%</span>)</span>
        <div className="sfe-values">
          <span className="sfe-line">Fizikai: <strong>{sfé_fizikai}</strong></span>
          <span className="sfe-line harc-sfe-secondary">Energia: <strong>{sfé_energia}</strong></span>
        </div>
      </div>

      <div className="ve-csokk-box">
        <span className="label" onClick={onVéLabelTap}>VÉ csökkenés</span>
        <span className="value" onClick={onVéLabelTap}>
          {session.vé_csökkenés === 0 ? 0 : -session.vé_csökkenés}
        </span>
        <div className="ve-btns">
          {(konstansok.vé_csökkentés_gombok as number[]).map(n => (
            <button key={n} disabled={session.vé_csökkenés >= maxVéCsökk}
              onClick={() => onVéChange(Math.min(session.vé_csökkenés + n, maxVéCsökk))}>-{n}</button>
          ))}
          <button disabled={session.vé_csökkenés === 0}
            onClick={() => onVéChange(Math.max(0, session.vé_csökkenés - 1))}>+1</button>
          <button disabled={session.vé_csökkenés === 0} onClick={onVéResetClick}>⟲</button>
        </div>
      </div>

      <div className="mp-box">
        <span className="label">MP</span>
        <span className="value">{aktMP}/{manöverPont}</span>
        <div className="ve-btns">
          <button disabled={aktMP === 0}
            onClick={() => setSession(prev => ({ ...prev, manőver_pont_használt: prev.manőver_pont_használt + 1 }))}>-1</button>
          <button disabled={session.manőver_pont_használt === 0}
            onClick={() => setSession(prev => ({ ...prev, manőver_pont_használt: 0 }))}>⟲</button>
        </div>
      </div>
    </div>
  );
}
