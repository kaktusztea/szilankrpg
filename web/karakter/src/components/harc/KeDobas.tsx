import { PopupOverlay } from '../PopupOverlay';

const KE_DOBAS_MAX = 3;

interface Props {
  ké: number;
  eredmény: number;
  onClose: (eredmény: number) => void;
}

/** Kezdeményező dobás popup: KÉ + k20 result shown in big text */
export function KeDobas({ ké, eredmény, onClose }: Props) {
  return (
    <PopupOverlay onClose={() => onClose(eredmény)}>
      <div className="ke-dobas-popup">
        <div className="ke-dobas-header">Kezdeményezés</div>
        <div className="ke-dobas-result">{eredmény}</div>
        <div className="ke-dobas-detail">KÉ ({ké}) + k20 ({eredmény - ké})</div>
      </div>
    </PopupOverlay>
  );
}

/** Push a new roll result onto the FIFO stack (max 3, newest first) */
export function pushKéDobás(prev: number[], eredmény: number): number[] {
  return [eredmény, ...prev].slice(0, KE_DOBAS_MAX);
}
