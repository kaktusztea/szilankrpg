import { useState } from 'react';
import type { KepzettsegDef } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { MD_BASE } from '../MdLink';

interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  available: PickerOption[];
  kepzettsegDefs: KepzettsegDef[];
  onAdd: (value: string) => void;
  onClose: () => void;
}

export function KepzettsegPickerOverlay({ available, kepzettsegDefs, onAdd, onClose }: Props) {
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  function handlePick(value: string) {
    onClose();
    onAdd(value);
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="fort-picker-popup" onClick={e => e.stopPropagation()}>
        <div className="fort-picker-header">
          <label>+ Új képzettség</label>
          <button type="button" className="aktiv-picker-close" aria-label="Bezárás" onClick={onClose}>✕</button>
        </div>
        <div className="fort-picker-list">
          {available.map(opt => {
            const isExpanded = expandedValue === opt.value;
            const def = findDef(opt, kepzettsegDefs);
            const hasInfo = !!def;

            return (
              <div key={opt.value} className="fort-picker-item-wrap">
                <div className="fort-picker-item-top" onClick={() => handlePick(opt.value)}>
                  <span className="fort-picker-item-name">{opt.label}</span>
                  {hasInfo && (
                    <button
                      className={`fort-picker-dot${isExpanded ? ' fort-picker-dot-active' : ''}`}
                      onClick={e => { e.stopPropagation(); setExpandedValue(isExpanded ? null : opt.value); }}
                      aria-label="Részletek"
                    >●</button>
                  )}
                </div>
                {isExpanded && def && (
                  <div className="fort-picker-details" onClick={() => setExpandedValue(null)}>
                    {def.domináns_tulajdonságok.length > 0 && (
                      <div className="fort-picker-details-line">
                        <span className="fort-picker-details-fok">Tulajdonságok:</span>{' '}
                        {def.domináns_tulajdonságok.join(', ')}
                      </div>
                    )}
                    <div className="fort-picker-details-line">
                      <span className="fort-picker-details-fok">Próba:</span>{' '}
                      {def.próba || '—'}
                    </div>
                    {def.primer && (
                      <div className="fort-picker-details-line">
                        <span className="fort-picker-details-fok">Primer</span>
                      </div>
                    )}
                    {def.kapcsolódó_szituációk?.length > 0 && (
                      <div className="fort-picker-details-szit">
                        <span className="fort-picker-details-fok">Szituációk:</span>
                        {def.kapcsolódó_szituációk.map((sz, i) => (
                          <a key={i} className="info-panel-szit-link" href={MD_BASE + sz.fájl}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}>{sz.név}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </OverlayPortal>
  );
}

/** Find the KepzettsegDef from picker option value */
function findDef(opt: PickerOption, defs: KepzettsegDef[]): KepzettsegDef | undefined {
  // Simple name match
  const simple = defs.find(d => d.név === opt.value);
  if (simple) return simple;
  // Többszörös: "Név:sub" → base name
  if (opt.value.includes(':')) {
    const base = opt.value.split(':')[0];
    return defs.find(d => d.név === base);
  }
  // __prompt:Név → base name
  if (opt.value.startsWith('__prompt:')) {
    const base = opt.value.slice('__prompt:'.length);
    return defs.find(d => d.név === base);
  }
  return undefined;
}
