import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  target: string;
  currentSzint: number;
  onPick: (szint: number) => void;
  onClose: () => void;
}

export function SzintPickerPopup({ target, currentSzint, onPick, onClose }: Props) {
  const displayName = target.includes(':') ? target.split(':')[1].trim() : target;
  const minSzint = target.startsWith('Faj misztérium') ? 0 : 1;
  const options = Array.from({ length: (minSzint === 0 ? 16 : 15) }, (_, i) => i + minSzint);

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt" onClick={e => e.stopPropagation()}>
        <label>{displayName} — szint:</label>
        <div className="kep-szint-grid">
          {options.map(n => (
            <button key={n} className={`fort-fok-btn${currentSzint === n ? ' active' : ''}`}
              onClick={() => onPick(n)}>{n}</button>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
}
