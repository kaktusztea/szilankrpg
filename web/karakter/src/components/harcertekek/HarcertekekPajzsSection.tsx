import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';
import { FegyverChip } from './HarcertekekFegyverChip';

interface Props {
  data: GameData;
  karakter: Karakter;
  pajzsFok: number;
  onPajzsPopup: (popup: string) => void;
  showHint: (msg: string) => void;
}

export function PajzsSection({ data, karakter: k, pajzsFok, onPajzsPopup, showHint }: Props) {
  const pajzsChip = (() => {
    if (!k.pajzs.méret) return null;
    const pNév = k.pajzs.méret.charAt(0).toUpperCase() + k.pajzs.méret.slice(1) + ' Pajzs';
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
        <span className="he-field-btn he-field-indicator" onClick={() => showHint('A pajzs kézben állapotot az Aktív fülön állíthatod!')}>
          Kézben, fegyver mellett: <strong>{k.session.aktív_pajzs ? 'igen' : 'nem'}</strong>
        </span>
      </div>
    </section>
  );
}
