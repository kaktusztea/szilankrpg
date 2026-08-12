import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from './ElonyPicker';
import { ManualDicePicker } from './ManualDicePicker';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásHatás, SpBónusz } from './combat-roll-info';
import { netElőnySzint } from './combat-roll-info';

interface Props {
  /** Weapon SP from reactive engine */
  sp: number;
  /** Default Előny level (from TÉ k20 roll: 16-19→1, 20→2, else 0) */
  defaultElőny: number;
  /** The actual TÉ k20 roll value (for display) */
  téK20: number;
  /** Active Előny/Hátrány effects on Sebzésdobás (informational) */
  sebzésHatások: DobásHatás[];
  /** Active static SP bonuses from taktikák (informational) */
  spBónuszok: SpBónusz[];
  /** Taktika notes relevant to sebzés (e.g. "Sebzés: 0") */
  megjegyzések: { forrás: string; szöveg: string }[];
  onClose: () => void;
}

interface SebzésEredmény {
  dobás: ProbaDobás;
  sp: number;
  bónusz: number;
  végső: number;
}

/** Sebzés overlay: Előny/Hátrány picker + SP bónusz grid + k20 roll + info. */
export function SebzesPopup({ sp, defaultElőny, téK20, sebzésHatások, spBónuszok, megjegyzések, onClose }: Props) {
  // Combined default: TÉ k20 bonus + net from active effects, clamped to [-2, +2]
  const combinedDefault = Math.max(-2, Math.min(2, defaultElőny + netElőnySzint(sebzésHatások)));
  const [szint, setSzint] = useState(combinedDefault);
  const [bónusz, setBónusz] = useState(0);
  const [eredmény, setEredmény] = useState<SebzésEredmény | null>(null);

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setEredmény({ dobás, sp, bónusz, végső: dobás.eredmény + sp + bónusz });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setEredmény({ dobás, sp, bónusz, végső: value + sp + bónusz });
  }

  function handleBónuszClick(val: number) {
    setBónusz(prev => prev === val ? 0 : val);
    setEredmény(null);
  }

  function handleSzintChange(newSzint: number) {
    setSzint(newSzint);
    setEredmény(null);
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        <div className="ke-dobas-header">Sebzés</div>

        {!eredmény ? (
          <>
            {megjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {megjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}

            <ElonyPicker szint={szint} onChange={handleSzintChange} />

            {(sebzésHatások.length > 0 || defaultElőny > 0) && (
              <div className="dobas-info-list">
                {defaultElőny > 0 && (
                  <div className="dobas-info-item">
                    <span className="dobas-info-badge előny">Előny+{defaultElőny}</span>
                    <span className="dobas-info-source">Támadó dobás ({téK20})</span>
                  </div>
                )}
                {sebzésHatások.map((h, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className={`dobas-info-badge ${h.operátor}`}>
                      {h.operátor === 'előny' ? `Előny+${Math.abs(h.érték)}` :
                       h.operátor === 'hátrány' ? `Hátrány-${Math.abs(h.érték)}` :
                       h.operátor === 'enyhít' ? `Enyhít+${Math.abs(h.érték)}` :
                       h.megjegyzés ?? '—'}
                    </span>
                    <span className="dobas-info-source">{h.forrás}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="sebzes-bonusz-section">
              <span className="sebzes-bonusz-label">Bónusz SP:</span>
              <div className="sebzes-bonusz-grid">
                {[-6, -5, -4, -3, -2, -1].map(v => (
                  <button key={v}
                    className={`sebzes-bonusz-btn${bónusz === v ? ' active' : ''}`}
                    onClick={() => handleBónuszClick(v)}>{v}</button>
                ))}
              </div>
              <div className="sebzes-bonusz-grid">
                {[1, 2, 3, 4, 5, 6].map(v => (
                  <button key={v}
                    className={`sebzes-bonusz-btn${bónusz === v ? ' active' : ''}`}
                    onClick={() => handleBónuszClick(v)}>{`+${v}`}</button>
                ))}
              </div>
            </div>

            {spBónuszok.length > 0 && (
              <div className="dobas-info-list dobas-sp-info">
                {spBónuszok.map((b, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge sp">+{b.érték} SP</span>
                    <span className="dobas-info-source">{b.forrás}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="sebzes-summary">
              SP: {sp}{bónusz !== 0 ? ` ${bónusz > 0 ? '+' : ''}${bónusz}` : ''} + k20
              {szint !== 0 ? ` (${szint > 0 ? `Előny+${szint}` : `Hátrány${szint}`})` : ''}
            </div>

            <div className="dobas-btn-row">
              <button className="tamado-sebzes-btn" onClick={handleDobás}>Dobás</button>
              <ManualDicePicker szint={szint} onSelect={handleManualK20} />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.végső}</div>
            <div className="ke-dobas-detail">
              k20{eredmény.dobás.rolls.length > 1
                ? ` [${eredmény.dobás.rolls.join(', ')}] → ${eredmény.dobás.eredmény}`
                : ` (${eredmény.dobás.eredmény})`}
              {' + '}SP ({eredmény.sp})
              {eredmény.bónusz !== 0 ? ` ${eredmény.bónusz > 0 ? '+' : ''}${eredmény.bónusz}` : ''}
            </div>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
