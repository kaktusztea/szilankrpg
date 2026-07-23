import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from '../harc/shared';
import { FegyverChip } from './HarcertekekFegyverChip';

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
    const isInactive = k.session.fegyverfogás !== 'egyfegyveres' || k.session.aktív_fegyver_index !== -2;
    return <FegyverChip fd={pd} mfFok={pajzsFok} idea={0} konstansok={data.konstansok} inactive={isInactive} />;
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
