import { useState } from 'react';
import { PopupOverlay } from './PopupOverlay';

// --- Source types ---

export type PickerSource =
  | { type: 'list'; label: string; items: string[] }
  | { type: 'grouped'; label: string; groups: { label: string; items: string[] }[] }
  | { type: 'freetext'; label: string; placeholder?: string; maxLength?: number }

// --- Props ---

interface SpecPickerProps {
  source: PickerSource;
  onSelect: (value: string) => void;
  onCancel: () => void;
}

// --- Component ---

export function SpecPicker({ source, onSelect, onCancel }: SpecPickerProps) {
  const [freetextValue, setFreetextValue] = useState('');

  if (source.type === 'list') {
    return (
      <PopupOverlay onClose={onCancel}>
        <label>{source.label}</label>
        <select className="fort-select" autoFocus value="" onChange={e => { if (e.target.value) onSelect(e.target.value); }}>
          <option value="">Válassz...</option>
          {source.items.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <div className="kep-prompt-btns"><button onClick={onCancel}>Mégse</button></div>
      </PopupOverlay>
    );
  }

  if (source.type === 'grouped') {
    return (
      <PopupOverlay onClose={onCancel} className="kep-prompt nyelv-picker">
        {source.groups.map(g => (
          <div key={g.label} className="nyelv-csoport">
            <div className="nyelv-csoport-label">{g.label}</div>
            {g.items.map(item => (
              <button key={item} className="nyelv-btn" onClick={() => onSelect(item)}>{item}</button>
            ))}
          </div>
        ))}
      </PopupOverlay>
    );
  }

  // freetext
  const maxLen = source.maxLength ?? 20;
  return (
    <PopupOverlay onClose={onCancel}>
      <label>{source.label}</label>
      <input
        autoFocus maxLength={maxLen}
        value={freetextValue}
        onChange={e => setFreetextValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && freetextValue.trim()) onSelect(freetextValue.trim()); if (e.key === 'Escape') onCancel(); }}
        placeholder={source.placeholder}
      />
      <div className="kep-prompt-btns">
        <button onClick={() => { if (freetextValue.trim()) onSelect(freetextValue.trim()); }} disabled={!freetextValue.trim()}>OK</button>
        <button onClick={onCancel}>Mégse</button>
      </div>
    </PopupOverlay>
  );
}

// --- Helper: build source from fortély def + context ---

export function buildFortelyPickerSource(
  def: { név: string; többszörös_típus: string; többszörös_lista: string[] },
  usedSubs: Set<string>,
  runtimeLists: { fegyverNevek: string[]; nyelvek: { név: string; csoport: string }[] }
): PickerSource {
  if (def.többszörös_lista.length > 0) {
    return { type: 'list', label: `${def.név} — ${def.többszörös_típus}:`, items: def.többszörös_lista.filter(s => !usedSubs.has(s)) };
  }
  if (def.többszörös_típus === 'fegyver') {
    return { type: 'list', label: `${def.név} — fegyver:`, items: runtimeLists.fegyverNevek.filter(n => !usedSubs.has(n)) };
  }
  if (def.többszörös_típus === 'nyelv') {
    const byGroup = new Map<string, string[]>();
    for (const n of runtimeLists.nyelvek.filter(l => !usedSubs.has(l.név))) {
      const arr = byGroup.get(n.csoport) || [];
      arr.push(n.név);
      byGroup.set(n.csoport, arr);
    }
    return { type: 'grouped', label: def.név, groups: [...byGroup.entries()].map(([label, items]) => ({ label, items })) };
  }
  return { type: 'freetext', label: `${def.név} — ${def.többszörös_típus}:` };
}

/** Returns true if this fortély's többszörös picker is free text (no finite list). */
export function isFreeTextPicker(def: { többszörös_típus: string; többszörös_lista: string[] }, runtimeTypes: Set<string>): boolean {
  if (!def.többszörös_típus) return false;
  if (def.többszörös_lista.length > 0) return false;
  if (runtimeTypes.has(def.többszörös_típus)) return false;
  return true;
}

/** Known spec_típus values that resolve to runtime lists (not free text). */
export const RUNTIME_PICKER_TYPES = new Set(['fegyver', 'nyelv']);
