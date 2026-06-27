import type { Karakter } from '../../engine/types';
import type { TavharcPopupState } from './types';
import { PopupOverlay } from '../PopupOverlay';
import { TávolságPicker } from './TavolsagPicker';
import { getMfFok } from './helpers';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  popup: TavharcPopupState;
  closePopup: (key: keyof TavharcPopupState) => void;
  idea: number;
  setIdea: (v: number) => void;
  távolság: number;
  setTávolság: (v: number) => void;
  osztó: number;
}

export function TavharcPopups({ karakter, setKarakter, popup, closePopup, idea, setIdea, távolság, setTávolság, osztó }: Props) {
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
      {popup.mfTarget !== null && (
        <PopupOverlay onClose={() => closePopup('mfTarget')}>
          <h4>Mesterfegyver fok — {k.távfegyverek[popup.mfTarget]?.alap}</h4>
          <div className="kep-prompt-flex-fok">
            {[0, 1, 2, 3].map(f => (
              <button key={f} className={`fort-fok-btn${getMfFok(k, k.távfegyverek[popup.mfTarget!]?.alap) === f ? ' active' : ''}`}
                onClick={() => { setMfFok(k.távfegyverek[popup.mfTarget!]!.alap, f); closePopup('mfTarget'); }}>{f}</button>
            ))}
          </div>
        </PopupOverlay>
      )}

      {popup.deleteTarget !== null && (
        <PopupOverlay onClose={() => closePopup('deleteTarget')} centerText>
          <p><strong>{k.távfegyverek[popup.deleteTarget]?.alap}</strong></p>
          <button className="btn-del-confirm kep-prompt-btn-confirm" onClick={() => { removeTávfegyver(popup.deleteTarget!); closePopup('deleteTarget'); }}>Távfegyver törlése</button>
        </PopupOverlay>
      )}

      {popup.ideaPopup && (
        <PopupOverlay onClose={() => closePopup('ideaPopup')}>
          <label>Idea érték</label>
          <div className="he-idea-grid">
            {[[-5, -4, -3, -2, -1], [0], [1, 2, 3, 4, 5]].map((row, ri) => (
              <div key={ri} className="th-idea-row">
                {row.map(n => (
                  <button key={n} className={`fort-fok-btn th-idea-cell${idea === n ? ' active' : ''}`}
                    onClick={() => { setIdea(n); closePopup('ideaPopup'); }}>
                    {n > 0 ? `+${n}` : n}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </PopupOverlay>
      )}

      {popup.távolságPopup && (
        <PopupOverlay onClose={() => closePopup('távolságPopup')}>
          <TávolságPicker value={távolság} osztó={osztó} onChange={setTávolság} />
        </PopupOverlay>
      )}
    </>
  );
}
