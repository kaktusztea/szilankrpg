import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import type { PróbaKonstansok } from '../../engine/data-types';
import { előnyHátrányLabel, ELŐNY_HÁTRÁNY_SZINTEK, probaLehetetlen, probaBiztosSiker, tulLabel } from './proba-common';
import { useProbaDobas } from './useProbaDobas';
import { ProbaFejlec, ExtraGomb, ProbaEredmeny, CelszamGomb, SzitChipFelirat } from './ProbaReszek';

interface Props {
  tulajdonságNév: string;
  érték: number;
  /** konstansok.próba (célszámok, kocka, összetett / kiemelt paraméterek). */
  próba: PróbaKonstansok;
  /** Felszerelés-túlterhelés Hátrány (Fizikai tulajdonságnál) - a dobás alap EH-ja. */
  felszEH?: number;
  felszNemHarcol?: boolean;
  /** Fortély szituációs bónuszai (kapcsolható, alapból ki - a helyzetet a játékos/KM dönti el). */
  fortélyBónuszok?: { érték: number; leírás: string }[];
  onClose: () => void;
}

/**
 * Tulajdonságpróba dobás popup (Játék mód): Tulajdonság + k6 vs célszám (§37.1).
 * Extrák szekció: Előny/Hátrány, Összetett próba, Fortélyok, Ellenpróba.
 */
