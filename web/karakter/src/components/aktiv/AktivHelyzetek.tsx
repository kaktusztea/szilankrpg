import { useState } from 'react';
import type { AktivBaseProps } from './types';
import { fmtCode } from '../formatters';
import { isHelyzetAvailable, getMinFegyverhosszWarning, getHelyzetInfoText, getTiltásWarnings } from './AktivHelpers';
import { HelyzetPickerPopup } from './HelyzetPickerPopup';

interface Props extends AktivBaseProps {
  helyzetFortélyok: Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>;
}

export function AktivHelyzetek({ data, karakter, session, setSession, pushUndo, helyzetFortélyok }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const bármiElérhető = data.harciHelyzetek.some(h => isHelyzetAvailable(h, session, data));

  return (
    <>
      <div className="aktiv-section aktiv-section-noborder">
        <h3>Harci helyzetek
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={!bármiElérhető}
            onClick={() => setShowPicker(true)}>+</button>
        </h3>
        {session.aktív_helyzetek.map((h, i) => {
          const def = data.harciHelyzetek.find(d => d.név === h);
          if (!def) return null;
          const kötöttFortélyok = helyzetFortélyok.get(h) || [];
          const infóText = getHelyzetInfoText(h, data);
          const minFegyverhosszWarning = getMinFegyverhosszWarning(def.feltétel_kulcs || '', karakter, session, data);
          const tiltásWarnings = getTiltásWarnings(h, karakter, session, data);
          return (
            <div key={i} className="aktiv-flex-col">
              <div className="item-row">
                <span className="aktiv-flex-1">
                  <strong className="aktiv-strong-helyzet">{h}:</strong> {fmtCode(infóText)}
                  {minFegyverhosszWarning && <span className="aktiv-min-fegyverhossz-warning">{minFegyverhosszWarning}</span>}
                  {tiltásWarnings.map(w => <span key={w} className="aktiv-min-fegyverhossz-warning">{w}</span>)}
                </span>
                <button className="item-delete" onClick={e => {
                  e.stopPropagation();
                  pushUndo(`Helyzet−: ${h}`, [{ field: 'session', prev: session }]);
                  setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }));
                }}>✕</button>
              </div>
              {kötöttFortélyok.map((kf, j) => (
                <div key={j} className={`item-row aktiv-helyzet-fortely-sor ${kf.fok === 0 ? 'aktiv-helyzet-alapeset' : kf.aktív ? 'aktiv-helyzet-aktiv' : 'aktiv-helyzet-inaktiv'}`}>
                  <span>→ {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showPicker && (
        <HelyzetPickerPopup data={data} karakter={karakter} session={session}
          setSession={setSession} pushUndo={pushUndo} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}
