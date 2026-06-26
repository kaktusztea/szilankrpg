import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { AktivBaseProps } from './types';
import { fmtCode } from '../formatters';
import { isHelyzetAvailable, getMinPengeWarning, getHelyzetInfoText } from './AktivHelpers';

interface Props extends AktivBaseProps {
  helyzetFortélyok: Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>;
}

export function AktivHelyzetek({ data, karakter, session, setSession, pushUndo, helyzetFortélyok }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  function addHelyzet(h: typeof data.harciHelyzetek[0]) {
    pushUndo(`Helyzet: ${h.név}`);
    const hDef = data.harciHelyzetek.find(d => d.név === h.név);
    setSession(s => {
      let helyzetek = [...s.aktív_helyzetek, h.név];
      let taktikák = s.aktív_taktikák;
      const kizár = hDef?.kizár_helyzetek ?? [];
      if (kizár.length) {
        const kizártNevek = kizár.map((kid: string) => data.harciHelyzetek.find(d => d.id === kid)?.név).filter(Boolean);
        helyzetek = helyzetek.filter(hh => !kizártNevek.includes(hh));
      }
      if (hDef?.tiltja_taktikákat) taktikák = [];
      const patch: Partial<typeof s> = {};
      if (hDef?.tiltott_fegyverfogások?.includes(s.fegyverfogás)) {
        patch.fegyverfogás = 'egyfegyveres'; patch.kétkezes_harc = false;
        patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1;
      }
      return { ...s, ...patch, aktív_helyzetek: helyzetek, aktív_taktikák: taktikák };
    });
    setShowPicker(false);
  }

  function renderHelyzetItems() {
    const filtered = data.harciHelyzetek.filter(h => isHelyzetAvailable(h, session, data));
    const groups = [
      { label: 'Pozitív helyzet', color: '#4caf50', items: filtered.filter(h => h.csoport === 'pozitív') },
      { label: 'Semleges helyzet', color: '#ff9800', items: filtered.filter(h => h.csoport === 'semleges') },
      { label: 'Negatív helyzet', color: '#f44336', items: filtered.filter(h => h.csoport === 'negatív') },
    ];
    return (<>
      {groups.flatMap(g => g.items.length > 0 ? [
        <div key={g.label} className="aktiv-picker-group-label" style={{ color: g.color }}>{g.label}</div>,
        ...g.items.sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(h => (
          <div key={h.név} className="aktiv-picker-item" onClick={() => addHelyzet(h)}>
            <span className="aktiv-picker-item-name">{h.név}</span>
            <span className="aktiv-picker-item-hatas">{fmtCode(h.infó)}</span>
          </div>
        ))
      ] : [])}
    </>);
  }

  return (
    <>
      <div className="aktiv-section" style={{ borderBottom: 'none', fontSize: '13px' }}>
        <span className="aktiv-label">Harci helyzetek
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={data.harciHelyzetek.every(h => !isHelyzetAvailable(h, session, data))}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_helyzetek.map((h, i) => {
          const def = data.harciHelyzetek.find(d => d.név === h);
          if (!def) return null;
          const kötöttFortélyok = helyzetFortélyok.get(h) || [];
          const infóText = getHelyzetInfoText(h, data);
          const minPengeWarning = getMinPengeWarning(def.feltétel_kulcs || '', karakter, session, data);
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="kep-row">
                <span style={{ flex: 1 }}>
                  <strong style={{ color: '#ff9800' }}>{h}:</strong> {fmtCode(infóText)}
                  {minPengeWarning && <span className="aktiv-min-penge-warning">{minPengeWarning}</span>}
                </span>
                <button className="fort-delete" onClick={e => {
                  e.stopPropagation();
                  pushUndo(`Helyzet−: ${h}`);
                  setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }));
                }}>✕</button>
              </div>
              {kötöttFortélyok.map((kf, j) => (
                <div key={j} className="kep-row" style={{ paddingLeft: '12px', color: kf.fok === 0 ? '#cd7c6f' : (kf.aktív ? '#66bb6a' : '#888'), flexWrap: 'wrap', wordBreak: 'break-word', justifyContent: 'flex-start' }}>
                  → {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowPicker(false); }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>Harci helyzet választó</label>
            </div>
            <div className="aktiv-picker-list">
              {renderHelyzetItems()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
