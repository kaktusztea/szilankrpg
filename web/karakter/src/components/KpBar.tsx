import { useMemo, useState } from 'react';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { calcKpDetails } from './kp-calc';
import { KpInfoPopup } from './KpInfoPopup';
import { PopupOverlay } from './PopupOverlay';
import './KpBar.css';

interface Props {
  data: GameData;
  karakter: Karakter;
}

export function KpBar({ data, karakter }: Props) {
  const [showPopup, setShowPopup] = useState(false);
  const kp = useMemo(() => calcKpDetails(data, karakter), [data, karakter]);

  return (
    <>
      <div className="kp-bar" onClick={() => setShowPopup(true)} style={{ cursor: 'pointer' }}>
        <span className={kp.maradékKp < 0 ? 'kp-section-neg' : 'kp-section-ok'}>
          Maradt KP: {kp.maradékKp}
        </span>
        <span className={kp.primerMaradt < 0 ? 'kp-section-neg' : 'kp-section-ok'}>
          Primer keret: {kp.primerMaradt}
        </span>
      </div>

      {showPopup && (
        <PopupOverlay onClose={() => setShowPopup(false)}>
          <KpInfoPopup
            kp={kp}
            tsz={karakter.tsz}
            intelligencia={karakter.tulajdonságok.intelligencia}
            emlékezet={karakter.tulajdonságok.emlékezet}
            perszint={data.konstansok.kp.perszint}
            szekunderPerszint={data.konstansok.kp.szekunder_perszint}
          />
        </PopupOverlay>
      )}
    </>
  );
}