export function TulajdonsagProbaPopup({ tulajdonságNév, érték: tulÉrték, próba, felszEH = 0, felszNemHarcol = false, fortélyBónuszok = [], onClose }: Props) {
  const p = próba.tulajdonság;
  // Bekapcsolt fortély-bónuszok: a dobás alapértékéhez adódnak.
  const [bónuszBe, setBónuszBe] = useState<boolean[]>(() => fortélyBónuszok.map(() => false));
  const bónusz = fortélyBónuszok.reduce((s, b, i) => s + (bónuszBe[i] ? b.érték : 0), 0);
  const érték = tulÉrték + bónusz;
  const [nehézség, setNehézség] = useState<number | null>(null);
  // Helyzetfüggő módosítók (fortély-bónuszok) külön picker popupban - a képzettségpróba mintájára.
  const [szitNyitva, setSzitNyitva] = useState(false);
  // A felszerelés-túlterhelés Hátránya a dobás alap EH-ja (a KM felülírhatja).
  const [ehSzint, setEhSzint] = useState(felszEH);
  const [összetettDb, setÖsszetettDb] = useState(0);
  const [ellenpróba, setEllenpróba] = useState(false);

  const d = useProbaDobas({ bázis: érték, ehSzint, kocka: p.kocka, nehézség, összetettDb, másodlagosLevonás: p.másodlagos_levonás });
  const ismeretlen = nehézség === -1;
  const kész = ellenpróba || nehézség !== null;
  const vanCélszám = !ellenpróba && !ismeretlen && nehézség !== null;
  const lehetetlen = vanCélszám && probaLehetetlen(érték, p.kocka, nehézség);
  const biztosSiker = vanCélszám && !lehetetlen && probaBiztosSiker(érték, nehézség);
  const ehCímke = előnyHátrányLabel(ehSzint);
  const label = tulLabel(tulajdonságNév);
  /** Állapotváltás az Extrákban / célszámban → a korábbi dobás érvénytelen. */
  const váltás = (f: () => void) => () => { f(); d.reset(); };

  return (
    <PopupOverlay onClose={onClose}>
      <div className="kep-proba-popup">
        <ProbaFejlec cím="Tulajdonságpróba" vanEredmény={d.vanEredmény} onReset={d.reset} onClose={onClose} />
        <div className="kep-proba-subtitle">{label} ({tulÉrték}){bónusz ? ` + ${bónusz} (fortély)` : ''}</div>

        {(felszEH < 0 || felszNemHarcol) && (
          <div className="kep-proba-felsz-warn">
            ⚠ Felszerelés túlterhelés: Hátrány{felszEH} (Fizikai próba)
            {felszNemHarcol && ' - automatikus kudarc / nem tud harcolni'}
          </div>
        )}

        <div className="kep-proba-neh-list">
          <CelszamGomb aktív={ellenpróba} disabled={összetettDb > 0}
            onClick={váltás(() => { setEllenpróba(!ellenpróba); if (!ellenpróba) setÖsszetettDb(0); })}>
            <span className="kep-proba-rejtett-label">Ellenpróba</span>
          </CelszamGomb>
          {!ellenpróba && (<>
            <CelszamGomb aktív={ismeretlen} onClick={váltás(() => setNehézség(-1))}>
              <span className="kep-proba-rejtett-label">Rejtett célszám</span>
            </CelszamGomb>
            {p.nehézségek.map(n => (
              <CelszamGomb key={n.érték} aktív={nehézség === n.érték} onClick={váltás(() => setNehézség(n.érték))}>
                {n.érték} ({n.név})
              </CelszamGomb>
            ))}
          </>)}
        </div>

        {fortélyBónuszok.length > 0 && !d.vanEredmény && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn kep-proba-kit-flash" onClick={() => setSzitNyitva(true)}>
              <SzitChipFelirat összeg={bónusz} />
            </button>
          </div>
        )}

        {!d.vanEredmény && (
          <div className="kep-proba-extras-flat">
            <div className="kep-proba-eh-row">
              {ELŐNY_HÁTRÁNY_SZINTEK.map(e => (
                <ExtraGomb key={e.szint} aktív={ehSzint === e.szint} onClick={váltás(() => setEhSzint(e.szint))}>
                  {e.szint === 0 ? '-' : e.szint > 0 ? `E+${e.szint}` : `H${e.szint}`}
                </ExtraGomb>
              ))}
            </div>
            <div className="kep-proba-osszetett-row">
              {Array.from({ length: próba.összetett_max_másodlagos }, (_, i) => i + 1).map(n => (
                <ExtraGomb key={n} aktív={összetettDb === n} disabled={ellenpróba} title="Másodlagos próbák száma"
                  onClick={() => { setÖsszetettDb(összetettDb === n ? 0 : n); d.reset(); }}>+{n}M</ExtraGomb>
              ))}
            </div>
          </div>
        )}

        {!d.vanEredmény ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                {vanCélszám
                  ? <>{érték} <span className="kep-proba-vs">vs</span> <span className="kep-proba-celszam">{nehézség}</span></>
                  : <>{érték} + k{p.kocka}</>}
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <div className="dobas-btn-row">
                <button type="button" className="kep-proba-roll-btn" disabled={!kész} onClick={d.dob}>
                  Dobás (k{p.kocka})
                  {ehCímke && (
                    <span className={`kep-proba-roll-eh${ehSzint > 0 ? ' kep-proba-eh-előny' : ''}`}>
                      {ehCímke}
                      {felszEH !== 0 && (
                        <button type="button" className="kep-proba-eh-info" onClick={e => e.stopPropagation()} title={`Felszerelés túlterhelés: ${előnyHátrányLabel(felszEH)}${felszNemHarcol ? ' (nem tud harcolni)' : ''}`}>i</button>
                      )}
                    </span>
                  )}
                </button>
                <ManualDicePicker sides={p.kocka} szint={ehSzint} onSelect={d.kéziDobás} disabled={!kész} alapÉrték={érték} alapLabel={d.kéziFelirat ?? label} forceOpen={d.kéziFolyamatban} />
              </div>
            )}
          </>
        ) : (
          <ProbaEredmeny bázis={érték} nehézség={nehézség} csakÖsszeg={ellenpróba || ismeretlen} dobás={d.dobás}
            összetett={összetettDb > 0 ? d.összetett : null} kocka={p.kocka} kiemeltKülönbség={p.kiemelt_különbség} ehSzint={ehSzint} />
        )}
      </div>

      {szitNyitva && (
        <PopupOverlay className="kep-prompt kep-proba-szit-popup" onClose={() => setSzitNyitva(false)}>
          <label className="kep-prompt-label-bold-mb">Helyzetfüggő módosítók</label>
          <div className="kep-proba-szit-items">
            {fortélyBónuszok.map((b, i) => (
              <button key={i} type="button"
                className={`kep-proba-szit-item${bónuszBe[i] ? ' kep-proba-szit-item-active kep-proba-szit-pos' : ''} kep-proba-szit-pos`}
                onClick={váltás(() => setBónuszBe(v => v.map((x, j) => (j === i ? !x : x))))}>
                <span className="kep-proba-szit-val">+{b.érték}</span>
                <span className="kep-proba-szit-desc">{b.leírás}</span>
              </button>
            ))}
          </div>
          {bónusz !== 0 && (
            <div className={`kep-proba-szit-sum-footer${bónusz > 0 ? ' kep-proba-szit-pos' : ' kep-proba-szit-neg'}`}>
              Összesen: {bónusz > 0 ? '+' : ''}{bónusz}
            </div>
          )}
        </PopupOverlay>
      )}
    </PopupOverlay>
  );
}
