import type { ReactNode } from 'react';
import './dobas.css';
/**
 * Taktika / Harci helyzet gyors-chipek a dobás-popupokban (Támadó, Célzó): az aktív elemek száma + picker megnyitása.
 * `kapszula`: small pill row (count in a muted span); `children` are appended to the row (e.g. the Bónusz pill).
 */
export function TaktikaHelyzetChipek({ taktikaDb, helyzetDb, onTaktika, onHelyzet, kapszula, children }: {
  taktikaDb: number; helyzetDb: number; onTaktika: () => void; onHelyzet: () => void;
  kapszula?: boolean; children?: ReactNode;
}) {
  if (kapszula) {
    return (
      <div className="dobas-kapszulak">
        <button type="button" className="dobas-kapszula" onClick={onTaktika}>Taktika <span className="dobas-kapszula-db">{taktikaDb}</span></button>
        <button type="button" className="dobas-kapszula" onClick={onHelyzet}>Harci helyzet <span className="dobas-kapszula-db">{helyzetDb}</span></button>
        {children}
      </div>
    );
  }
  return (
    <div className="tamado-aktiv-chips">
      <button className="tamado-aktiv-chip" onClick={onTaktika}>Taktika{taktikaDb > 0 ? ` (${taktikaDb})` : ''}</button>
      <button className="tamado-aktiv-chip" onClick={onHelyzet}>Harci helyzet{helyzetDb > 0 ? ` (${helyzetDb})` : ''}</button>
      {children}
    </div>
  );
}
