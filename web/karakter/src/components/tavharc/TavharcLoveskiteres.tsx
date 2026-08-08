import { useState, useCallback } from 'react';
import type { Karakter, TavfegyverAlap } from '../../engine/types';
import type { KonstansokRaw } from '../../engine/data-types';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { MAX_TÁVOLSÁG_MÉTER } from '../../ui-constants';
import { PopupOverlay } from '../PopupOverlay';
import { rollK10 } from '../../engine/dice';
import { weaponToLöveskitérésKategória, parseHatótáv, calcLöveskitérésCélszám, calcAkrobatikaÉrték } from './helpers';

interface Props {
  karakter: Karakter;
  konstansok: KonstansokRaw;
  tavfegyverek: TavfegyverAlap[];
}

/** Egy választható bejövő fegyver / kategória a lövéskitéréshez. */
interface LKOpció { név: string; kategória: string | null; hatótáv: number; separator?: boolean }

// A lista tetején rögzített (gyakori) fegyverek ebben a sorrendben.
const KIEMELT = ['Hajítótőr', 'Rövid íj', 'Hosszú íj', 'Nyílpuska'];

function buildOpciók(tavfegyverek: TavfegyverAlap[]): LKOpció[] {
  const all = tavfegyverek.filter(f => !f.Fegyver.startsWith('🔆'));
  const mágikus = all.filter(f => f.Kategória === 'mágikus')
    .sort((a, b) => a.Fegyver.localeCompare(b.Fegyver, 'hu'))
    .map(f => ({ név: f.Fegyver, kategória: weaponToLöveskitérésKategória(f), hatótáv: parseHatótáv(f.Hatótáv) }));

  const nemMágikus = all.filter(f => f.Kategória !== 'mágikus');
  const kiemelt = nemMágikus
    .filter(f => KIEMELT.includes(f.Fegyver))
    .sort((a, b) => KIEMELT.indexOf(a.Fegyver) - KIEMELT.indexOf(b.Fegyver))
    .map(f => ({ név: f.Fegyver, kategória: weaponToLöveskitérésKategória(f), hatótáv: parseHatótáv(f.Hatótáv) }));

  const maradék = nemMágikus
    .filter(f => !KIEMELT.includes(f.Fegyver))
    .sort((a, b) => a.Fegyver.localeCompare(b.Fegyver, 'hu'))
    .map(f => ({ név: f.Fegyver, kategória: weaponToLöveskitérésKategória(f), hatótáv: parseHatótáv(f.Hatótáv) }));

  // Improvizált 🔆 tárgyak a data-ból (Erő-függő hatótáv → nincs range-gát).
  const improv = tavfegyverek
    .filter(f => f.Fegyver.startsWith('🔆'))
    .map(f => ({ név: f.Fegyver, kategória: weaponToLöveskitérésKategória(f), hatótáv: Infinity }));

  // Separatorok a csoportok között.
  const result: LKOpció[] = [...kiemelt];
  if (mágikus.length > 0) {
    result.push({ név: '__sep1__', kategória: null, hatótáv: 0, separator: true });
    result.push(...mágikus);
  }
  if (maradék.length > 0) {
    result.push({ név: '__sep2__', kategória: null, hatótáv: 0, separator: true });
    result.push(...maradék);
  }
  result.push({ név: '__sep3__', kategória: null, hatótáv: 0, separator: true });
  result.push({ név: '🔆 Korlátosan alkalmas fegyver', kategória: 'korlátosan_alkalmas', hatótáv: Infinity });
  result.push(...improv);

  return result;
}

/**
 * Önálló, védekező Lövéskitérés eszköz (md/073, kategóriák md/078). A karakter a
 * CÉLPONT: saját Akrobatikájával tér ki egy BEJÖVŐ fegyver lövése elől. A célszám a
 * fegyver kategóriájából (Osztó) + távolságból, a „hatótávon kívül" a fegyver Hatótávjából.
 */
