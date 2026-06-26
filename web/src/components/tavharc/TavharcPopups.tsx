import { createPortal } from 'react-dom';
import type { Karakter } from '../../engine/types';
import { getMfFok } from './helpers';
import { TávolságPicker } from './TavolsagPicker';

export function TavharcPopups({ karakter, setKarakter, mfTarget, setMfTarget, deleteTarget, setDeleteTarget, ideaPopup, setIdeaPopup, távolságPopup, setTávolságPopup, idea, setIdea, távolság, setTávolság, osztó }: {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  mfTarget: number | null;
  setMfTarget: (v: number | null) => void;
  deleteTarget: number | null;
  setDeleteTarget: (v: number | null) => void;
  ideaPopup: boolean;
  setIdeaPopup: (v: boolean) => void;
  távolságPopup: boolean;
  setTávolságPopup: (v: boolean) => void;
  idea: number;
  setIdea: (v: number) => void;
  távolság: number;
  setTávolság: (v: number) => void;
  osztó: number;
}) {
  const k = karakter;

  function setMfFok(alap: string, fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && f.spec_elem === alap));
      if (fok > 0) fortélyok = [...fortélyok, { név: 'Mesterfegyver', fok, spec_típus: 'fegyver', spec_elem: alap }];
      return { ...prev, fortélyok };
    });
  }

  function removeTávfegyver(idx: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.távfegyverek[idx];
      const távfegyverek = prev.távfegyverek.filter((_, i) => i !== idx);
      const fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && f.spec_elem === removed.alap));
      const session = { ...prev.session };
      if (session.aktív_távfegyver_index >= távfegyverek.length) session.aktív_távfegyver_index = Math.max(0, távfegyverek.length - 1);
      if (távfegyverek.length === 0) session.aktív_távfegyver_index = -1;
      return { ...prev, távfegyverek, fortélyok, session };
    });
  }

  return (
    <>
      {mfTarget !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setMfTarget(null); }}>
          <div className="kep-prompt">
            <h4>Mesterfegyver fok — {k.távfegyverek[mfTarget]?.alap}</h4>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[0, 1, 2, 3].map(f => (
                <button key={f} className={`fort-fok-btn${getMfFok(k, k.távfegyverek[mfTarget]?.alap) === f ? ' active' : ''}`}
                  onClick={() => { setMfFok(k.távfegyverek[mfTarget]!.alap, f); setMfTarget(null); }}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      , document.body)}

      {deleteTarget !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setDeleteTarget(null); }}>
          <div className="kep-prompt" style={{ textAlign: 'center' }}>
            <p><strong>{k.távfegyverek[deleteTarget]?.alap}</strong></p>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { removeTávfegyver(deleteTarget); setDeleteTarget(null); }}>Távfegyver törlése</button>
          </div>
        </div>
      , document.body)}

      {ideaPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setIdeaPopup(false); }}>
          <div className="kep-prompt">
            <label>Idea érték</label>
            <div className="he-idea-grid">
              <div className="th-idea-row">
                {[-5, -4, -3, -2, -1].map(n => <button key={n} className={`fort-fok-btn th-idea-cell${idea === n ? ' active' : ''}`} onClick={() => { setIdea(n); setIdeaPopup(false); }}>{n}</button>)}
              </div>
              <div className="th-idea-row">
                <button className={`fort-fok-btn th-idea-cell${idea === 0 ? ' active' : ''}`} onClick={() => { setIdea(0); setIdeaPopup(false); }}>0</button>
              </div>
              <div className="th-idea-row">
                {[1, 2, 3, 4, 5].map(n => <button key={n} className={`fort-fok-btn th-idea-cell${idea === n ? ' active' : ''}`} onClick={() => { setIdea(n); setIdeaPopup(false); }}>+{n}</button>)}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {távolságPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setTávolságPopup(false); }}>
          <TávolságPicker value={távolság} osztó={osztó} onChange={setTávolság} />
        </div>
      , document.body)}
    </>
  );
}
