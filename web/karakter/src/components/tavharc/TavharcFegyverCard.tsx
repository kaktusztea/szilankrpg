import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { getMfFok, mfKövetelményHiba, mfKövetelményText, calcCÉBontás, calcTámadásLabel, getFortélyCÉ } from './helpers';

interface Props {
  index: number;
  isActive: boolean;
  karakter: Karakter;
  session: Session;
  data: GameData;
  gyorsaság: number;
  újratöltésEnyhítés: number;
  onSelect: () => void;
  onMfTarget: () => void;
  onDeleteTarget: () => void;
  onIdeaPopup: () => void;
}

export function TavharcFegyverCard({ index, isActive, karakter: k, session, data, gyorsaság, újratöltésEnyhítés, onSelect, onMfTarget, onDeleteTarget, onIdeaPopup }: Props) {
  const tf = k.távfegyverek[index];
  const konstansok = data.konstansok;
  const def = data.tavfegyverek.find(d => d.név.toLowerCase() === tf.alap.toLowerCase());

  // Per-fegyver CÉ-Idea delta (Modell 2, spec §17: az Idea 1:1 a CÉ-hez). A v2 CÉ a idea_default-ot
  // MÁR tartalmazza, ezért a példány Ideájának a default-tól való ELTÉRÉSE módosít.
  const ideaDelta = tf.idea - (def?.idea_default ?? 0);
  const fortélyCÉ = getFortélyCÉ(k, data, session, tf.alap);
  const bontás = calcCÉBontás(k, data, session, def, ideaDelta, fortélyCÉ, tf.alap);
  const mf = getMfFok(k, tf.alap);
  const sebesség = def?.Sebesség ?? -1;
  const tám = bontás.isMágikus ? '-' : calcTámadásLabel({ harcmodorSzint: bontás.harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás: konstansok.nyílpuska_alap_támadás });
  const hasError = mfKövetelményHiba(k, data, tf.alap);

  return (
    <div className={`th-card${isActive ? ' th-card-active' : ''}`} onClick={onSelect}>
      <div className="th-card-header">
        <strong>{tf.alap}</strong>
        <button className="item-delete" onClick={e => { e.stopPropagation(); onDeleteTarget(); }}>✕</button>
      </div>
      <div className="he-fegyver-fields he-fegyver-chip-mb">
        <span className="he-field-btn he-field-indicator">
          <span className="he-stat-label">CÉ:</span>
          <span>{bontás.cé}</span>
          {' '}<span className="he-stat-ml">({tám})</span>
        </span>
      </div>
      <div className="th-card-fields">
        <button className={`he-field-btn he-field-fortely${hasError ? ' th-mf-error' : ''}`}
          onClick={e => { e.stopPropagation(); onMfTarget(); }}>
          MF fok: <strong>{mf}</strong>
          {hasError && <span className="he-mf-error">{mfKövetelményText(k, data, tf.alap)}</span>}
        </button>
        {!bontás.isMágikus && (
          <button className="he-field-btn" onClick={e => { e.stopPropagation(); onIdeaPopup(); }}>
            Idea: <strong>{tf.idea >= 0 ? '+' : ''}{tf.idea}</strong>
          </button>
        )}
      </div>
    </div>
  );
}
