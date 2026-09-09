import type { ReactNode } from 'react';
import type { DobásHatás } from './combat-roll-info';

/** Dobás-hatás badge felirata (Előny/Hátrány/Enyhít, különben a megjegyzés). */
export function hatásBadgeLabel(h: DobásHatás): string {
  if (h.operátor === 'előny') return `Előny+${Math.abs(h.érték)}`;
  if (h.operátor === 'hátrány') return `Hátrány-${Math.abs(h.érték)}`;
  if (h.operátor === 'enyhít') return `Enyhít+${Math.abs(h.érték)}`;
  return h.megjegyzés ?? '—';
}

/** Shared info display for active Előny/Hátrány effects on any roll. */
export function HatasokInfo({ hatások, children }: { hatások: DobásHatás[]; children?: ReactNode }) {
  return (
    <div className="dobas-info-list">
      {children}
      {hatások.map((h, i) => (
        <div key={i} className="dobas-info-item">
          <span className={`dobas-info-badge ${h.operátor}`}>{hatásBadgeLabel(h)}</span>
          <span className="dobas-info-source">{h.forrás}</span>
        </div>
      ))}
    </div>
  );
}
