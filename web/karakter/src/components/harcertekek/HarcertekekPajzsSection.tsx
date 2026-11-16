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
    // The shield's VÉ always counts; TÉ / SP / Sebesség only when it is the sole weapon (Egyfegyveres - Pajzs).
    // Otherwise they move to a small, faded "fegyverként:" line under the VÉ.
    const fegyverként = k.session.fegyverfogás === 'egyfegyveres' && k.session.aktív_fegyver_index === -2;
    const sep = <span className="he-stat-sep"> · </span>;
    return (
      <div className="he-stat-sor">
        {fegyverként ? (
          <div>
            VÉ <b>{mód.VÉ + mf.VÉ}</b>{sep}TÉ <b>{mód.TÉ + mf.TÉ}</b>{sep}SP <b>{mód.SP + mf.SP}</b>{sep}Sebesség <b>{mód.Sebesség ?? '-'}</b>
          </div>
        ) : (
          <>
            <div>VÉ <b>{mód.VÉ + mf.VÉ}</b></div>
            <div className="he-stat-halvany">
              fegyverként: TÉ {mód.TÉ + mf.TÉ} · SP {mód.SP + mf.SP} · Sebesség {mód.Sebesség ?? '-'}
            </div>
          </>
        )}
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
