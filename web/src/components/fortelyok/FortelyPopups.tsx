import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FortelySummary, NyelvEntry } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';
import type { DeleteTarget, SzabadTypePicker } from './types';
import { displayName } from './helpers';

// --- Delete confirmation ---
export function DeletePopup({ target, onConfirm, onCancel }: {
  target: DeleteTarget;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
      <div className="kep-prompt" style={{ alignItems: 'center' }}>
        <label>{target.név}</label>
        <button className="btn-del-confirm he-del-confirm" onClick={onConfirm}>Fortély törlése</button>
      </div>
    </div>,
    document.body
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
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
      <div className="kep-prompt">
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
      </div>
    </div>,
    document.body
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
  const [freetextValue, setFreetextValue] = useState('');
  const usedSubs = new Set(fortélyok.filter(f => f.név === def.név).map(f => f.spec_elem));

  if (def.többszörös_lista.length > 0) {
    const availSubs = def.többszörös_lista.filter(s => !usedSubs.has(s));
    return createPortal(
      <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
        <div className="kep-prompt">
          <label>{def.név} — {def.többszörös_típus}:</label>
          <select className="fort-select" autoFocus value="" onChange={e => { if (e.target.value) onSelect(e.target.value); }}>
            <option value="">Válassz...</option>
            {availSubs.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="kep-prompt-btns"><button onClick={onCancel}>Mégse</button></div>
        </div>
      </div>,
      document.body
    );
  }

  if (def.többszörös_típus === 'fegyver') {
    const availFegyverek = fegyverNevek.filter(n => !usedSubs.has(n));
    return createPortal(
      <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
        <div className="kep-prompt">
          <label>{def.név} — fegyver:</label>
          <select className="fort-select" autoFocus value="" onChange={e => { if (e.target.value) onSelect(e.target.value); }}>
            <option value="">Válassz fegyvert...</option>
            {availFegyverek.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="kep-prompt-btns"><button onClick={onCancel}>Mégse</button></div>
        </div>
      </div>,
      document.body
    );
  }

  if (def.többszörös_típus === 'nyelv') {
    const availNyelvek = nyelvek.filter(n => !usedSubs.has(n.név));
    const byGroup = new Map<string, NyelvEntry[]>();
    for (const n of availNyelvek) {
      const arr = byGroup.get(n.csoport) || [];
      arr.push(n);
      byGroup.set(n.csoport, arr);
    }
    return createPortal(
      <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
        <div className="kep-prompt nyelv-picker">
          {[...byGroup.entries()].map(([group, langs]) => (
            <div key={group} className="nyelv-csoport">
              <div className="nyelv-csoport-label">{group}</div>
              {langs.map(l => (
                <button key={l.név} className="nyelv-btn" onClick={() => onSelect(l.név)}>{l.név}</button>
              ))}
            </div>
          ))}
        </div>
      </div>,
      document.body
    );
  }

  // Freetext
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
      <div className="kep-prompt">
        <label>{def.név} — {def.többszörös_típus}:</label>
        <input
          autoFocus maxLength={20}
          value={freetextValue}
          onChange={e => setFreetextValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && freetextValue.trim()) onSelect(freetextValue.trim()); if (e.key === 'Escape') onCancel(); }}
        />
        <div className="kep-prompt-btns">
          <button onClick={() => { if (freetextValue.trim()) onSelect(freetextValue.trim()); }} disabled={!freetextValue.trim()}>OK</button>
          <button onClick={onCancel}>Mégse</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Szabad type picker (Felvett / Kiérdemelt) ---
export function SzabadTypePickerPopup({ picker, onFelvett, onKiérdemelt, onCancel }: {
  picker: SzabadTypePicker;
  onFelvett: () => void;
  onKiérdemelt: () => void;
  onCancel: () => void;
}) {
  const label = picker.spec_elem ? `${picker.név} - ${picker.spec_elem}` : picker.név;
  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
      <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
        <label style={{ fontWeight: 'bold' }}>{label}</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={onFelvett}>6/0 Felvett</button>
          <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={onKiérdemelt}>⭐ Kiérdemelt</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
