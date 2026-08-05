import { useState, useCallback } from 'react';
import type { Karakter } from '../../engine/types';
import type { KonstansokRaw } from '../../engine/data-types';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { MAX_TÁVOLSÁG_MÉTER } from '../../ui-constants';
import { PopupOverlay } from '../PopupOverlay';
import { LÖVÉSKITÉRÉS_KATEGÓRIÁK, calcLöveskitérésCélszám, calcAkrobatikaÉrték } from './helpers';

interface Props {
  karakter: Karakter;
  konstansok: KonstansokRaw;
  defaultKategória: string;
}

/**
 * Önálló, védekező Lövéskitérés eszköz (md/073). A karakter a CÉLPONT: a saját
 * Akrobatikájával tér ki egy bejövő lövés elől. A bejövő fegyver kategóriáját és
 * a távolságot a box maga állítja (független a fül kimenő lövés-kalkulátorától).
 */
export function TavharcLoveskiteres({ karakter, konstansok, defaultKategória }: Props) {
  const [kategória, setKategória] = useState(defaultKategória);
  const [távolság, setTávolság] = useState(5);
  const [dobás, setDobás] = useState<{ k10: number; siker: boolean } | null>(null);
  const [showKatPicker, setShowKatPicker] = useState(false);

  const kategóriaLabel = LÖVÉSKITÉRÉS_KATEGÓRIÁK.find(k => k.kulcs === kategória)?.label ?? '—';

  const célszám = calcLöveskitérésCélszám(konstansok.lövéskitérés[kategória], távolság);
  const akrobatika = calcAkrobatikaÉrték(karakter);

  const step = useCallback((dir: 1 | -1) => {
    setTávolság(v => Math.max(1, Math.min(MAX_TÁVOLSÁG_MÉTER, v + dir)));
  }, []);
  const { holdProps } = useHoldRepeat(step);

  const kitérés = () => {
    if (célszám === null) return;
    const k10 = Math.floor(Math.random() * 10) + 1;
    setDobás({ k10, siker: akrobatika + k10 >= célszám });
  };

  return (
    <div className="th-picker th-lk-box">
      <div className="th-picker-label">Lövéskitérés</div>

      <button className="he-field-btn th-lk-kat-btn" onClick={() => setShowKatPicker(true)}>
        <strong>{kategóriaLabel}</strong>
      </button>

      <div className="th-lk-tav">
        <button className="fort-fok-btn th-lk-tav-btn" onClick={() => step(-1)} {...holdProps(-1)}>−</button>
        <span className="th-lk-tav-value">{távolság}m</span>
        <button className="fort-fok-btn th-lk-tav-btn" onClick={() => step(1)} {...holdProps(1)}>+</button>
      </div>

      <div className="th-lk-info">
        {célszám !== null
          ? <span className="th-lk-celszam">Célszám: <strong>{célszám}</strong></span>
          : <span className="th-lk-outofrange">hatótávon kívül vagy</span>}
        <span className="th-lk-akrobatika">Akrobatika+Gyorsaság: {akrobatika}</span>
      </div>

      <div className="th-lk-actions">
        <button className="th-lk-kiteres-btn" onClick={kitérés} disabled={célszám === null}>Kitérés</button>
      </div>

      {showKatPicker && (
        <PopupOverlay onClose={() => setShowKatPicker(false)}>
          <div className="th-fegyver-picker">
            {LÖVÉSKITÉRÉS_KATEGÓRIÁK.map(k => (
              <button
                key={k.kulcs}
                className={`th-fegyver-picker-item${k.kulcs === kategória ? ' th-fegyver-picker-active' : ''}`}
                onClick={() => { setKategória(k.kulcs); setShowKatPicker(false); }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </PopupOverlay>
      )}

      {dobás !== null && célszám !== null && (
        <PopupOverlay onClose={() => setDobás(null)}>
          <div className="ke-dobas-popup">
            <div className="ke-dobas-header">Lövéskitérés</div>
            <div className="ke-dobas-result">{akrobatika + dobás.k10}</div>
            <div className="ke-dobas-detail">Akrobatika+Gyorsaság ({akrobatika}) + k10 ({dobás.k10}) — célszám {célszám}</div>
            <div className={dobás.siker ? 'th-lk-siker' : 'th-lk-sikertelen'}>
              {dobás.siker ? 'Siker — kitértél!' : 'Sikertelen — a lövész jöhet'}
            </div>
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
