import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { IdeaSkala } from '../common/PickerComponents';
import { lookupTávfegyver } from '../../engine/lookup';
import { calcCÉBontás, getFortélyCÉ } from './helpers';
import { FORTÉLY_FOK_VALUES } from '../../ui-constants';
import type { TavharcPopupState } from './types';
import { PopupOverlay } from '../PopupOverlay';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { TávolságPicker } from './TavolsagPicker';
import { getMfFok } from './mesterfegyver-calc';

interface Props {
  karakter: Karakter;
  /** For the Idea preview (CÉ with the selected Idea). */
  data: GameData;
  session: Session;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  popup: TavharcPopupState;
  closePopup: (key: keyof TavharcPopupState) => void;
  távolság: number;
  setTávolság: (v: number) => void;
  osztó: number;
}

export function TavharcPopups({ karakter, data, session, setKarakter, popup, closePopup, távolság, setTávolság, osztó }: Props) {
  const k = karakter;

  function setMfFok(alap: string, fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.id === 'mesterfegyver' && f.elem === alap));
      if (fok > 0) fortélyok = [...fortélyok, { id: 'mesterfegyver', fok, elem: alap }];
      return { ...prev, fortélyok };
    });
  }

  function removeTávfegyver(idx: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.távfegyverek[idx];
      const távfegyverek = prev.távfegyverek.filter((_, i) => i !== idx);
      const fortélyok = prev.fortélyok.filter(f => !(f.id === 'mesterfegyver' && f.elem === removed.alap));
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
          <h4>Mesterfegyver fok - {k.távfegyverek[popup.mfTarget]?.alap}</h4>
          <div className="kep-prompt-flex-fok">
            {FORTÉLY_FOK_VALUES.map(f => (
              <button key={f} className={`fort-fok-btn szin-fortely${getMfFok(k, k.távfegyverek[popup.mfTarget!]?.alap) === f ? ' active' : ''}`}
                onClick={() => { setMfFok(k.távfegyverek[popup.mfTarget!]!.alap, f); closePopup('mfTarget'); }}>{f}</button>
            ))}
          </div>
        </PopupOverlay>
      )}

      {popup.deleteTarget !== null && (
        <DeleteConfirmPopup
          label={k.távfegyverek[popup.deleteTarget]?.alap ?? ''}
          buttonText="Távfegyver törlése"
          onConfirm={() => { removeTávfegyver(popup.deleteTarget!); closePopup('deleteTarget'); }}
          onClose={() => closePopup('deleteTarget')}
        />
      )}

      {popup.ideaPopup !== null && (
        <PopupOverlay onClose={() => closePopup('ideaPopup')}>
          <label className="kep-prompt-text-center">Idea érték</label>
          {(() => {
            // Preview: CÉ with the current Idea (Idea is 1:1 to CÉ, relative to the weapon's idea_default)
            const idx = popup.ideaPopup!;
            const tf = k.távfegyverek[idx];
            const def = tf ? lookupTávfegyver(data.tavfegyverek, tf.alap) : undefined;
            const delta = (tf?.idea ?? 0) - (def?.idea_default ?? 0);
            const cé = tf ? calcCÉBontás(k, data, session, def, delta, getFortélyCÉ(k, data, session, tf.alap), tf.alap).cé : 0;
            const range = data.konstansok.fegyver_idea_plusz_minusz;
            return (
              <IdeaSkala minIdea={-range} maxIdea={range} current={tf?.idea ?? 0}
                onSelect={n => setKarakter(prev => prev ? { ...prev, távfegyverek: prev.távfegyverek.map((t, i) => i === idx ? { ...t, idea: n } : t) } : prev)}
                onKész={() => closePopup('ideaPopup')}
                előnézet={tf ? [{ címke: 'CÉ', érték: String(cé), változás: delta }] : []} />
            );
          })()}
        </PopupOverlay>
      )}

      {popup.távolságPopup && (
        <PopupOverlay onClose={() => closePopup('távolságPopup')}>
          <TávolságPicker távolság={távolság} osztó={osztó} onChange={setTávolság} />
        </PopupOverlay>
      )}
    </>
  );
}
