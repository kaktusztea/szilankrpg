import { useState } from 'react';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { fmtHatás } from '../formatters';
import { isTaktikaAllowed, getTaktikaMods } from './AktivHelpers';
import { PickerOverlay } from './PickerOverlay';
import { TaktikaPickerList } from './TaktikaPickerList';
import { TaktikaFokPicker } from './TaktikaFokPicker';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[]) => void;
  taktikaHatásPerElem: { név: string; hatások: any[] }[];
  eseményNév: (id: string) => string;
}

export function AktivTaktikak({ data, karakter, session, setSession, pushUndo, taktikaHatásPerElem, eseményNév }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [fokválasztó, setFokválasztó] = useState<string | null>(null);

  function addTaktika(név: string) {
    const def = data.taktikak.find(t => t.név === név);
    if (!def) return;
    pushUndo(`Taktika: ${név}`, [{ field: 'session', prev: session }]);
    const entry: AktívTaktika = { név, fok: def.fokozatos ? 1 : undefined };
    setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, entry] }));
  }

  function removeTaktika(idx: number) {
    pushUndo(`Taktika−: ${session.aktív_taktikák[idx]?.név}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.filter((_, i) => i !== idx) }));
  }

  function setTaktikaFok(idx: number, fok: number) {
    pushUndo(`Taktika: ${session.aktív_taktikák[idx]?.név} fok→${fok}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.map((t, i) => i === idx ? { ...t, fok } : t) }));
  }

  function handleFokSelect(fok: number, isNew: boolean) {
    if (!fokválasztó) return;
    if (!isNew) {
      const idx = session.aktív_taktikák.findIndex(a => a.név === fokválasztó);
      if (idx >= 0) setTaktikaFok(idx, fok);
    } else {
      pushUndo(`Taktika: ${fokválasztó}`, [{ field: 'session', prev: session }]);
      setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, { név: fokválasztó!, fok }] }));
    }
    setShowPicker(false); setFokválasztó(null);
  }

  const allDisabled = data.taktikak.every(t => session.aktív_taktikák.some(a => a.név === t.név) || !isTaktikaAllowed(t.név, session, karakter, data));

  return (
    <>
      <div className="aktiv-section aktiv-section-sm">
        <span className="aktiv-label">Taktikák
          <button className="aktiv-add-btn aktiv-add-btn-sm" disabled={allDisabled} onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_taktikák.map((t, i) => {
          const def = data.taktikak.find(d => d.név === t.név);
          const mods = getTaktikaMods(t, data);
          return (
            <div key={i} className={`kep-row${def?.fokozatos ? ' aktiv-taktika-row-clickable' : ''}`}
              onClick={() => { if (def?.fokozatos) { setFokválasztó(t.név); setShowPicker(true); } }}>
              <span className="aktiv-flex-1">
                <strong className="aktiv-taktika-name">{t.név}{t.fok != null ? ` (${t.fok})` : ''}:</strong>
                {mods.length > 0 && <span className="aktiv-taktika-mods"> {mods.join(', ')} ✔</span>}
                {def?.megjegyzés && <span className="aktiv-taktika-note"> • {def.megjegyzés}</span>}
              </span>
              <button className="fort-delete" onClick={e => { e.stopPropagation(); removeTaktika(i); }}>✕</button>
            </div>
          );
        })}
        {taktikaHatásPerElem.map((t, i) => (
          <div key={`th${i}`} className="kep-row aktiv-sub-row">
            <span className="aktiv-flex-1">
              <strong className="aktiv-taktika-name">{t.név}:</strong>{' '}
              {t.hatások.map((h: any, j: number) => {
                const txt = fmtHatás({ operátor: h.hatás ?? h.operátor, cél: h.cél, érték: h.érték, megjegyzés: h.megjegyzés }, eseményNév);
                return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null;
              })}
            </span>
          </div>
        ))}
      </div>

      {showPicker && (
        <PickerOverlay title={fokválasztó ? `${fokválasztó} — fok választó` : 'Taktika választó'} onClose={() => { setShowPicker(false); setFokválasztó(null); }}>
          {fokválasztó
            ? <TaktikaFokPicker fokválasztó={fokválasztó} data={data} karakter={karakter} session={session} onSelect={handleFokSelect} />
            : <TaktikaPickerList data={data} karakter={karakter} session={session}
                onAddSimple={név => { addTaktika(név); setShowPicker(false); }}
                onFokválasztó={setFokválasztó} />
          }
        </PickerOverlay>
      )}
    </>
  );
}
