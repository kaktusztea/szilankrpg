import { TRADÍCIÓ_ID } from '../../engine/azonosito';
import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import { OverlayPortal } from '../common/OverlayPortal';
import { KepzettsegDetails } from '../KepzettsegDetails';
import { MdLink } from '../MdLink';

interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  available: PickerOption[];
  kepzettsegDefs: KepzettsegDef[];
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  onAdd: (value: string) => void;
  onClose: () => void;
}

export function KepzettsegPickerOverlay({ available, kepzettsegDefs, kiterjesztesek, onAdd, onClose }: Props) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

  function handlePick(value: string) {
    onClose();
    onAdd(value);
  }

  function toggleAll() {
    if (allExpanded) {
      setExpandedValue(null);
      setAllExpanded(false);
    } else {
      setAllExpanded(true);
    }
  }

  function toggleItem(value: string) {
    if (allExpanded) {
      setAllExpanded(false);
      setExpandedValue(null);
    } else {
      setExpandedValue(prev => prev === value ? null : value);
    }
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fort-picker-popup" onClick={e => e.stopPropagation()}>
        <div className="fort-picker-header">
          <label>+ Új képzettség</label>
          <button type="button" className={`fort-picker-expand-all${allExpanded ? ' fort-picker-dot-active' : ''}`} aria-label="Összes lenyitása" onClick={toggleAll}><Ikon név="lenyit" /></button>
          <button type="button" className="aktiv-picker-close" aria-label="Bezárás" onClick={onClose}><Ikon név="bezár" /></button>
        </div>
        <div className="fort-picker-list">
          {available.map(opt => {
            const def = pickerOpcióDef(opt.value, kepzettsegDefs);
            const hasInfo = !!def;
            const isExpanded = expandedValue === opt.value || (allExpanded && hasInfo);

            return (
              <div key={opt.value} className="fort-picker-item-wrap">
                <div className="fort-picker-item-top" onClick={() => handlePick(opt.value)}>
                  <span className="fort-picker-item-name">{opt.label}</span>
                  {def?.md_fájl && <span className="md-link-wrap" onClick={e => e.stopPropagation()}><MdLink mdFájl={def.md_fájl} /></span>}
                  {hasInfo && (
                    <button
                      className={`fort-picker-dot${isExpanded ? ' fort-picker-dot-active' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleItem(opt.value); }}
                      aria-label="Részletek"
                    ><Ikon név="lenyit" /></button>
                  )}
                </div>
                {isExpanded && def && (
                  <KepzettsegDetails def={def} kit={kiterjesztesek[def.id] || []} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </OverlayPortal>
  );
}

/**
 * Find the KepzettsegDef of a picker option. The option values are id-based (see getAvailableNames):
 * `<id>`, `<id>/<sub>` (többszörös), `__prompt:<id>` (new free-text element), `__tradicio`.
 */
export function pickerOpcióDef(value: string, defs: KepzettsegDef[]): KepzettsegDef | undefined {
  const id = value === '__tradicio' ? TRADÍCIÓ_ID
    : value.startsWith('__prompt:') ? value.slice('__prompt:'.length)
    : value.split('/')[0];
  return defs.find(d => d.id === id);
}
