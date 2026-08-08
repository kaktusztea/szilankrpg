import { PopupOverlay } from '../PopupOverlay';

const DOBAS_MAX = 3;

interface Props {
  cím: string;
  alapLabel: string;
  alap: number;
  eredmény: number;
  onClose: (eredmény: number) => void;
  /** Optional target value to compare against (shows siker/sikertelen). */
  vsCélszám?: number;
  vsCélszámLabel?: string;
}

/**
 * Dobás popup: alapérték + k20, nagy számmal kiírva.
 * Közös a Kezdeményezés (KÉ + k20), Támadó dobás (TÉ + k20) és Célzó dobás (CÉ + k20) között.
 * Ha vsCélszám meg van adva, összehasonlítás + Találat/Nem talált jelzés.
 */
export function DobasPopup({ cím, alapLabel, alap, eredmény, onClose, vsCélszám }: Props) {
  const hasVs = vsCélszám !== undefined;
  const siker = hasVs && eredmény >= vsCélszám;

  return (
    <PopupOverlay onClose={() => onClose(eredmény)}>
      <div className="ke-dobas-popup">
        <div className="ke-dobas-header">{cím}</div>
        {hasVs ? (
          <>
            <div className="ke-dobas-result-vs-row">
              <span className="ke-dobas-result">{eredmény}</span>
              <span className="ke-dobas-result-vs">vs</span>
              <span className="ke-dobas-result-cel">{vsCélszám}</span>
            </div>
            <div className="ke-dobas-detail">{alapLabel} ({alap}) + k20 ({eredmény - alap})</div>
            <div className={siker ? 'ke-dobas-siker' : 'ke-dobas-sikertelen'}>
              {siker ? 'Találat' : 'Nem talált'}
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény}</div>
            <div className="ke-dobas-detail">{alapLabel} ({alap}) + k20 ({eredmény - alap})</div>
          </>
        )}
      </div>
    </PopupOverlay>
  );
}

/** Push a new roll result onto the FIFO stack (max 3, newest first). */
export function pushDobás(prev: number[], eredmény: number): number[] {
  return [eredmény, ...prev].slice(0, DOBAS_MAX);
}
