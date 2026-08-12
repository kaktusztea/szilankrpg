import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from './ElonyPicker';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';

interface Props {
  /** Weapon SP from reactive engine */
  sp: number;
  /** Default Előny level (from TÉ k20 roll: 16-19→1, 20→2, else 0) */
  defaultElőny: number;
  onClose: () => void;
}

interface SebzésEredmény {
  dobás: ProbaDobás;
  szint: number;
  bónusz: number;
  sp: number;
  végső: number;
}

/** Sebzés overlay: Előny/Hátrány picker + SP bónusz grid + k20 roll. */
export function SebzesPopup({ sp, defaultElőny, onClose }: Props) {
  const [szint, setSzint] = useState(defaultElőny);
  const [bónusz, setBónusz] = useState(0);
  const [eredmény, setEredmény] = useState<SebzésEredmény | null>(null);

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setEredmény({ dobás, szint, bónusz, sp, végső: dobás.eredmény + sp + bónusz });
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
            <ElonyPicker szint={szint} onChange={handleSzintChange} />

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

            <div className="sebzes-summary">
              SP: {sp}{bónusz !== 0 ? ` ${bónusz > 0 ? '+' : ''}${bónusz}` : ''} + k20
              {szint !== 0 ? ` (${szint > 0 ? `Előny+${szint}` : `Hátrány${szint}`})` : ''}
            </div>

            <button className="tamado-sebzes-btn" onClick={handleDobás}>Sebzés</button>
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
