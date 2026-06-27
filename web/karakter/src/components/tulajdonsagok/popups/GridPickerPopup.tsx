import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  label: string;
  values: number[];
  current: number;
  onSelect: (v: number) => void;
  onCancel: () => void;
  gridClass?: string;
}

export function GridPickerPopup({ label, values, current, onSelect, onCancel, gridClass }: Props) {
  return (
    <OverlayPortal dismissible onClose={onCancel}>
      <div className="kep-prompt">
        <label>{label}</label>
        <div className={`kep-szint-grid ${gridClass || ''}`}>
          {values.map(n => (
            <button key={n} className={`fort-fok-btn ${current === n ? 'active' : ''}`}
              onClick={() => onSelect(n)}>{n}</button>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
}
