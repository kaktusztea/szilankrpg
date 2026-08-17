import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from '../harc/ElonyPicker';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { CéDobásHatás } from './tavharc-roll-info';

interface Props {
  /** Active weapon CÉ value */
  cé: number;
  /** Target VÉ (from szorzó × cella) */
  vé: number;
  /** Collected active effects on CÉ rolls */
  céHatások: CéDobásHatás[];
  /** Megjegyzések (taktika notes relevant to CÉ) */
  céMegjegyzések: { forrás: string; szöveg: string }[];
  /** Default Előny/Hátrány szint (from active effects) */
  defaultSzint: number;
  onClose: () => void;
}

interface CéEredmény {
  alap: number;
  dobás: ProbaDobás;
  eredmény: number;
}

/**
 * Célzó dobás popup — TamadoDobasPopup mintájára:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display (CÉ + k20 vs VÉ) + Találat/Nem talált
 */
export function CélzóDobasPopup({ cé, vé, céHatások, céMegjegyzések, defaultSzint, onClose }: Props) {
  const [szint, setSzint] = useState(defaultSzint);
  const [result, setResult] = useState<CéEredmény | null>(null);

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setResult({ alap: cé, dobás, eredmény: cé + dobás.eredmény });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setResult({ alap: cé, dobás, eredmény: cé + value });
  }

  const siker = result ? result.eredmény >= vé : false;

  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        <div className="ke-dobas-header">Célzó dobás</div>

        {!result ? (
          <>
            {céMegjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {céMegjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}
            <ElonyPicker szint={szint} onChange={setSzint} />
            {céHatások.length > 0 && (
              <div className="dobas-info-list">
                {céHatások.map((h, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className={`dobas-info-badge ${h.operátor}`}>
                      {h.operátor === 'előny' ? `Előny+${Math.abs(h.érték)}` :
                       h.operátor === 'hátrány' ? `Hátrány-${Math.abs(h.érték)}` :
                       h.operátor === 'enyhít' ? `Enyhít+${Math.abs(h.érték)}` : '—'}
                    </span>
                    <span className="dobas-info-source">{h.forrás}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="dobas-btn-row">
              <button className="tamado-dobas-btn" onClick={handleDobás}>Dobás</button>
              <ManualDicePicker szint={szint} onSelect={handleManualK20} alapÉrték={cé} alapLabel="CÉ" />
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result-vs-row">
              <span className="ke-dobas-result">{result.eredmény}</span>
              <span className="ke-dobas-result-vs">vs</span>
              <span className="ke-dobas-result-cel">{vé}</span>
            </div>
            <div className="ke-dobas-detail">
              CÉ ({result.alap}) + k20{result.dobás.rolls.length > 1
                ? ` [${result.dobás.rolls.join(', ')}] → ${result.dobás.eredmény}`
                : ` (${result.dobás.eredmény})`}
            </div>
            <div className={siker ? 'ke-dobas-siker' : 'ke-dobas-sikertelen'}>
              {siker ? 'Találat' : 'Nem talált'}
            </div>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
