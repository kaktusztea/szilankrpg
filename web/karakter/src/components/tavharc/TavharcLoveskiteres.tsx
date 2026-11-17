import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { rollK10 } from '../../engine/dice';
import { probaSiker } from '../../engine/proba/proba-common';
import { calcAkrobatikaÉrték, lövéskitérésEsély as esély } from './loveskiteres-calc';

interface Props {
  karakter: Karakter;
  data: GameData;
}

// Incoming-weapon categories (konstansok.lövéskitérés keys, md/078: decided by the Osztó).
const KATEGÓRIÁK: { kulcs: string; rövid: string; teljes: string }[] = [
  { kulcs: 'nem_alkalmas_tárgyak', rövid: 'Tárgy', teljes: 'Dobásra nem alkalmas tárgy' },
  { kulcs: 'korlátosan_alkalmas', rövid: 'Korl.', teljes: 'Korlátosan alkalmas fegyver' },
  { kulcs: 'dobófegyverek', rövid: 'Dobó', teljes: 'Dobófegyver' },
  { kulcs: 'íjak', rövid: 'Íj', teljes: 'Íj' },
  { kulcs: 'nyílpuskák', rövid: 'Nyílp.', teljes: 'Nyílpuska' },
];

/**
 * Önálló, védekező Lövéskitérés eszköz (md/073, kategóriák md/078). A karakter a
 * CÉLPONT: saját Akrobatikájával tér ki egy BEJÖVŐ lövés elől. Kategória-chip + távsáv-skála
 * (a célszámot csak a kategória és a táv-sáv dönti el); minden sáv mutatja a célszámot és az esélyt.
 */
export function TavharcLoveskiteres({ karakter, data }: Props) {
  const [kat, setKat] = useState<string | null>(null);
  const [sávIdx, setSávIdx] = useState<number | null>(null);
  const [dobás, setDobás] = useState<{ k10: number; siker: boolean } | null>(null);

  const akrobatika = calcAkrobatikaÉrték(karakter, data);
  const sávok = kat ? (data.konstansok.lövéskitérés[kat] ?? []) : [];
  const sáv = sávIdx !== null ? sávok[sávIdx] : undefined;
  const célszám = sáv?.célszám ?? null;
  const p = célszám !== null ? esély(akrobatika, célszám) : null;

  const választKat = (k: string) => { setKat(k); setSávIdx(null); };
  const kitérés = () => {
    if (célszám === null) return;
    const k10 = rollK10();
    setDobás({ k10, siker: probaSiker(akrobatika, k10, célszám) });
  };

  return (
    <div className="th-picker th-lk-box">
      <div className="th-lk-fejlec">
        <span className="th-picker-label">Lövéskitérés</span>
        <span className="th-lk-akrobatika">Akrob+Gy <strong>{akrobatika}</strong></span>
      </div>

      <div className="th-lk-chipek" role="group" aria-label="Bejövő fegyver">
        {KATEGÓRIÁK.map(k => (
          <button key={k.kulcs} type="button" title={k.teljes} aria-pressed={kat === k.kulcs}
            className={`th-lk-chip${kat === k.kulcs ? ' active' : ''}`} onClick={() => választKat(k.kulcs)}>
            {k.rövid}
          </button>
        ))}
      </div>

      {kat === null ? (
        <div className="th-lk-hint">Válassz bejövő fegyvert</div>
      ) : (
        <div className="th-lk-sav" role="group" aria-label="Távolság">
          {sávok.map((s, i) => {
            const e = esély(akrobatika, s.célszám);
            const szín = e < 0.3 ? 'rossz' : e > 0.7 ? 'jo' : 'kozepes';
            return (
              <button key={s.max_táv} type="button" aria-pressed={sávIdx === i}
                className={`th-lk-sav-cella ${szín}${sávIdx === i ? ' active' : ''}`} onClick={() => setSávIdx(i)}>
                <span className="th-lk-sav-tav">≤{s.max_táv}{i === 0 ? 'm' : ''}</span>
                <strong>{s.célszám}</strong>
                <span className="th-lk-sav-esely">{Math.round(e * 100)}%</span>
              </button>
            );
          })}
        </div>
      )}

      {p === 0 ? (
        <div className="th-lk-lehetetlen">Lehetetlen</div>
      ) : (
        <button className="th-lk-kiteres-btn" onClick={kitérés} disabled={célszám === null}>
          {célszám === null ? (kat ? 'Válassz távot' : 'Kitérés') : <>Kitérés <span className="th-lk-kiteres-esely">· {Math.round((p ?? 0) * 100)}%</span></>}
        </button>
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
              {dobás.siker ? 'Siker - kitértél!' : 'Sikertelen - a lövész jöhet'}
            </div>
          </div>
        </PopupOverlay>
      )}
    </div>
  );
}
