import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { buildPajzsFegyverNév } from '../../engine/utils';
import { elsődlegesMód } from '../../engine/harc/fegyver-calc';
import { lookupFegyver } from '../../engine/lookup';
import { Ikon } from '../common/Ikon';
import { FokPottyok } from '../common/FokPottyok';
import { MAX_FORTÉLY_FOK } from '../../ui-constants';

interface Props {
  data: GameData;
  karakter: Karakter;
  pajzsFok: number;
  onPajzsPopup: (popup: string) => void;
}

export function PajzsSection({ data, karakter: k, pajzsFok, onPajzsPopup }: Props) {
  const pNév = buildPajzsFegyverNév(k);
  const pd = pNév ? lookupFegyver(data.fegyverek, pNév) : undefined;
  const pajzsDots = <FokPottyok név="Pajzshasználat fok" fok={pajzsFok} max={MAX_FORTÉLY_FOK} onClick={() => onPajzsPopup('pajzshasználat')} />;

  const statok = (() => {
    if (!pd) return null;
    const mód = elsődlegesMód(pd);
    const mf = data.konstansok.mesterfegyver_bónuszok?.find((b: { fok: number }) => b.fok === pajzsFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    // Inactive: shield not the sole weapon → TÉ / SP / Sebesség struck through (VÉ always counts)
    const inactive = !(k.session.fegyverfogás === 'egyfegyveres' && k.session.aktív_fegyver_index === -2);
    const cls = inactive ? 'he-strike' : undefined;
    return (
      <div className="he-stat-sor">
        <div>
          VÉ <b>{mód.VÉ + mf.VÉ}</b>
          <span className="he-stat-sep"> · </span><span className={cls}>TÉ <b>{mód.TÉ + mf.TÉ}</b></span>
          <span className="he-stat-sep"> · </span><span className={cls}>SP <b>{mód.SP + mf.SP}</b></span>
          <span className="he-stat-sep"> · </span><span className={cls}>Sebesség <b>{mód.Sebesség ?? '-'}</b></span>
        </div>
      </div>
    );
  })();

  return (
    <section className="he-section">
      <h3>Pajzs</h3>
      {/* Compact card like the weapon / armour cards: title + Pajzshasználat dots, edit = size picker */}
      <div className="he-fegyver-card">
        <div className="he-fegyver-header">
          <div className="he-fegyver-cim">
            <div className={`he-fegyver-nev${pNév ? '' : ' he-nincs'}`}>{pNév ?? 'Nincs pajzs'}{pajzsDots}</div>
          </div>
          {pNév && (
            <div className="he-fegyver-ikonok">
              <button type="button" className="he-ikon-btn" title="Méret" aria-label="Pajzs méret" onClick={() => onPajzsPopup('méret')}><Ikon név="szerkeszt" /></button>
            </div>
          )}
        </div>
        {pNév ? statok : <button type="button" className="he-add-select" onClick={() => onPajzsPopup('méret')}>+ Pajzs választása...</button>}
      </div>
    </section>
  );
}
