import type { FortelySummary, FortelyFokSummary } from '../../engine/data-loader';
import { fmtCode } from '../formatters';

interface Props {
  def: FortelySummary;
  fokDef?: FortelyFokSummary;
  kiterjesztiNormál: string[];
  kiterjesztiErős: string[];
  képzettségek: { név: string; szint: number }[];
}

export function FortelyInfoPanel({ def, fokDef, kiterjesztiNormál, kiterjesztiErős, képzettségek }: Props) {
  return (
    <div className="fort-info">
      {def.leírás && <div className="fort-info-desc">{fmtCode(def.leírás)}</div>}
      {fokDef && fokDef.hatás.length > 0 && (
        <div className="fort-info-row"><span className="fort-info-label">Hatás:</span> {fmtCode(fokDef.hatás.join(' '))}</div>
      )}
      {fokDef && fokDef.követelmény.filter(t => t).length > 0 && (
        <div className="fort-info-row"><span className="fort-info-label">Követelmény:</span> {fmtCode(fokDef.követelmény.filter(t => t).join('; '))}</div>
      )}
      {kiterjesztiNormál.length > 0 && (
        <div className="fort-info-row">
          <span className="fort-info-label">Normál kiterjesztés:</span>{' '}
          <span className="fort-info-kit">
            {kiterjesztiNormál.map((kn, ki) => (
              <span key={ki} className={képzettségek.some(k => k.név === kn && k.szint >= 1) ? 'fort-req-met' : 'fort-req-unmet'}>{ki > 0 ? ', ' : ''}{kn}</span>
            ))}
          </span>
        </div>
      )}
      {kiterjesztiErős.length > 0 && (
        <div className="fort-info-row">
          <span className="fort-info-label">Erős kiterjesztés:</span>{' '}
          <span className="fort-info-kit">
            {kiterjesztiErős.map((kn, ki) => (
              <span key={ki} className={képzettségek.some(k => k.név === kn && k.szint >= 1) ? 'fort-req-met' : 'fort-req-unmet'}>{ki > 0 ? ', ' : ''}{kn}</span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
