import { useRef, useState } from 'react';
import type { Session } from '../../engine/types';
import type { UndoPatch } from '../../hooks/useUndo';
import { PickerOverlay } from './PickerOverlay';

interface Props {
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[]) => void;
}

const ÉRTÉKEK = [
  { v: -2, l: 'Hátrány-2' },
  { v: -1, l: 'Hátrány-1' },
  { v: 1, l: 'Előny+1' },
  { v: 2, l: 'Előny+2' },
] as const;

export function AktivNarrativ({ session, setSession, pushUndo }: Props) {
  const [showPopup, setShowPopup] = useState(false);
  const [érték, setÉrték] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(szöveg: string) {
    if (!szöveg || érték === undefined) return;
    pushUndo(`Narratív: ${szöveg}`, [{ field: 'session', prev: session }]);
    setSession(s => ({ ...s, narratív_módosítók: [...s.narratív_módosítók, { szöveg, érték }] }));
    setShowPopup(false);
    setÉrték(undefined);
  }

  return (
    <>
      <div className="aktiv-section aktiv-section-sm">
        <span className="aktiv-label">Narratív Előny/Hátrányok
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            onClick={() => { setÉrték(undefined); setShowPopup(true); }}>+</button>
        </span>
        {session.narratív_módosítók.map((nm, i) => (
          <div key={i} className="kep-row">
            <span className="aktiv-flex-1">
              <strong className={(nm.érték ?? 0) > 0 ? 'aktiv-strong-pos' : 'aktiv-strong-neg'}>{nm.szöveg}:</strong>
              <span> {nm.érték != null ? (nm.érték > 0 ? `Előny+${nm.érték}` : `Hátrány${nm.érték}`) : ''}</span>
            </span>
            <button className="fort-delete" onClick={e => {
              e.stopPropagation();
              pushUndo(`Narratív−: ${nm.szöveg}`, [{ field: 'session', prev: session }]);
              setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) }));
            }}>✕</button>
          </div>
        ))}
      </div>

      {showPopup && (
        <PickerOverlay title="Narratív Előny/Hátrány" onClose={() => setShowPopup(false)}>
          <div className="narrativ-popup-content">
            <div className="narrativ-popup-btns">
              {ÉRTÉKEK.map(b => (
                <button key={b.v} onClick={() => setÉrték(b.v)}
                  className={`narrativ-val-btn${érték === b.v ? ' selected' : ''}${b.v > 0 ? ' narrativ-val-pos' : ' narrativ-val-neg'}`}>
                  {b.l}
                </button>
              ))}
            </div>
            <input className="narrativ-input narrativ-input-full" placeholder="Leírás..." maxLength={40}
              ref={inputRef}
              onKeyDown={e => { if (e.key === 'Enter') submit((e.target as HTMLInputElement).value.trim()); }} />
            <button className="narrativ-add-btn narrativ-add-btn-center" disabled={érték === undefined} onClick={() => {
              submit(inputRef.current?.value.trim() ?? '');
            }}>OK</button>
          </div>
        </PickerOverlay>
      )}
    </>
  );
}
