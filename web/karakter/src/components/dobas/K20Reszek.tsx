import { useEffect, useState, type ReactNode } from 'react';
import { Ikon } from '../common/Ikon';
import { kockaBontás, előnyHátrányLabel, type ProbaDobás } from '../../engine/dice';
import type { DobásMegjegyzés } from '../../engine/harc/combat-roll-info';

// Shared building blocks of the k20 roll popups (KÉ, Támadó, Célzó, Sebzés, Manőver).

/** A finished k20 roll: base value + hand bonus + the dice. */
export interface K20Eredmény {
  alap: number;
  kézi: number;
  dobás: ProbaDobás;
  eredmény: number;
}

export const k20Eredmény = (alap: number, kézi: number, dobás: ProbaDobás): K20Eredmény =>
  ({ alap, kézi, dobás, eredmény: alap + kézi + dobás.eredmény });

/** A manually entered die value as a roll (ManualDicePicker). */
export const kéziDobás = (érték: number): ProbaDobás => ({ rolls: [érték], eredmény: érték });

/**
 * The roll's Előny/Hátrány level: before the roll it follows `alap` (the active effects - a taktika / helyzet / Gyengébb kéz
 * switched inside the popup shows at once); after the roll (`dobott`) the user's choice is kept.
 */
export function useEHSzint(alap: number, dobott: boolean) {
  const [szint, setSzint] = useState(alap);
  useEffect(() => {
    if (!dobott) setSzint(alap);
  }, [alap, dobott]);
  return [szint, setSzint] as const;
}

/** ⚠ notes above / below the roll (nothing when the list is empty). */
export function MegjegyzesLista({ lista }: { lista: readonly DobásMegjegyzés[] }) {
  if (lista.length === 0) return null;
  return (
    <div className="dobas-info-list dobas-notes">
      {lista.map((m, i) => (
        <div key={i} className="dobas-info-item">
          <span className="dobas-info-badge note">⚠</span>
          <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
        </div>
      ))}
    </div>
  );
}

/** Formula line before the roll: `alap (± hand bonus) + k20`, `children` after it (e.g. `vs VÉ`). */
export function DobasKeplet({ alap, kézi, children }: { alap: number; kézi: number; children?: ReactNode }) {
  return (
    <div className="dobas-keplet">
      {alap}
      {kézi !== 0 && <><span className="dobas-keplet-op"> {kézi > 0 ? '+' : '−'} </span><span className={`dobas-keplet-kezi ${kézi > 0 ? 'sebzes-stat-pos' : 'sebzes-stat-neg'}`}>{Math.abs(kézi)}</span></>}
      <span className="dobas-keplet-op"> + </span>k20
      {children}
    </div>
  );
}

/** The arrow next to a result that opens / closes its breakdown. */
export function BontasNyil({ nyitva, onVált, label }: { nyitva: boolean; onVált: () => void; label: string }) {
  return (
    <button type="button" className={`sebzes-bontas-nyil${nyitva ? ' nyitva' : ''}`} aria-expanded={nyitva}
      aria-label={label} title="Bontás" onClick={onVált}><Ikon név="lenyit" /></button>
  );
}

/** Breakdown text of a k20 roll: `TÉ (12) +2 + k20 [3, 15] → 15 · Előny+1` (the E/H label only if `szint` is given and not 0). */
export function k20BontásSzöveg(címke: string, e: K20Eredmény, szint?: number): string {
  return `${címke} (${e.alap})${e.kézi !== 0 ? ` ${e.kézi > 0 ? '+' : ''}${e.kézi}` : ''} + k20${kockaBontás(e.dobás)}`
    + (szint ? ` · ${előnyHátrányLabel(szint)}` : '');
}
