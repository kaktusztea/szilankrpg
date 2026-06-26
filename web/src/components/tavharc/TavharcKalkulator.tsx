import type { TavharcSzorzok } from '../../engine/types';
import { SzorzóPicker } from './SzorzoPicker';

export function TavharcKalkulator({ cé, vé, támadásLabel, szorzóÖsszeg, cella, távolság, szorzok, célMozgásId, setCélMozgásId, lövészMozgásId, setLövészMozgásId, méretId, setMéretId, észlelhetőségId, setÉszlelhetőségId, szélId, setSzélId, onTávolságPopup }: {
  cé: number;
  vé: number;
  támadásLabel: string;
  szorzóÖsszeg: number;
  cella: number;
  távolság: number;
  szorzok: TavharcSzorzok;
  célMozgásId: number;
  setCélMozgásId: (id: number) => void;
  lövészMozgásId: number;
  setLövészMozgásId: (id: number) => void;
  méretId: number;
  setMéretId: (id: number) => void;
  észlelhetőségId: number;
  setÉszlelhetőségId: (id: number) => void;
  szélId: number;
  setSzélId: (id: number) => void;
  onTávolságPopup: () => void;
}) {
  return (
    <>
      <div className="th-main-row">
        <div className="th-value-main th-ce-ve-box">
          <span>CÉ: {cé}  ({támadásLabel})</span>
          <span style={{ color: vé <= cé + 1 ? '#4caf50' : vé - cé > 20 ? '#e53935' : '#ffa726' }}>VÉ: {vé}</span>
        </div>
        <span className="th-value-main th-szc-box">Szorzó × Cella<br/><span style={{ fontSize: '18px' }}>{szorzóÖsszeg} × {cella}</span></span>
        <button className="th-value-main th-tav-btn" onClick={onTávolságPopup}>Táv:<br/><span className="th-tav-value">{távolság}m</span></button>
      </div>

      <div className="th-szorzo-grid">
        <SzorzóPicker label="Cél mozgása" list={szorzok.célpont_mozgás} activeId={célMozgásId} onSelect={setCélMozgásId} />
        <SzorzóPicker label="Lövész mozgás" list={szorzok.lövész_mozgás} activeId={lövészMozgásId} onSelect={setLövészMozgásId} />
        <SzorzóPicker label="Méret" list={szorzok.célpont_méret} activeId={méretId} onSelect={setMéretId} />
        <SzorzóPicker label="Észlelhetőség" list={szorzok.észlelhetőség} activeId={észlelhetőségId} onSelect={setÉszlelhetőségId} />
        <SzorzóPicker label="Szél ereje" list={szorzok.szél} activeId={szélId} onSelect={setSzélId} />
      </div>
    </>
  );
}
