import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Session } from '../../engine/types';

interface Props {
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
}

export function AktivNarrativ({ session, setSession, pushUndo }: Props) {
  const [showPopup, setShowPopup] = useState(false);
  const [érték, setÉrték] = useState<number | undefined>(undefined);

  function submit(szöveg: string) {
    if (!szöveg || érték === undefined) return;
    pushUndo(`Narratív: ${szöveg}`);
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
              pushUndo(`Narratív−: ${nm.szöveg}`);
              setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) }));
            }}>✕</button>
          </div>
        ))}
      </div>

      {showPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPopup(false); }}>
          <div className="kep-prompt narrativ-popup">
            <label className="narrativ-popup-label">Narratív Előny/Hátrány</label>
            <div className="narrativ-popup-btns">
              {[{ v: -2, l: 'Hátrány-2' }, { v: -1, l: 'Hátrány-1' }, { v: 1, l: 'Előny+1' }, { v: 2, l: 'Előny+2' }].map(b => {
                const sel = érték === b.v;
                const color = b.v > 0 ? '#4caf50' : 'var(--accent)';
                return (
                  <button key={b.v} onClick={() => setÉrték(b.v)}
                    className={`narrativ-val-btn${sel ? ' selected' : ''}`}
                    style={sel ? { borderColor: color, background: color } : undefined}>
                    {b.l}
                  </button>
                );
              })}
            </div>
            <input className="narrativ-input narrativ-input-full" placeholder="Leírás..." maxLength={40}
              onKeyDown={e => { if (e.key === 'Enter') submit((e.target as HTMLInputElement).value.trim()); }}
              id="narrativ-popup-text" />
            <button className="narrativ-add-btn narrativ-add-btn-center" disabled={érték === undefined} onClick={() => {
              const el = document.getElementById('narrativ-popup-text') as HTMLInputElement;
              submit(el.value.trim());
            }}>OK</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
