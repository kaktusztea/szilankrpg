import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyPicker } from './ElonyPicker';
import { SebzesPopup } from './SebzesPopup';
import { rollElőnyHátrányK20, type ProbaDobás } from '../../engine/dice';
import type { DobásInfo, DobásHatás } from './combat-roll-info';
import { netElőnySzint } from './combat-roll-info';

/**
 * Derive Sebzés Előny from the TÉ k20 roll value:
 *  16-19 → Előny+1, 20 → Előny+2, otherwise 0
 */
export function sebzésElőnyFromK20(k20: number): number {
  if (k20 === 20) return 2;
  if (k20 >= 16) return 1;
  return 0;
}

interface Props {
  /** Active weapon TÉ value */
  té: number;
  /** Active weapon SP value (from reactive engine) */
  sp: number;
  /** Collected active effects on TÉ/Sebzés rolls */
  dobásInfo: DobásInfo;
  onClose: (téEredmény: number | null) => void;
}

interface TéEredmény {
  alap: number;
  dobás: ProbaDobás;
  eredmény: number;
}

/**
 * Támadó dobás popup — two-phase:
 *  Phase 1: Előny/Hátrány picker + active effects info + Dobás button
 *  Phase 2: Result display + Sebzés button → opens SebzesPopup
 */
export function TamadoDobasPopup({ té, sp, dobásInfo, onClose }: Props) {
  const [szint, setSzint] = useState(() => netElőnySzint(dobásInfo.téHatások));
  const [téResult, setTéResult] = useState<TéEredmény | null>(null);
  const [showSebzés, setShowSebzés] = useState(false);

  function handleDobás() {
    const dobás = rollElőnyHátrányK20(szint);
    setTéResult({ alap: té, dobás, eredmény: té + dobás.eredmény });
  }

  const k20Érték = téResult?.dobás.eredmény ?? 0;
  const sebzésElőny = sebzésElőnyFromK20(k20Érték);

  if (showSebzés) {
    return (
      <SebzesPopup
        sp={sp}
        defaultElőny={sebzésElőny}
        téK20={k20Érték}
        sebzésHatások={dobásInfo.sebzésHatások}
        spBónuszok={dobásInfo.spBónuszok}
        megjegyzések={dobásInfo.sebzésMegjegyzések}
        onClose={() => onClose(téResult?.eredmény ?? null)}
      />
    );
  }

  return (
    <PopupOverlay onClose={() => onClose(téResult?.eredmény ?? null)}>
      <div className="tamado-dobas-popup">
        <div className="ke-dobas-header">Támadó dobás</div>

        {!téResult ? (
          <>
            {dobásInfo.téMegjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {dobásInfo.téMegjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}
            <ElonyPicker szint={szint} onChange={setSzint} />
            {dobásInfo.téHatások.length > 0 && (
              <HatásokInfo hatások={dobásInfo.téHatások} />
            )}
            <button className="tamado-dobas-btn" onClick={handleDobás}>Dobás</button>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{téResult.eredmény}</div>
            <div className="ke-dobas-detail">
              TÉ ({téResult.alap}) + k20{téResult.dobás.rolls.length > 1
                ? ` [${téResult.dobás.rolls.join(', ')}] → ${téResult.dobás.eredmény}`
                : ` (${téResult.dobás.eredmény})`}
            </div>
            <button className="tamado-sebzes-btn" onClick={() => setShowSebzés(true)}>
              Sebzés
              {sebzésElőny > 0 && <span className="tamado-sebzes-btn-hint">Előny+{sebzésElőny}</span>}
            </button>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}

// ─── Shared info display for active Előny/Hátrány effects ──────────────────

function HatásokInfo({ hatások }: { hatások: DobásHatás[] }) {
  return (
    <div className="dobas-info-list">
      {hatások.map((h, i) => (
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
  );
}

// ponytail: HatásokInfo is internal-only; if SebzesPopup needs it later, move to a shared file.
