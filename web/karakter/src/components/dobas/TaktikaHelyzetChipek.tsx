import './dobas.css';
/** Taktika / Harci helyzet gyors-chipek a dobás-popupokban (Támadó, Célzó): az aktív elemek száma + picker megnyitása. */
export function TaktikaHelyzetChipek({ taktikaDb, helyzetDb, onTaktika, onHelyzet }: {
  taktikaDb: number; helyzetDb: number; onTaktika: () => void; onHelyzet: () => void;
}) {
  return (
    <div className="tamado-aktiv-chips">
      <button className="tamado-aktiv-chip" onClick={onTaktika}>Taktika{taktikaDb > 0 ? ` (${taktikaDb})` : ''}</button>
      <button className="tamado-aktiv-chip" onClick={onHelyzet}>Harci helyzet{helyzetDb > 0 ? ` (${helyzetDb})` : ''}</button>
    </div>
  );
}
