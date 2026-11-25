import { PopupOverlay } from '../PopupOverlay';

interface Props {
  cím: string;
  szöveg: string;
  /** A tiltó források feliratai (pl. „Bénultság (1): Harcképtelenség"), a szöveg alatt. */
  források?: string[];
  /** „Felülbírál" gomb: a KM mégis engedi - a hívó a tiltott dobást nyitja meg. Nélküle nincs gomb. */
  onFelülbírál?: () => void;
  onClose: () => void;
}

/** A Harcképtelenség (md/081) szövege az info popupban (Harc fül TÉ / aktív Manőver, Távharc CÉ dobás). */
export const HARCKÉPTELEN_SZÖVEG = 'Tudsz mozogni, menni, de harcolni nem. Ellened minden támadás automatikus Sebzés. KÉ dobás engedélyezett.';

/** Szöveg mondatokra bontása (". " határon), a záró pont normalizálásával minden mondat végén. */
export function mondatokraTörve(szöveg: string): string[] {
  return szöveg.split('. ').map(s => s.trim()).filter(Boolean).map(s => s.endsWith('.') ? s : `${s}.`);
}

/**
 * Info popup: ha egy taktika (pl. Teljes Védekezés, md/065_02) letiltja a Támadó dobást,
 * a TÉ chip erre a popupra nyit a dobás-popup helyett - a taktika `megjegyzés` szövegét mutatja,
 * mondatonként sortörve. Ugyanez a Harcképtelen tiltásnál (státusz `letilt harci_képesség`), a források listájával.
 * Mellékatt/Escape bezár; a „Felülbírál" gomb (ha van `onFelülbírál`) mégis a dobáshoz enged.
 */
export function TiltvaInfoPopup({ cím, szöveg, források = [], onFelülbírál, onClose }: Props) {
  const mondatok = mondatokraTörve(szöveg);
  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        <div className="ke-dobas-header">{cím}</div>
        <div className="ke-dobas-detail">
          {mondatok.map((m, i) => <div key={i}>{m}</div>)}
        </div>
        {források.length > 0 && (
          <div className="dobas-info-list dobas-notes">
            {források.map(f => <div key={f} className="dobas-info-item"><span className="dobas-info-source">{f}</span></div>)}
          </div>
        )}
        {onFelülbírál && (
          <div className="dobas-btn-row">
            <button type="button" className="tamado-dobas-btn tiltva-felulbiral-btn" onClick={onFelülbírál}>Felülbírál</button>
          </div>
        )}
      </div>
    </PopupOverlay>
  );
}
