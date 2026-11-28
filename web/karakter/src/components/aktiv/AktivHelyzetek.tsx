import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import type { SessionProps } from '../session-props';
import { fmtHatásSzöveg } from '../formatters';
import { HelyzetPickerPopup } from '../picker/HelyzetPickerPopup';
import { isHelyzetAvailable, getMinFegyverhosszWarning, getHelyzetInfoText, getTiltásWarnings } from '../../engine/taktika/helyzet-helpers';
import { helyzetDef } from '../../engine/lookup';
import { KotottFortelySorok } from './KotottFortelySorok';

interface Props extends SessionProps {
  helyzetFortélyok: Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>;
}

/** Info text → one effect per line: split at a sentence end or a comma when a capital letter follows
 *  ("Hátrány-2 TÉ dobásra, VÉ veszteség duplázódik."); abbreviations ("többsz. tám.") stay together. */
function hatásSorok(t: string): string[] {
  return t.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ])|,\s+(?=[A-ZÁÉÍÓÖŐÚÜŰ])/).map(x => x.trim()).filter(Boolean);
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
              <div className="item-row aktiv-helyzet-item">
                <span className="aktiv-flex-1">
                  <strong className="aktiv-strong-helyzet">{h}</strong>
                  {minFegyverhosszWarning && <span className="aktiv-min-fegyverhossz-warning">{minFegyverhosszWarning}</span>}
                  {tiltásWarnings.map(w => <span key={w} className="aktiv-min-fegyverhossz-warning">{w}</span>)}
                  {/* One sentence per line, like the Taktikák / Státuszok sections */}
                  {infóText && <div className="aktiv-taktika-hatas aktiv-statusz-hatasok">{hatásSorok(infóText).map((m, j) => <div key={j}>{fmtHatásSzöveg(m)}</div>)}</div>}
                </span>
                <button className="item-delete" onClick={e => {
                  e.stopPropagation();
                  pushUndo(`Helyzet−: ${h}`, [{ field: 'session', prev: session }]);
                  setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }));
                }}><Ikon név="bezár" /></button>
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
