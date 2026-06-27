import { OverlayPortal } from './OverlayPortal';

interface Props {
  current: number;
  onPick: (value: number) => void;
}

export function SzilankPickerOverlay({ current, onPick }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-szilank">
        <label className="overlay-label">Szilánk</label>
        <div className="overlay-btn-row">
          {[0, 1, 2, 3].map(v => (
            <button key={v} className={`fort-fok-btn ${current === v ? 'active' : ''}`}
              onClick={() => onPick(v)}>{v}</button>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
}
