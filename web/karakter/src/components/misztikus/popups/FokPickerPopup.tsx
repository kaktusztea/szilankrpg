import { Overlay } from '../Overlay';

interface Props {
  név: string;
  maxfok: number;
  currentFok: number;
  onPick: (fok: number) => void;
  onClose: () => void;
}

export function FokPickerPopup({ név, maxfok, currentFok, onPick, onClose }: Props) {
  return (
    <Overlay onClose={onClose}>
      <div className="kep-prompt">
        <label>{név} — fok:</label>
        <div className="kep-prompt-flex-fok">
          {Array.from({ length: maxfok }, (_, i) => i + 1).map(n => (
            <button key={n} className={`fort-fok-btn${currentFok === n ? ' active' : ''}`}
              onClick={() => onPick(n)}>{n}</button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
