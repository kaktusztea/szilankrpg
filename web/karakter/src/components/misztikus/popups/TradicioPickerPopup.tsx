import type { TradícióOpció } from '../types';
import { Overlay } from '../Overlay';

interface Props {
  opciók: TradícióOpció[];
  onPick: (név: string) => void;
  onPickAltípus: (név: string) => void;
  onClose: () => void;
}

export function TradícióPickerPopup({ opciók, onPick, onPickAltípus, onClose }: Props) {
  return (
    <Overlay onClose={onClose}>
      <div className="kep-prompt">
        <label className="kep-prompt-label-bold-mb">Tradíció választás</label>
        <div className="kep-prompt-flex-col-list">
          {opciók.map(t => (
            <button key={t.név} className="he-field-btn" onClick={() => {
              if (t.altípusok.length > 0) onPickAltípus(t.név);
              else onPick(t.név);
            }}>
              {t.név} {t.altípusok.length > 0 && '▸'}
              {' '}<span className="kep-prompt-text-dim">({t.típus})</span>
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
