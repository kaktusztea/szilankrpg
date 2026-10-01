import { PopupOverlay } from '../PopupOverlay';

interface Props {
  cím: string;
  szöveg: string;
  onClose: () => void;
}

/** Szöveg mondatokra bontása (". " határon), a záró pont normalizálásával minden mondat végén. */
export function mondatokraTörve(szöveg: string): string[] {
  return szöveg.split('. ').map(s => s.trim()).filter(Boolean).map(s => s.endsWith('.') ? s : `${s}.`);
}

/**
 * Info popup: ha egy taktika (pl. Teljes Védekezés, md/065_02) letiltja a Támadó dobást,
 * a TÉ chip erre a popupra nyit a dobás-popup helyett - a taktika `megjegyzés` szövegét mutatja,
 * mondatonként sortörve. Mellékatt/Escape bezár, nincs interakció.
 */
export function TaktikaTiltvaInfoPopup({ cím, szöveg, onClose }: Props) {
  const mondatok = mondatokraTörve(szöveg);
  return (
    <PopupOverlay onClose={onClose}>
      <div className="tamado-dobas-popup">
        <div className="ke-dobas-header">{cím}</div>
        <div className="ke-dobas-detail">
          {mondatok.map((m, i) => <div key={i}>{m}</div>)}
        </div>
      </div>
    </PopupOverlay>
  );
}
