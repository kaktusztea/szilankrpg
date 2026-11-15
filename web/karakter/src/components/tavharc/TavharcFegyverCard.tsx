import { Ikon } from '../common/Ikon';
import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { calcCÉBontás, calcTámadásLabel, getFortélyCÉ, calcTávSP } from './helpers';
import { getMfFok, mfKövetelményHiba, mfKövetelményText } from './mesterfegyver-calc';
import { lookupTávfegyver } from '../../engine/lookup';
import { SP_NINCS } from '../../engine/data-types';
import { FokPottyok } from '../common/FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

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
  const def = lookupTávfegyver(data.tavfegyverek, tf.alap);

  // Per-fegyver CÉ-Idea delta (Modell 2, spec §17: az Idea 1:1 a CÉ-hez). A v2 CÉ a idea_default-ot
  // MÁR tartalmazza, ezért a példány Ideájának a default-tól való ELTÉRÉSE módosít.
  const ideaDelta = tf.idea - (def?.idea_default ?? 0);
  const fortélyCÉ = getFortélyCÉ(k, data, session, tf.alap);
  const bontás = calcCÉBontás(k, data, session, def, ideaDelta, fortélyCÉ, tf.alap);
  const mf = getMfFok(k, tf.alap);
  const sebesség = def?.Sebesség ?? -1;
  const tám = bontás.isMágikus ? '-' : calcTámadásLabel({ harcmodorSzint: bontás.harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás: konstansok.nyílpuska_alap_támadás });
  const hasError = mfKövetelményHiba(k, data, tf.alap);

  const spÉrték = def?.SP === SP_NINCS ? '-' : calcTávSP(k, data, def, tf.alap).sp;

  return (
    // Compact card like the Harcértékek weapon cards; tapping the card selects the active ranged weapon
    <div className={`th-card${isActive ? ' th-card-active' : ''}`} onClick={onSelect}>
      <div className="he-fegyver-header">
        <div className="he-fegyver-cim">
          <div className="he-fegyver-nev">
            {tf.alap}
            <span onClick={e => e.stopPropagation()}>
              <FokPottyok név="MF fok" fok={mf} max={MAX_FORTÉLY_FOK} hiba={hasError} onClick={onMfTarget} />
            </span>
          </div>
          {!bontás.isMágikus && <div className="he-fegyver-alcim">Idea {tf.idea >= 0 ? '+' : ''}{tf.idea}</div>}
          {hasError && <span className="he-mf-error">{mfKövetelményText(k, data, tf.alap)}</span>}
        </div>
        <div className="he-fegyver-ikonok" onClick={e => e.stopPropagation()}>
          {!bontás.isMágikus && (
            <button type="button" className="he-ikon-btn" title="Idea" aria-label="Idea szerkesztése" onClick={onIdeaPopup}><Ikon név="szerkeszt" /></button>
          )}
          <button type="button" className="he-ikon-btn" title="Törlés" aria-label="Törlés" onClick={onDeleteTarget}><Ikon név="bezár" /></button>
        </div>
      </div>
      <div className="he-stat-sor">
        <div className="he-stat-fo">
          CÉ <b>{bontás.cé}</b>
          <span className="he-stat-sep"> · </span>Támadás <b>{tám}</b>
          <span className="he-stat-sep"> · </span>SP <b>{spÉrték}</b>
        </div>
      </div>
    </div>
  );
}
