import { useState } from 'react';
import type { Session, UndoPatch } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { Ikon } from '../common/Ikon';

interface HarcHeaderProps {
  ké: number;
  aktívTÉ: number | null;
  aktívVÉ: number | null;
  sfé_fizikai: number;
  sfé_energia: number;
  páncélLefedettség: number;
  manöverPont: number;
  manőverAlap: number;
  /** MA bontáshoz: HM összeg (TÉ+VÉ) - MA = ceil(HM / 10). */
  hm: number;
  maxVéCsökk: number;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  konstansok: GameData['konstansok'];
  /** delta: nyers, nem szorzott csökkenés/(negatív) visszanyerés mennyisége. */
  onVéChange: (delta: number) => void;
  onVéLabelTap: () => void;
  onKéClick: () => void;
  onTéClick: () => void;
  onSféClick: () => void;
  onManőverClick: () => void;
  gameMode?: boolean;
}

export function HarcHeader({
  ké, aktívTÉ, aktívVÉ, sfé_fizikai, sfé_energia, páncélLefedettség, manöverPont, manőverAlap, hm,
  maxVéCsökk, session, setSession, pushUndo, konstansok,
  onVéChange, onVéLabelTap, onKéClick, onTéClick, onSféClick, onManőverClick, gameMode,
}: HarcHeaderProps) {
  const [showMpPicker, setShowMpPicker] = useState(false);
  const [showMaInfo, setShowMaInfo] = useState(false);
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  /** Dupla villanás a Szerk/Játék gombon - jelzi hogy csak Játék módban elérhető */
  function flashModeToggle() {
    const btn = document.querySelector('.mode-toggle');
    if (!btn) return;
    btn.classList.remove('mode-toggle-hint');
    // Force reflow to restart animation
    void (btn as HTMLElement).offsetWidth;
    btn.classList.add('mode-toggle-hint');
  }

  // Stored newest first; displayed oldest → newest (newest on the right). `kor` = age (0 = newest) drives the fading.
  const téDobások = [...(session.té_dobások ?? [])].reverse();
  const téKor = (i: number) => téDobások.length - 1 - i;
  return (
    <div className="harc-header">
      {/* Row 1: KÉ + TÉ (mobile) / KÉ + TÉ + SFÉ + VÉ csökk (desktop) */}
      <div className="ke-box" onClick={gameMode ? onKéClick : flashModeToggle} style={gameMode ? undefined : { cursor: 'default' }}>
        <span className="label">KÉ</span>
        <span className="value">{ké}</span>
        {session.ké_dobások.length > 0 && (
          <div className="ke-history">
            {[...session.ké_dobások].reverse().map((d, i) => (
              <span key={i} className="ke-history-item">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div className="te-box" onClick={gameMode && aktívTÉ != null ? onTéClick : !gameMode ? flashModeToggle : undefined}
        style={gameMode && aktívTÉ != null ? undefined : { cursor: 'default' }}>
        <span className="label">TÉ</span>
        <span className="value">{aktívTÉ ?? '-'}</span>
        {/* Roll history as a mini table: one column per roll (oldest → newest, newest on the right), rows TÉ / SP / VÉ.
            The SP and VÉ rows appear only if at least one roll has that value. */}
        {téDobások.length > 0 && (() => {
          // Cells are placed explicitly so the column separators (spanning every row) don't disturb auto-placement.
          const vanSP = téDobások.some(d => d.sp != null);
          const vanVÉ = téDobások.some(d => d.veCsökkentés != null);
          const spSor = 2;
          const véSor = vanSP ? 3 : 2;
          const sorok = 1 + (vanSP ? 1 : 0) + (vanVÉ ? 1 : 0);
          const hely = (oszlop: number, sor: number) => ({ gridColumn: oszlop, gridRow: sor });
          return (
            <div className="te-history" style={{ gridTemplateColumns: `auto repeat(${téDobások.length}, auto)` }}>
              <span className="te-history-fej" style={hely(1, 1)}>TÉ</span>
              {téDobások.map((d, i) => <span key={`te${i}`} style={hely(i + 2, 1)} className={`te-history-te te-history-oszlop-${téKor(i)}`}>{d.té}</span>)}
              {vanSP && <>
                <span className="te-history-fej" style={hely(1, spSor)}>SP</span>
                {téDobások.map((d, i) => <span key={`sp${i}`} style={hely(i + 2, spSor)} className={`te-history-oszlop-${téKor(i)}`}>{d.sp ?? '-'}</span>)}
              </>}
              {vanVÉ && <>
                <span className="te-history-fej te-history-ve" style={hely(1, véSor)}>VÉ</span>
                {téDobások.map((d, i) => <span key={`ve${i}`} style={hely(i + 2, véSor)} className={`te-history-ve te-history-oszlop-${téKor(i)}`}>{d.veCsökkentés != null ? `−${d.veCsökkentés}` : '-'}</span>)}
              </>}
              {/* Vertical separators between roll columns (outside the fading column classes: constant color) */}
              {téDobások.slice(1).map((_, i) => (
                <span key={`v${i}`} className="te-history-vonal" aria-hidden="true" style={{ gridColumn: i + 3, gridRow: `1 / ${sorok + 1}` }} />
              ))}
            </div>
          );
        })()}
      </div>

      <div className="sfe-box" onClick={gameMode ? onSféClick : flashModeToggle} style={{ cursor: 'pointer' }}>
        <span className="label">SFÉ</span>
        <div className="sfe-values">
          <span className="sfe-ertek" title="Fizikai SFÉ" aria-label={`Fizikai SFÉ: ${sfé_fizikai}`}>
            <Ikon név="pajzs" className="sfe-ikon" /><strong>{sfé_fizikai}</strong>
          </span>
          <span className="sfe-ertek" title="Energia SFÉ" aria-label={`Energia SFÉ: ${sfé_energia}`}>
            <Ikon név="energia" className="sfe-ikon sfe-ikon-energia" /><strong>{sfé_energia}</strong>
          </span>
        </div>
        {/* Armor coverage: bar + % */}
        <div className="sfe-lefedettseg" aria-label={`Páncél lefedettség: ${páncélLefedettség}%`}>
          <div className="sfe-sav"><div className="sfe-sav-fill" style={{ width: `${Math.max(0, Math.min(100, Number(páncélLefedettség) || 0))}%` }} /></div>
          <span className="harc-monospace">{páncélLefedettség}%</span>
        </div>
      </div>

      <div className={`ve-csokk-box${!gameMode ? ' ve-csokk-box-disabled' : ''}`} onClick={!gameMode ? flashModeToggle : undefined}>
        <span className="label" onClick={gameMode ? onVéLabelTap : undefined}>VÉ</span>
        <div className="ve-value-row" onClick={gameMode ? onVéLabelTap : undefined}>
          <span className="value">{aktívVÉ ?? '-'}</span>
          {/* Reduction badge: the tap bubbles to the row → VÉ history popup (reset lives there) */}
          {session.vé_csökkenés > 0 && (
            <button className="ve-csokk-badge" aria-label={`VÉ csökkenés (${session.vé_csökkenés}) - történet`}>-{session.vé_csökkenés}</button>
          )}
        </div>
        <div className="ve-btns">
          {(konstansok.vé_csökkentés_gombok as number[]).map(n => (
            <button key={n} disabled={!gameMode || session.vé_csökkenés >= maxVéCsökk}
              onClick={() => onVéChange(n)}>-{n}</button>
          ))}
          <button disabled={!gameMode || session.vé_csökkenés === 0}
            onClick={() => onVéChange(-1)}>+1</button>
        </div>
      </div>

      {/* Row 3 (mobile) / Row 2 (desktop): Manőver + MA/MP */}
      <div className="harc-header-bottom">
        <button className={`harc-manover-btn${!gameMode ? ' harc-manover-btn-disabled' : ''}`}
          onClick={gameMode ? onManőverClick : flashModeToggle}><Ikon név="manőver" />Manőver</button>
        <div className="mp-box">
          {/* MA: statikus érték → tap = képlet-bontás infó popup (mindkét módban) */}
          <span className="ma-tap" role="button" tabIndex={0}
            aria-label={`Manőver Alap: ${manőverAlap} - képlet részletei`}
            onClick={() => setShowMaInfo(true)}
            onKeyDown={e => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              setShowMaInfo(true);
            }}
            style={{ cursor: 'pointer' }}>
            <span className="ma-label">MA</span>
            <span className="ma-value">{manőverAlap}</span>
          </span>
          <span className="mp-box-sep" aria-hidden="true">·</span>
          {/* MP: a picker CSAK innen (az elválasztótól jobbra) nyílik */}
          <span className="mp-tap" role="button" tabIndex={0}
            aria-label={`Manőver Pont: ${aktMP} / ${manöverPont}`}
            onClick={gameMode ? () => setShowMpPicker(true) : flashModeToggle}
            onKeyDown={e => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              if (gameMode) setShowMpPicker(true); else flashModeToggle();
            }}
            style={{ cursor: 'pointer' }}>
            <span className="label">MP</span>
            <span className="mp-value">{aktMP}/{manöverPont}</span>
          </span>
        </div>
      </div>

      {showMaInfo && (
        <PopupOverlay onClose={() => setShowMaInfo(false)}>
          <div className="ma-info-popup">
            <div className="ke-dobas-header">Manőver Alap</div>
            <div className="ma-info-formula">
              <span className="ma-info-result">{manőverAlap}</span> = (HM / 10) ↑
            </div>
            <div className="ma-info-row">
              <span className="ma-info-label">HM (TÉ+VÉ) =</span>
              <span className="ma-info-value">{hm}</span>
            </div>
          </div>
        </PopupOverlay>
      )}

      {showMpPicker && (
        <PopupOverlay onClose={() => setShowMpPicker(false)}>
          <div className="mp-picker-popup">
            <div className="mp-picker-title">Manőver Pont</div>
            <div className="mp-picker-grid">
              {Array.from({ length: manöverPont + 1 }, (_, i) => (
                <button key={i} className={`fort-fok-btn szin-taktika${i === aktMP ? ' active' : ''}`}
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
