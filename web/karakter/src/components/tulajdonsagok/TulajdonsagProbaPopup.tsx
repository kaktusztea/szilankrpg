import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../dobas/ManualDicePicker';
import type { PróbaKonstansok } from '../../engine/data-types';
import { probaLehetetlen, probaBiztosSiker, tulLabel } from '../../engine/proba/proba-common';
import { useProbaDobas } from './useProbaDobas';
import { ProbaFejlec, ProbaEredmeny, CelszamGomb, ProbaModValaszto, ProbaSzamPicker } from './ProbaReszek';

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
  const [összetettNyitva, setÖsszetettNyitva] = useState(false);
  // A felszerelés-túlterhelés Hátránya a dobás alap EH-ja (a KM felülírhatja).
  const [ehSzint, setEhSzint] = useState(felszEH);
  // Source list under the E/H stepper (same as the Támadó dobás): the only source here is Felszerelés túlterhelés
  const ehForrások: DobásHatás[] = felszEH < 0 && !felszNemHarcol
    ? [{ forrás: 'Felszerelés túlterhelés', cél: 'té_dobás', operátor: 'hátrány', érték: -felszEH }]
    : [];
  const [összetettDb, setÖsszetettDb] = useState(0);
  const [ellenpróba, setEllenpróba] = useState(false);

  const d = useProbaDobas({ bázis: érték, ehSzint, kocka: p.kocka, nehézség, összetettDb, másodlagosLevonás: p.másodlagos_levonás });
  const ismeretlen = nehézség === -1;
  const kész = ellenpróba || nehézség !== null;
  const vanCélszám = !ellenpróba && !ismeretlen && nehézség !== null;
  const lehetetlen = vanCélszám && probaLehetetlen(érték, p.kocka, nehézség);
  const biztosSiker = vanCélszám && !lehetetlen && probaBiztosSiker(érték, nehézség);
  const label = tulLabel(tulajdonságNév);
  const { váltás } = d;

  return (
    <PopupOverlay onClose={onClose}>
      <div className="kep-proba-popup">
        <ProbaFejlec cím="Tulajdonságpróba" vanEredmény={d.vanEredmény} onReset={d.reset} onClose={onClose} />
        <div className="kep-proba-subtitle">
          {label} ({tulÉrték}){bónusz ? ` + ${bónusz} (fortély)` : ''}
          {/* Összetett próba: icon chip next to the name (rarely used) → picker; shows "2M" once chosen */}
          <button type="button" className={`kep-proba-hely-btn${összetettDb > 0 ? ' aktiv kep-proba-osszetett-chip' : ''}`}
            disabled={ellenpróba || d.vanEredmény} title={ellenpróba ? 'Összetett próba (Ellenpróbánál nem választható)' : 'Összetett próba'}
            aria-label={`Összetett próba: ${összetettDb > 0 ? `${összetettDb}M` : 'nincs'}`} onClick={() => setÖsszetettNyitva(true)}>
            {összetettDb > 0 ? `${összetettDb}M` : <Ikon név="összetett" />}
          </button>
        </div>


        <div className="kep-proba-dual-col kep-proba-celszam-col">
          <div className="kep-proba-oszlop-cim">Célszám</div>
          <ProbaModValaszto ellenpróba={ellenpróba} ismeretlen={ismeretlen} ellenTiltva={összetettDb > 0}
            onIsmert={váltás(() => { setEllenpróba(false); if (ismeretlen) setNehézség(null); })}
            onRejtett={váltás(() => { setEllenpróba(false); setNehézség(-1); })}
            onEllen={váltás(() => { setEllenpróba(true); setÖsszetettDb(0); })} />
          {!ellenpróba && (<div className={`kep-proba-celszam-lista${ismeretlen ? ' halvany' : ''}`}>
            {p.nehézségek.map(n => (
              <CelszamGomb key={n.érték} aktív={nehézség === n.érték} onClick={váltás(() => setNehézség(n.érték))}>
                <b>{n.érték}</b><span>{n.név}</span>
              </CelszamGomb>
            ))}
          </div>)}
        </div>

        {fortélyBónuszok.length > 0 && !d.vanEredmény && (
          <div className="kep-proba-kapszulak">
            <button className="he-field-btn kep-proba-kit-btn kep-proba-kit-flash kep-proba-szit-btn" onClick={() => setSzitNyitva(true)}>
              <span className="kep-proba-kap-cim kep-proba-szit-cim">Helyzetfüggő<br />módosító</span>
              <span className={`kep-proba-szit-ertek${bónusz > 0 ? ' kep-proba-szit-pos' : bónusz < 0 ? ' kep-proba-szit-neg' : ' kep-proba-kap-ures'}`}>
                {bónusz > 0 ? '+' : ''}{bónusz}
              </span>
            </button>
          </div>
        )}

        {!d.vanEredmény && (
          <div className="kep-proba-extras-flat">
            {/* Előny/Hátrány: the Támadó dobás stepper + its source list (here the only source is Felszerelés) */}
            <div className="elony-blokk">
              <ElonyLepteto szint={ehSzint} onChange={v => { setEhSzint(v); d.reset(); }} />
              <ForrasLista hatások={ehForrások} szint={ehSzint} alapSzint={felszEH} onVissza={váltás(() => setEhSzint(felszEH))} />
            </div>
          </div>
        )}

        {!d.vanEredmény ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                <span className="kep-proba-sum-total">{érték}+k{p.kocka}</span>
                {vanCélszám && <><span className="kep-proba-vs">vs</span><span className="kep-proba-celszam">{nehézség}</span></>}
                {ismeretlen && !ellenpróba && <><span className="kep-proba-vs">vs</span><span className="kep-proba-celszam">?</span></>}
              </div>
            )}
            {felszNemHarcol ? (
              // md/010_03_06: below -2 Felszerelés the roll is an automatic failure - no roll button at all
              <div className="kep-proba-tiltott">Automatikus kudarc<br />(felszerelés túlterhelés)</div>
            ) : lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <>
              <div className="dobas-btn-row">
                {/* Same roll button as the Támadó dobás: the kocka is in the formula above, the E/H in the stepper / sources */}
                <button type="button" className="tamado-dobas-btn dobas-btn-ikon" disabled={!kész} onClick={d.dob}><Ikon név="kocka" méret={22} />Dobás</button>
                <ManualDicePicker sides={p.kocka} szint={ehSzint} onSelect={d.kéziDobás} disabled={!kész} alapÉrték={érték} alapLabel={d.kéziFelirat ?? label} forceOpen={d.kéziFolyamatban} />
              </div>
              </>
            )}
          </>
        ) : (
          <ProbaEredmeny bázis={érték} nehézség={nehézség} csakÖsszeg={ellenpróba || ismeretlen} dobás={d.dobás}
            összetett={összetettDb > 0 ? d.összetett : null} kocka={p.kocka} kiemeltKülönbség={p.kiemelt_különbség} ehSzint={ehSzint} />
        )}
      </div>

      {összetettNyitva && (
        <ProbaSzamPicker cím="Összetett próba" max={próba.összetett_max_másodlagos} érték={összetettDb}
          felirat={n => (n === 0 ? 'Nincs összetett próba' : `+${n}M (${n} másodlagos próba)`)}
          onValaszt={n => { setÖsszetettDb(n); d.reset(); }} onClose={() => setÖsszetettNyitva(false)} />
      )}

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
