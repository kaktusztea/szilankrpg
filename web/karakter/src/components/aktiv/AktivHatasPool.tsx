import { fmtCode } from '../formatters';

interface Props {
  cím: string;
  fortélyEmlékeztetők: { név: string; fok: number; hatás: string }[];
  alapesetek: { fortély_név: string; hatástext: string[] }[];
}

/** Egy fül (Harci/Távharci/Mágia/Egyéb) box-kombója: lila emlékeztető rész + Alapesetek accordion. */
export function AktivHatasPool({ cím, fortélyEmlékeztetők, alapesetek }: Props) {
  if (fortélyEmlékeztetők.length === 0 && alapesetek.length === 0) return null;

  return (
    <div className="aktiv-hatas-pool">
      <span className="hatas-pool-cim">{cím}</span>
      {fortélyEmlékeztetők.length > 0 && (
        <div className="hatas-pool-items">
          {fortélyEmlékeztetők.map((fe, i) => (
            <span key={i} className="hatas-pool-item">
              <strong className="fortely-nev">{fe.név} ({fe.fok}){fe.hatás ? ':' : ''}</strong>
              {fe.hatás ? ' ' + fmtCode(fe.hatás) : ''}
            </span>
          ))}
        </div>
      )}
      {alapesetek.length > 0 && (
        <details className="aktiv-hatas-pool-details">
          <summary className="hatas-pool-title">Alapesetek ({alapesetek.length}) ▾</summary>
          <div className="hatas-pool-items">
            {alapesetek.map((ae, i) => (
              <span key={i} className="hatas-pool-item"><strong>{ae.fortély_név}:</strong> {fmtCode(ae.hatástext.join(' '))}</span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
