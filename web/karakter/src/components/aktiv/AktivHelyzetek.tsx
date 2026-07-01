import { useState } from 'react';
import type { AktivBaseProps } from './types';
import { fmtCode } from '../formatters';
import { isHelyzetAvailable, getMinPengeWarning, getHelyzetInfoText } from './AktivHelpers';
import { PickerOverlay } from './PickerOverlay';

interface Props extends AktivBaseProps {
  helyzetFortélyok: Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>;
}

export function AktivHelyzetek({ data, karakter, session, setSession, pushUndo, helyzetFortélyok }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  function addHelyzet(h: typeof data.harciHelyzetek[0]) {
    pushUndo(`Helyzet: ${h.név}`, [{ field: 'session', prev: session }]);
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

  const groups = [
    { label: 'Pozitív helyzet', cls: 'aktiv-picker-group-pozitív', items: data.harciHelyzetek.filter(h => h.csoport === 'pozitív' && isHelyzetAvailable(h, session, data)) },
    { label: 'Semleges helyzet', cls: 'aktiv-picker-group-semleges', items: data.harciHelyzetek.filter(h => h.csoport === 'semleges' && isHelyzetAvailable(h, session, data)) },
    { label: 'Negatív helyzet', cls: 'aktiv-picker-group-negatív', items: data.harciHelyzetek.filter(h => h.csoport === 'negatív' && isHelyzetAvailable(h, session, data)) },
  ];

  return (
    <>
      <div className="aktiv-section aktiv-section-noborder">
        <span className="aktiv-label">Harci helyzetek
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={groups.every(g => g.items.length === 0)}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_helyzetek.map((h, i) => {
          const def = data.harciHelyzetek.find(d => d.név === h);
          if (!def) return null;
          const kötöttFortélyok = helyzetFortélyok.get(h) || [];
          const infóText = getHelyzetInfoText(h, data);
          const minPengeWarning = getMinPengeWarning(def.feltétel_kulcs || '', karakter, session, data);
          return (
            <div key={i} className="aktiv-flex-col">
              <div className="kep-row">
                <span className="aktiv-flex-1">
                  <strong className="aktiv-strong-helyzet">{h}:</strong> {fmtCode(infóText)}
                  {minPengeWarning && <span className="aktiv-min-penge-warning">{minPengeWarning}</span>}
                </span>
                <button className="fort-delete" onClick={e => {
                  e.stopPropagation();
                  pushUndo(`Helyzet−: ${h}`, [{ field: 'session', prev: session }]);
                  setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }));
                }}>✕</button>
              </div>
              {kötöttFortélyok.map((kf, j) => (
                <div key={j} className={`kep-row aktiv-helyzet-fortely-sor ${kf.fok === 0 ? 'aktiv-helyzet-alapeset' : kf.aktív ? 'aktiv-helyzet-aktiv' : 'aktiv-helyzet-inaktiv'}`}>
                  → {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showPicker && (
        <PickerOverlay title="Harci helyzet választó" onClose={() => setShowPicker(false)}>
          {groups.flatMap(g => g.items.length > 0 ? [
            <div key={g.label} className={`aktiv-picker-group-label ${g.cls}`}>{g.label}</div>,
            ...g.items.sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(h => (
              <div key={h.név} className="aktiv-picker-item" onClick={() => addHelyzet(h)}>
                <span className="aktiv-picker-item-name">{h.név}</span>
                <span className="aktiv-picker-item-hatas">{fmtCode(h.infó)}</span>
              </div>
            ))
          ] : [])}
        </PickerOverlay>
      )}
    </>
  );
}
