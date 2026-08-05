import { PopupOverlay } from '../PopupOverlay';

const DOBAS_MAX = 3;

interface Props {
  cím: string;
  alapLabel: string;
  alap: number;
  eredmény: number;
  onClose: (eredmény: number) => void;
}

/**
 * Dobás popup: alapérték + k20, nagy számmal kiírva.
 * Közös a Kezdeményezés (KÉ + k20) és a Támadó dobás (TÉ + k20) között.
 */
export function DobasPopup({ cím, alapLabel, alap, eredmény, onClose }: Props) {
  return (
    <PopupOverlay onClose={() => onClose(eredmény)}>
      <div className="ke-dobas-popup">
        <div className="ke-dobas-header">{cím}</div>
        <div className="ke-dobas-result">{eredmény}</div>
        <div className="ke-dobas-detail">{alapLabel} ({alap}) + k20 ({eredmény - alap})</div>
      </div>
    </PopupOverlay>
  );
}

/** Push a new roll result onto the FIFO stack (max 3, newest first). */
export function pushDobás(prev: number[], eredmény: number): number[] {
  return [eredmény, ...prev].slice(0, DOBAS_MAX);
}
