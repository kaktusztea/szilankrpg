import type { FortelySummary, NyelvEntry } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';
import type { DeleteTarget, SzabadTypePicker } from './types';
import { displayName } from './helpers';
import { PopupOverlay } from '../PopupOverlay';
import { SpecPicker, buildFortelyPickerSource } from '../SpecPicker';

// --- Delete confirmation ---
export function DeletePopup({ target, onConfirm, onCancel }: {
  target: DeleteTarget;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <PopupOverlay onClose={onCancel} centerText>
      <label>{target.név}</label>
      <button className="btn-del-confirm he-del-confirm" onClick={onConfirm}>Fortély törlése</button>
    </PopupOverlay>
  );
}

// --- Fok picker (for new fortély) ---
export function FokPickerPopup({ slot, maxfok, nyelvFokLabels, onSelect, onCancel }: {
  slot: Fortely;
  maxfok: number;
  nyelvFokLabels: Record<number, string>;
  onSelect: (fok: number) => void;
  onCancel: () => void;
}) {
  const isNyelv = slot.név === 'Nyelvismeret';
  const label = isNyelv ? displayName(slot) : `${slot.név} — fok:`;
  return (
    <PopupOverlay onClose={onCancel}>
      <label>{label}</label>
      <div className="fort-fok-radios">
        {Array.from({ length: maxfok }, (_, i) => i + 1).map(f => (
          <button key={f}
            className={`fort-fok-btn ${slot.fok === f ? 'active' : ''}${isNyelv ? ' fort-fok-btn-wide' : ''}`}
            onClick={() => onSelect(f)}>
            {isNyelv ? nyelvFokLabels[f] ?? f : f}
          </button>
        ))}
      </div>
    </PopupOverlay>
  );
}

// --- Multi picker (lista / fegyver / nyelv / freetext) ---
export function MultiPicker({ def, fortélyok, fegyverNevek, nyelvek, onSelect, onCancel }: {
  def: FortelySummary;
  fortélyok: Fortely[];
  fegyverNevek: string[];
  nyelvek: NyelvEntry[];
  onSelect: (subName: string) => void;
  onCancel: () => void;
}) {
  const usedSubs = new Set(fortélyok.filter(f => f.név === def.név).map(f => f.spec_elem));
  const source = buildFortelyPickerSource(def, usedSubs, { fegyverNevek, nyelvek });
  return <SpecPicker source={source} onSelect={onSelect} onCancel={onCancel} />;
}

// --- Szabad type picker (Felvett / Kiérdemelt) ---
export function SzabadTypePickerPopup({ picker, onFelvett, onKiérdemelt, onCancel }: {
  picker: SzabadTypePicker;
  onFelvett: () => void;
  onKiérdemelt: () => void;
  onCancel: () => void;
}) {
  const label = picker.spec_elem ? `${picker.név} - ${picker.spec_elem}` : picker.név;
  return (
    <PopupOverlay onClose={onCancel} className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
      <label className="kep-prompt-label-bold">{label}</label>
      <div className="kep-prompt-flex-btns">
        <button className="he-field-btn kep-prompt-btn-lg" onClick={onFelvett}>6/0 Felvett</button>
        <button className="he-field-btn kep-prompt-btn-lg" onClick={onKiérdemelt}>⭐ Kiérdemelt</button>
      </div>
    </PopupOverlay>
  );
}
