import type { DobásHatás } from './combat-roll-info';

/** Shared info display for active Előny/Hátrány effects on any roll. */
export function HatasokInfo({ hatások }: { hatások: DobásHatás[] }) {
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
