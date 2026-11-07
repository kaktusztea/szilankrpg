import { useState } from 'react';
import type { AktivBaseProps } from './types';
import { fmtCode } from '../formatters';
import { HelyzetPickerPopup } from '../picker/HelyzetPickerPopup';
import { isHelyzetAvailable, getMinFegyverhosszWarning, getHelyzetInfoText, getTiltásWarnings } from '../../engine/taktika/helyzet-helpers';
import { helyzetDef } from '../../engine/lookup';
import { KotottFortelySorok } from './KotottFortelySorok';

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
          const def = helyzetDef(data, h);
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
              <KotottFortelySorok sorok={kötöttFortélyok} alapeset />
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
