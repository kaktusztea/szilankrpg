import type { FortelySummary, FortelyFokSummary } from '../engine/data-loader';
import { fmtCode } from './formatters';

interface Props {
  def: FortelySummary;
  /** Aktuális fok def (game-mode); ha undefined → picker mód (összes fok) */
  fokDef?: FortelyFokSummary;
  /** Képzettségek listája szín-jelzéshez; ha üres/undefined → nincs szín */
  képzettségek?: { név: string; szint: number }[];
}

export function FortelyDetails({ def, fokDef, képzettségek }: Props) {
  const van = (név: string) => képzettségek?.some(k => k.név === név && k.szint >= 1) ?? false;
  const pickerMode = !fokDef;

  return (
    <div className="info-panel">
      {def.leírás && <div className="fort-info-desc">{fmtCode(def.leírás)}</div>}

      {/* Game-mode: csak aktuális fok hatása */}
      {fokDef && fokDef.hatás.length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Hatás:</span> {fmtCode(fokDef.hatás.join(' '))}</div>
      )}

      {/* Picker mode: összes fok hatása */}
      {pickerMode && def.fokok.filter(f => f.fok >= 1 && f.hatás?.length).map(f => (
        <div key={f.fok} className="info-panel-row">
          {def.maxfok > 1 && <span className="info-panel-label">{f.fok}. fok:</span>}
          {def.maxfok <= 1 && <span className="info-panel-label">Hatás:</span>}
          {' '}{fmtCode(f.hatás.join(' '))}
        </div>
      ))}

      {/* Követelmény — game-mode: aktuális fok; picker: összes fok */}
      {fokDef && fokDef.követelmény.filter(t => t).length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Követelmény:</span> {fmtCode(fokDef.követelmény.filter(t => t).join('; '))}</div>
      )}
      {pickerMode && def.fokok.filter(f => f.fok >= 1 && f.követelmény?.filter(t => t).length).map(f => (
        <div key={`kov-${f.fok}`} className="info-panel-row">
          <span className="info-panel-label">{def.maxfok > 1 ? `Köv. ${f.fok}. fok:` : 'Követelmény:'}</span>
          {' '}{fmtCode(f.követelmény.filter(t => t).join('; '))}
        </div>
      ))}

      {/* Kiterjesztés */}
      {def.kiterjeszti_normál.length > 0 && (
        <div className="info-panel-row">
          <span className="info-panel-label">Normál kiterjesztés:</span>{' '}
          <span className="info-panel-kit">
            {def.kiterjeszti_normál.map((kn, ki) => (
              <span key={ki} className={képzettségek ? (van(kn) ? 'fort-req-met' : 'fort-req-unmet') : undefined}>
                {ki > 0 ? ', ' : ''}{kn}
              </span>
            ))}
          </span>
        </div>
      )}
      {def.kiterjeszti_erős.length > 0 && (
        <div className="info-panel-row">
          <span className="info-panel-label">Erős kiterjesztés:</span>{' '}
          <span className="info-panel-kit">
            {def.kiterjeszti_erős.map((kn, ki) => (
              <span key={ki} className={képzettségek ? (van(kn) ? 'fort-req-met' : 'fort-req-unmet') : undefined}>
                {ki > 0 ? ', ' : ''}{kn}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}
