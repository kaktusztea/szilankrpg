import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from '../harc/ElonyPicker';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { SebzesPopup } from '../harc/SebzesPopup';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásHatás } from '../harc/combat-roll-info';
import { HatasokInfo } from '../harc/HatasokInfo';

/**
 * Derive Sebzés Előny from the CÉ k20 roll value (same rule as TÉ):
 *  16-19 → Előny+1, 20 → Előny+2, otherwise 0
 */
function sebzésElőnyFromK20(k20: number): number {
  if (k20 === 20) return 2;
  if (k20 >= 16) return 1;
  return 0;
}

interface Props {
  /** Active weapon CÉ value */
  cé: number;
  /** Target VÉ (from szorzó × cella) */
  vé: number;
  /** Weapon SP value */
  sp: number;
  /** Fegyver Átütés értéke (informatív, ha > 0) */
  átütés?: number;
  /** Collected active effects on CÉ rolls */
  céHatások: DobásHatás[];
  /** Megjegyzések (taktika notes relevant to CÉ) */
  céMegjegyzések: { forrás: string; szöveg: string }[];
  /** Active Előny/Hátrány effects on Sebzésdobás */
  sebzésHatások: DobásHatás[];
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
 * Célzó dobás popup — three phases:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display (CÉ + k20 vs VÉ) + Találat → Sebzés button
 *  Phase 3: SebzesPopup (reused from harc/, hideMásodlagos=true)
 */
export function CélzóDobasPopup({ cé, vé, sp, átütés, céHatások, céMegjegyzések, sebzésHatások, defaultSzint, onClose }: Props) {
  const [szint, setSzint] = useState(defaultSzint);
  const [result, setResult] = useState<CéEredmény | null>(null);
  const [showSebzés, setShowSebzés] = useState(false);

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setResult({ alap: cé, dobás, eredmény: cé + dobás.eredmény });
  }

  function handleManualK20(value: number) {
    const dobás: ProbaDobás = { rolls: [value], eredmény: value };
    setResult({ alap: cé, dobás, eredmény: cé + value });
  }

  const k20Érték = result?.dobás.eredmény ?? 0;
  const siker = result ? result.eredmény >= vé : false;
  const sebzésElőny = sebzésElőnyFromK20(k20Érték);

  if (showSebzés) {
    return (
      <SebzesPopup
        sp={sp}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={sebzésHatások}
        spBónuszok={[]}
        megjegyzések={[]}
        hideMásodlagos
        hideAutoBónusz
        átütés={átütés}
        onClose={onClose}
      />
    );
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        {result && <button className="sebzes-reset-btn" onClick={() => setResult(null)}>⟲</button>}
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
            {céHatások.length > 0 && <HatasokInfo hatások={céHatások} />}
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
            {siker && (
              <button className="tamado-sebzes-btn" onClick={() => setShowSebzés(true)}>
                Sebzés
                {sebzésElőny > 0 && <span className="tamado-sebzes-btn-hint">Előny+{sebzésElőny}</span>}
              </button>
            )}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
