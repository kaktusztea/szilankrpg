import { useState } from 'react';
import type { FortelySummary, NyelvEntry } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';
import type { SzabadTypePicker } from './types';
import { displayName } from './helpers';
import { PopupOverlay } from '../PopupOverlay';
import { SpecPicker, buildFortelyPickerSource } from '../SpecPicker';
import { MAX_EGYEDI_FORTELY_NÉV } from '../../ui-constants';

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
export function SzabadTypePickerPopup({ picker, felvettKp, onFelvett, onKiérdemelt, onCancel }: {
  picker: SzabadTypePicker;
  felvettKp: number;
  onFelvett: () => void;
  onKiérdemelt: () => void;
  onCancel: () => void;
}) {
  const label = picker.spec_elem ? `${picker.név} - ${picker.spec_elem}` : picker.név;
  return (
    <PopupOverlay onClose={onCancel} className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
      <label className="kep-prompt-label-bold">{label}</label>
      <div className="kep-prompt-flex-btns">
        <button className="he-field-btn kep-prompt-btn-lg" onClick={onFelvett}>Felvett ({felvettKp} KP)</button>
        <button className="he-field-btn kep-prompt-btn-lg" onClick={onKiérdemelt}>⭐ Kiérdemelt</button>
      </div>
    </PopupOverlay>
  );
}

// --- Egyedi fortély név + kiterjesztés picker ---
export function EgyediFortelyPopup({ képzettségek, onConfirm, onCancel }: {
  képzettségek: { név: string; szint: number }[];
  onConfirm: (név: string, kiterjeszti: string[]) => void;
  onCancel: () => void;
}) {
  const [név, setNév] = useState('');
  const [kiterjeszti, setKiterjeszti] = useState<Set<string>>(new Set());

  function toggleKép(kn: string) {
    setKiterjeszti(prev => { const n = new Set(prev); if (n.has(kn)) n.delete(kn); else n.add(kn); return n; });
  }

  const trimmed = név.trim();
  const valid = trimmed.length > 0 && trimmed.length <= MAX_EGYEDI_FORTELY_NÉV;

  return (
    <PopupOverlay onClose={onCancel} className="kep-prompt kep-prompt-align-center kep-prompt-gap-12">
      <label className="kep-prompt-label-bold">⭐ Egyedi fortély</label>
      <input
        className="field-input"
        type="text"
        placeholder="Fortély neve (max 20)"
        maxLength={MAX_EGYEDI_FORTELY_NÉV}
        value={név}
        onChange={e => setNév(e.target.value)}
        autoFocus
      />
      {képzettségek.length > 0 && (
        <div className="egyedi-kit-section">
          <label className="egyedi-kit-label">Kiterjeszti (opcionális):</label>
          <div className="egyedi-kit-list">
            {képzettségek.map(k => (
              <button key={k.név}
                className={`egyedi-kit-btn${kiterjeszti.has(k.név) ? ' active' : ''}`}
                onClick={() => toggleKép(k.név)}>{k.név}</button>
            ))}
          </div>
        </div>
      )}
      <button className="he-field-btn kep-prompt-btn-lg" disabled={!valid}
        onClick={() => onConfirm(trimmed, [...kiterjeszti])}>OK</button>
    </PopupOverlay>
  );
}
