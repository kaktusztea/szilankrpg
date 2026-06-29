import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getMfFok, mfKövetelményHiba, mfKövetelményText, calcCÉ, getCÉInputs, calcTámadásLabel } from './helpers';

interface Props {
  index: number;
  isActive: boolean;
  karakter: Karakter;
  data: GameData;
  idea: number;
  fortélyCÉ: number;
  gyorsaság: number;
  gyorsÚjratöltésFok: number;
  onSelect: () => void;
  onMfTarget: () => void;
  onDeleteTarget: () => void;
  onIdeaPopup: () => void;
}

export function TavharcFegyverCard({ index, isActive, karakter: k, data, idea, fortélyCÉ, gyorsaság, gyorsÚjratöltésFok, onSelect, onMfTarget, onDeleteTarget, onIdeaPopup }: Props) {
  const tf = k.távfegyverek[index];
  const konstansok = data.konstansok;
  const céAlap = konstansok.harcérték_alap.CÉ;
  const def = data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tf.alap.toLowerCase());
  const hmNév = def?.Harcmodor ?? 'Hajítás';
  const hmSzint = k.képzettségek.find(kp => kp.név === hmNév)?.szint ?? 0;
  const hmCÉ = data.harcmodorBonusz.find(b => b.szint === hmSzint)?.CÉ ?? -9;
  const fCÉ = parseInt(def?.CÉ ?? '0') || 0;
  const mf = getMfFok(k, tf.alap);
  const mfC = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mf)?.CÉ ?? 0;
  const inp = getCÉInputs(k, def, idea);
  const cardCÉ = calcCÉ({ céAlap, önuralom: inp.önuralom, CM: inp.CM, harcmodorCÉ: hmCÉ, fegyverCÉ: fCÉ, mfCÉ: mfC, idea: inp.idea, fortélyCÉ });
  const sebesség = parseInt(def?.Sebesség ?? '-1') || -1;
  const tám = inp.isMágikus ? '—' : calcTámadásLabel({ harcmodorSzint: hmSzint, gyorsaság, sebesség, gyorsÚjratöltésFok, konstansok });
  const hasError = mfKövetelményHiba(k, data, tf.alap);

  return (
    <div className={`th-card${isActive ? ' th-card-active' : ''}`} onClick={onSelect}>
      <div className="th-card-header">
        <strong>{tf.alap}</strong>
        <button className="fort-delete" onClick={e => { e.stopPropagation(); onDeleteTarget(); }}>✕</button>
      </div>
      <div className="th-card-fields">
        <button className={`he-field-btn he-field-fortely${hasError ? ' th-mf-error' : ''}`}
          onClick={e => { e.stopPropagation(); onMfTarget(); }}>
          MF fok: <strong>{mf}</strong>
          {hasError && <span className="he-mf-error">{mfKövetelményText(k, data, tf.alap)}</span>}
        </button>
        {!inp.isMágikus && (
          <button className="he-field-btn" onClick={e => { e.stopPropagation(); onIdeaPopup(); }}>
            Idea: <strong>{idea >= 0 ? '+' : ''}{idea}</strong>
          </button>
        )}
        <span className="th-badge">CÉ: {cardCÉ}  ({tám})</span>
      </div>
    </div>
  );
}
