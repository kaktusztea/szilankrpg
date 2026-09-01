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
  const pickerMode = !fokDef;

  return (
    <div className="info-panel">
      {def.leírás && <div className="fort-info-desc">{fmtCode(def.leírás)}</div>}

      {fokDef && fokDef.hatás.length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Hatás:</span> {fmtCode(fokDef.hatás.join(' '))}</div>
      )}

      {pickerMode && def.fokok.filter(f => f.fok >= 1 && f.hatás?.length).map(f => (
        <div key={f.fok} className="info-panel-row">
          <span className="info-panel-label">{def.maxfok > 1 ? `${f.fok}. fok:` : 'Hatás:'}</span>
          {' '}{fmtCode(f.hatás.join(' '))}
        </div>
      ))}

      {fokDef && fokDef.követelmény.filter(t => t && t !== '-').length > 0 && (
        <div className="info-panel-row"><span className="info-panel-label">Követelmény:</span> {fmtCode(fokDef.követelmény.filter(t => t && t !== '-').join('; '))}</div>
      )}
      {pickerMode && def.fokok.filter(f => f.fok >= 1 && f.követelmény?.filter(t => t && t !== '-').length).map(f => (
        <div key={`kov-${f.fok}`} className="info-panel-row">
          <span className="info-panel-label">{def.maxfok > 1 ? `Köv. ${f.fok}. fok:` : 'Követelmény:'}</span>
          {' '}{fmtCode(f.követelmény.filter(t => t && t !== '-').join('; '))}
        </div>
      ))}

      <KiterjesztesLista label="Normál kiterjesztés" nevek={def.kiterjeszti_normál} képzettségek={képzettségek} />
      <KiterjesztesLista label="Erős kiterjesztés" nevek={def.kiterjeszti_erős} képzettségek={képzettségek} />
    </div>
  );
}

/** Közös kiterjesztés lista renderelő */
function KiterjesztesLista({ label, nevek, képzettségek }: {
  label: string;
  nevek: string[];
  képzettségek?: { név: string; szint: number }[];
}) {
  if (nevek.length === 0) return null;
  return (
    <div className="info-panel-row">
      <span className="info-panel-label">{label}:</span>{' '}
      <span className="info-panel-kit">
        {nevek.map((kn, i) => (
          <span key={i} className={képzettségek ? (képzettségek.some(k => k.név === kn && k.szint >= 1) ? 'fort-req-met' : 'fort-req-unmet') : undefined}>
            {i > 0 ? ', ' : ''}{kn}
          </span>
        ))}
      </span>
    </div>
  );
}
