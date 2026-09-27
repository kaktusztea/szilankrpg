import { PopupOverlay } from '../PopupOverlay';

interface Props {
  /** Nyers, nem szorzott csökkenés (a gomb alapértéke, pl. 3). */
  alap: number;
  szorzó: number;
  /** A szorzót okozó harci helyzet neve (pl. "Földön fekve"). */
  forrás: string;
  onClose: () => void;
}

/**
 * Info popup: ha egy VÉ csökkentés gomb a nominálistól eltérő (szorzott) értéket von le
 * (l. harci_helyzetek.yaml "duplázás" operátor, cél: vé_veszteség), ez a popup tömören
 * levezeti a valós levonást és az okát. Mellékatt/Escape bezár, nincs interakció.
 */
export function VeSzorzoInfoPopup({ alap, szorzó, forrás, onClose }: Props) {
  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup ve-szorzo-info-popup">
        <div className="ke-dobas-header">VÉ levonás</div>
        <div className="ke-dobas-result">{alap * szorzó}</div>
        <div className="ke-dobas-detail">{alap} × {szorzó} ({forrás})</div>
      </div>
    </PopupOverlay>
  );
}
