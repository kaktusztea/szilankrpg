import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from '../harc/shared';

interface Props {
  data: GameData;
  karakter: Karakter;
  pajzsFok: number;
  onPajzsPopup: (popup: string) => void;
}

export function PajzsSection({ data, karakter: k, pajzsFok, onPajzsPopup }: Props) {
  const pajzsChip = (() => {
    const pNév = buildPajzsFegyverNév(k);
    if (!pNév) return null;
    const pd = lookupFegyver(data.fegyverek, pNév);
    if (!pd) return null;
    const mf = data.konstansok.mesterfegyver_bónuszok?.find((b: { fok: number }) => b.fok === pajzsFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    // Inactive: pajzs not sole weapon — TÉ/SP/Sebesség struck through
    const inactive = !(k.session.fegyverfogás === 'egyfegyveres' && k.session.aktív_fegyver_index === -2);
    const cls = inactive ? ' he-strike' : '';
    const vé = (parseInt(pd.VÉ) || 0) + mf.VÉ;
    const té = (parseInt(pd.TÉ) || 0) + mf.TÉ;
    const sp = (parseInt(pd.SP) || 0) + mf.SP;
    return (
      <div className="he-fegyver-fields he-fegyver-chip-mb">
        <span className="he-field-btn he-field-indicator">
          <span className="he-stat-label">VÉ:</span>
          <span>{vé}</span>
          {' '}<span className={`he-stat-ml${cls}`}>TÉ:</span>
          <span className={cls}>{té}</span>
          {' '}<span className={`he-stat-ml${cls}`}>SP:</span>
          <span className={cls}>{sp}</span>
          {' '}<span className={`he-stat-ml${cls}`}>Sebesség:</span>
          <span className={cls}>{pd.Sebesség}</span>
        </span>
      </div>
    );
  })();

  return (
    <section className="he-section">
      <h3>Pajzs</h3>
      {pajzsChip}
      <div className="he-fegyver-fields">
        <button className="he-field-btn" onClick={() => onPajzsPopup('méret')}>Méret: <strong>{k.pajzs.méret || '— nincs —'}</strong></button>
        <button className="he-field-btn he-field-fortely" onClick={() => onPajzsPopup('pajzshasználat')}>Pajzshasználat fok: <strong>{pajzsFok}</strong></button>
      </div>
    </section>
  );
}