export function TavharcLoveskiteres({ karakter, konstansok, tavfegyverek }: Props) {
  const [sel, setSel] = useState<LKOpció | null>(null);
  const [távolság, setTávolság] = useState(5);
  const [dobás, setDobás] = useState<{ k10: number; siker: boolean } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const opciók = buildOpciók(tavfegyverek);
  const hatótávonKívül = !!sel && távolság > sel.hatótáv;
  const célszám = (sel && sel.kategória && !hatótávonKívül)
    ? calcLöveskitérésCélszám(konstansok.lövéskitérés[sel.kategória], távolság)
    : null;
  const akrobatika = calcAkrobatikaÉrték(karakter);
  // Lehetetlen: még a max k10 (10) dobással sem érhető el a célszám.
  const lehetetlen = célszám !== null && akrobatika + 10 < célszám;

  const step = useCallback((dir: 1 | -1) => {
    setTávolság(v => Math.max(1, Math.min(MAX_TÁVOLSÁG_MÉTER, v + dir)));
  }, []);
  const { holdProps } = useHoldRepeat(step);

  const kitérés = () => {
    if (célszám === null) return;
    const k10 = rollK10();
    setDobás({ k10, siker: akrobatika + k10 >= célszám });
  };

  return (
    <div className="th-picker th-lk-box">
      <div className="th-picker-label">Lövéskitérés</div>

      <button className={`he-field-btn th-lk-kat-btn${sel ? '' : ' th-lk-kat-btn-empty'}`} onClick={() => setShowPicker(true)}>
        <strong>{sel?.név ?? 'Bejövő fegyver'}</strong>
      </button>

      <div className="th-lk-tav">
        <button className="fort-fok-btn th-lk-tav-btn" onClick={() => step(-1)} {...holdProps(-1)}>−</button>
        <span className="th-lk-tav-value">{távolság}m</span>
        <button className="fort-fok-btn th-lk-tav-btn" onClick={() => step(1)} {...holdProps(1)}>+</button>
      </div>

      <div className="th-lk-info">
        <span className="th-lk-akrobatika">Akrobatika+Gyorsaság: <strong>{akrobatika}</strong></span>
        {!sel
          ? <span className="th-lk-hint">Válassz bejövő fegyvert</span>
          : hatótávonKívül
            ? <span className="th-lk-outofrange">hatótávon kívül vagy</span>
            : <span className="th-lk-celszam">Célszám: <strong>{célszám}</strong></span>}
      </div>

      <div className="th-lk-actions">
        {lehetetlen ? (
          <div className="th-lk-lehetetlen">Lehetetlen</div>
        ) : (
          <button className="th-lk-kiteres-btn" onClick={kitérés} disabled={célszám === null}>Kitérés</button>
        )}
      </div>

      {showPicker && (
        <PopupOverlay onClose={() => setShowPicker(false)}>
          <div className="th-fegyver-picker">
            {opciók.map(o => o.separator ? (
              <hr key={o.név} className="th-fegyver-picker-sep" />
            ) : (
              <button
                key={o.név}
                className={`th-fegyver-picker-item${o.név === sel?.név ? ' th-fegyver-picker-active' : ''}`}
                onClick={() => { setSel(o); setShowPicker(false); }}
              >
                {o.név}
              </button>
            ))}
          </div>
        </PopupOverlay>
      )}

      {dobás !== null && célszám !== null && (
        <PopupOverlay onClose={() => setDobás(null)}>
          <div className="ke-dobas-popup">
            <div className="ke-dobas-header">Lövéskitérés</div>
            <div className="ke-dobas-result">
              {akrobatika + dobás.k10}<span className="th-lk-vs"> vs </span><span className="th-lk-celszam-num">{célszám}</span>
            </div>
            <div className="ke-dobas-detail">Akrobatika+Gyorsaság ({akrobatika}) + k10 ({dobás.k10})</div>
            <div className={dobás.siker ? 'th-lk-siker' : 'th-lk-sikertelen'}>
              {dobás.siker ? 'Siker — kitértél!' : 'Sikertelen — a lövész jöhet'}
            </div>
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
