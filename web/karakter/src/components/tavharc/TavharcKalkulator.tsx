import type { TavharcSzorzok } from '../../engine/types';
import { SzorzóPicker } from './SzorzoPicker';

interface SzorzóState {
  célMozgásId: number;
  lövészMozgásId: number;
  méretId: number;
  észlelhetőségId: number;
  szélId: number;
}

interface Props {
  cé: number;
  vé: number;
  támadásLabel: string;
  szorzóÖsszeg: number;
  cella: number;
  távolság: number;
  szorzok: TavharcSzorzok;
  szorzóState: SzorzóState;
  onSzorzóChange: (key: keyof SzorzóState, id: number) => void;
  onTávolságPopup: () => void;
}

export function TavharcKalkulator({ cé, vé, támadásLabel, szorzóÖsszeg, cella, távolság, szorzok, szorzóState, onSzorzóChange, onTávolságPopup }: Props) {
  const véClass = vé <= cé + 1 ? 'th-ve-ok' : vé - cé > 20 ? 'th-ve-bad' : 'th-ve-warn';

  return (
    <>
      <div className="th-main-row">
        <div className="th-value-main th-ce-ve-box">
          <span>CÉ: {cé}  ({támadásLabel})</span>
          <span className={véClass}>VÉ: {vé}</span>
        </div>
        <span className="th-value-main th-szc-box">Szorzó × Cella<br/><span className="th-szc-value">{szorzóÖsszeg} × {cella}</span></span>
        <button className="th-value-main th-tav-btn" onClick={onTávolságPopup}>Táv:<br/><span className="th-tav-value">{távolság}m</span></button>
      </div>

      <div className="th-szorzo-grid">
        <SzorzóPicker label="Cél mozgása" list={szorzok.célpont_mozgás} activeId={szorzóState.célMozgásId} onSelect={id => onSzorzóChange('célMozgásId', id)} />
        <SzorzóPicker label="Lövész mozgás" list={szorzok.lövész_mozgás} activeId={szorzóState.lövészMozgásId} onSelect={id => onSzorzóChange('lövészMozgásId', id)} />
        <SzorzóPicker label="Méret" list={szorzok.célpont_méret} activeId={szorzóState.méretId} onSelect={id => onSzorzóChange('méretId', id)} />
        <SzorzóPicker label="Észlelhetőség" list={szorzok.észlelhetőség} activeId={szorzóState.észlelhetőségId} onSelect={id => onSzorzóChange('észlelhetőségId', id)} />
        <SzorzóPicker label="Szél ereje" list={szorzok.szél} activeId={szorzóState.szélId} onSelect={id => onSzorzóChange('szélId', id)} />
      </div>
    </>
  );
}
