import { fmtCode } from '../formatters';

interface Props {
  fortélyEmlékeztetők: { név: string; fok: number; hatás: string }[];
  alapesetekFiltered: { fortély_név: string; hatástext: string[] }[];
}

export function AktivHatasPool({ fortélyEmlékeztetők, alapesetekFiltered }: Props) {
  if (fortélyEmlékeztetők.length === 0 && alapesetekFiltered.length === 0) return null;

  return (
    <div className="aktiv-hatas-pool">
      {fortélyEmlékeztetők.length > 0 && (
        <div className="hatas-pool-items">
          {fortélyEmlékeztetők.map((fe, i) => (
            <span key={i} className="hatas-pool-item"><strong className="fortely-nev">{fe.név} ({fe.fok}):</strong> {fmtCode(fe.hatás)}</span>
          ))}
        </div>
      )}
      {alapesetekFiltered.length > 0 && (
        <details className="aktiv-hatas-pool-details">
          <summary className="hatas-pool-title">Alapesetek ({alapesetekFiltered.length}) ▾</summary>
          <div className="hatas-pool-items">
            {alapesetekFiltered.map((ae, i) => (
              <span key={i} className="hatas-pool-item"><strong>{ae.fortély_név}:</strong> {fmtCode(ae.hatástext.join(' '))}</span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
