import { useState } from 'react';
import type { GameData } from '../engine/data-loader';
import { PopupOverlay } from './PopupOverlay';
import { buildFegyverGroups } from './fegyver-groups';

// --- Source types ---

export interface PickerItem { value: string; label: string }

export type PickerSource =
  | { type: 'list'; label: string; items: PickerItem[] }
  | { type: 'grouped'; label: string; groups: { label: string; items: PickerItem[] }[] }
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
      <PopupOverlay onClose={onCancel} className="kep-prompt spec-picker">
        <div className="spec-picker-label">{source.label}</div>
        <div className="spec-picker-list">
          {source.items.map(it => (
            <button key={it.value} className="spec-picker-btn" onClick={() => onSelect(it.value)}>{it.label}</button>
          ))}
        </div>
      </PopupOverlay>
    );
  }

  if (source.type === 'grouped') {
    return (
      <PopupOverlay onClose={onCancel} className="kep-prompt spec-picker">
        {source.groups.map(g => (
          <div key={g.label} className="spec-picker-csoport">
            <div className="spec-picker-csoport-label">{g.label}</div>
            {g.items.map(it => (
              <button key={it.value} className="spec-picker-btn" onClick={() => onSelect(it.value)}>{it.label}</button>
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
  data: GameData,
): PickerSource {
  if (def.többszörös_lista.length > 0) {
    return {
      type: 'list',
      label: `${def.név} — ${def.többszörös_típus}:`,
      items: def.többszörös_lista.filter(s => !usedSubs.has(s)).map(s => ({ value: s, label: s })),
    };
  }
  if (def.többszörös_típus === 'fegyver') {
    // Fortély spec_elem = Alapnév (case-insensitive összevetés a usedSubs-szal).
    const felvett = new Set([...usedSubs].map(s => s.toLowerCase()));
    return {
      type: 'grouped',
      label: `${def.név} — fegyver:`,
      groups: buildFegyverGroups(data, f => f.Alapnév || f.Fegyver, felvett),
    };
  }
  if (def.többszörös_típus === 'nyelv') {
    const byGroup = new Map<string, PickerItem[]>();
    for (const n of data.nyelvek.filter(l => !usedSubs.has(l.név))) {
      const arr = byGroup.get(n.csoport) || [];
      arr.push({ value: n.név, label: n.név });
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
