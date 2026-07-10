import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getMfFok, mfKövetelményHiba, mfKövetelményText, calcCÉBontás, calcTámadásLabel, getFortélyCÉ } from './helpers';

interface Props {
  index: number;
  isActive: boolean;
  karakter: Karakter;
  session: Session;
  data: GameData;
  idea: number;
  gyorsaság: number;
  újratöltésEnyhítés: number;
  onSelect: () => void;
  onMfTarget: () => void;
  onDeleteTarget: () => void;
  onIdeaPopup: () => void;
}

export function TavharcFegyverCard({ index, isActive, karakter: k, session, data, idea, gyorsaság, újratöltésEnyhítés, onSelect, onMfTarget, onDeleteTarget, onIdeaPopup }: Props) {
  const tf = k.távfegyverek[index];
  const konstansok = data.konstansok;
  const def = data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tf.alap.toLowerCase());

  const fortélyCÉ = getFortélyCÉ(k, data, session, tf.alap);
  const bontás = calcCÉBontás(k, data, session, def, idea, fortélyCÉ, tf.alap);
  const mf = getMfFok(k, tf.alap);
  const sebesség = parseInt(def?.Sebesség ?? '-1') || -1;
  const tám = bontás.isMágikus ? '—' : calcTámadásLabel({ harcmodorSzint: bontás.harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás: konstansok.nyílpuska_alap_támadás });
  const hasError = mfKövetelményHiba(k, data, tf.alap);

  return (
    <div className={`th-card${isActive ? ' th-card-active' : ''}`} onClick={onSelect}>
      <div className="th-card-header">
        <strong>{tf.alap}</strong>
        <button className="item-delete" onClick={e => { e.stopPropagation(); onDeleteTarget(); }}>✕</button>
      </div>
      <div className="th-card-fields">
        <button className={`he-field-btn he-field-fortely${hasError ? ' th-mf-error' : ''}`}
          onClick={e => { e.stopPropagation(); onMfTarget(); }}>
          MF fok: <strong>{mf}</strong>
          {hasError && <span className="he-mf-error">{mfKövetelményText(k, data, tf.alap)}</span>}
        </button>
        {!bontás.isMágikus && (
          <button className="he-field-btn" onClick={e => { e.stopPropagation(); onIdeaPopup(); }}>
            Idea: <strong>{idea >= 0 ? '+' : ''}{idea}</strong>
          </button>
        )}
        <span className="th-badge">CÉ: {bontás.cé}  ({tám})</span>
      </div>
    </div>
  );
}
