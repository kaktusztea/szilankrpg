import { useState } from 'react';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { SzituaciosEHLista, szituációsSzint } from '../dobas/SzituaciosEHLista';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import { PopupOverlay } from '../PopupOverlay';
import type { EsemenyEntry, PróbaKonstansok, StatuszEntry } from '../../engine/data-types';
import { calcStátuszTulajdonságPróbaEH, próbaÉrzékek } from '../../engine/statusz-proba';
import { clampEHSzint } from '../../engine/dice';
import { probaLehetetlen, probaBiztosSiker, tulLabel, státuszEHForrások, felszerelésEHForrás } from '../../engine/proba/proba-common';
import { useProbaDobas, useVálasztottÉrzék, useKapcsolóHalmaz } from './useProbaDobas';
import { ProbaFejlec, ProbaEredmeny, CelszamGomb, ProbaModValaszto, OsszetettChip, OsszetettPicker, ErzekSor, ProbaOsszegzo, ProbaDobasSor } from './ProbaReszek';

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
  /** session.aktív_státuszok + GameData.statuszok / esemenyek: a státuszok Hatásai a Tulajdonságpróbára (md/010_11 Próba-kategóriák). */
  aktívStátuszok?: string[];
  statuszDefs?: StatuszEntry[];
  esemenyek?: EsemenyEntry[];
  onClose: () => void;
}

/**
 * Tulajdonságpróba dobás popup (Játék mód): Tulajdonság + k6 vs célszám (§37.1).
 * Extrák szekció: Előny/Hátrány, Összetett próba, Fortélyok, Ellenpróba.
 */
export function TulajdonsagProbaPopup({ tulajdonságNév, érték: tulÉrték, próba, felszEH = 0, felszNemHarcol = false, fortélyBónuszok = [], aktívStátuszok = [], statuszDefs = [], esemenyek = [], onClose }: Props) {
  const p = próba.tulajdonság;
  // Bekapcsolt fortély-bónuszok: a dobás alapértékéhez adódnak.
  const [bónuszBe, setBónuszBe] = useState<boolean[]>(() => fortélyBónuszok.map(() => false));
  const bónusz = fortélyBónuszok.reduce((s, b, i) => s + (bónuszBe[i] ? b.érték : 0), 0);
  const érték = tulÉrték + bónusz;
  const [nehézség, setNehézség] = useState<number | null>(null);
  // Helyzetfüggő módosítók (fortély-bónuszok) külön picker popupban - a képzettségpróba mintájára.
  const [szitNyitva, setSzitNyitva] = useState(false);
  const [összetettNyitva, setÖsszetettNyitva] = useState(false);
  // Státuszok (§42 gyűjtő, statusz-proba.ts): Előny/Hátrány + automatikus kudarc erre a Tulajdonságpróbára. Alkategóriás
  // státusz (Érzékvesztés: Látás) csak a választott érzékre hat - Érzékenység-próbánál érzék-chip sor, mint a Képzettségpróbán.
  const érzékek = próbaÉrzékek(aktívStátuszok, statuszDefs, esemenyek, null, '', tulajdonságNév);
  const [érzék, setÉrzék] = useVálasztottÉrzék(érzékek.érintett);
  const státuszEH = calcStátuszTulajdonságPróbaEH(aktívStátuszok, statuszDefs, esemenyek, tulajdonságNév, érzék);
  // A felszerelés-túlterhelés + a státuszok Hátránya a dobás alap EH-ja (a KM felülírhatja).
  // Helyzetfüggő státusz-sorok (szituációs): alapból ki, a lista alatt kapcsolhatók.
  const [szitBe, szitVált] = useKapcsolóHalmaz();
  const alapEH = clampEHSzint(felszEH + státuszEH.szint + szituációsSzint(státuszEH.szituációs, szitBe));
  const [ehKézi, setEhKézi] = useState<number | null>(null);
  const ehSzint = ehKézi ?? alapEH;
  // Source list under the E/H stepper (same as the Támadó dobás): Felszerelés túlterhelés + státuszok
  const ehForrások: DobásHatás[] = [...(felszNemHarcol ? [] : felszerelésEHForrás(felszEH)), ...státuszEHForrások(státuszEH.források)];
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
          <OsszetettChip db={összetettDb} ellenpróba={ellenpróba} vanEredmény={d.vanEredmény} onClick={() => setÖsszetettNyitva(true)} />
        </div>


        <div className="kep-proba-dual-col kep-proba-celszam-col kep-proba-celszam-nagy">
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
              <span className="kep-proba-kap-cim kep-proba-szit-cim kep-proba-szit-cim-egysor">Helyzetfüggő módosító</span>
              <span className={`kep-proba-szit-ertek${bónusz > 0 ? ' kep-proba-szit-pos' : bónusz < 0 ? ' kep-proba-szit-neg' : ' kep-proba-kap-ures'}`}>
                {bónusz > 0 ? '+' : ''}{bónusz}
              </span>
            </button>
          </div>
        )}

        {érzékek.érintett.length > 0 && !d.vanEredmény && (
          <ErzekSor érzékek={érzékek} érzék={érzék} onVálaszt={é => váltás(() => setÉrzék(é))()} />
        )}

        {!d.vanEredmény && (
          <div className="kep-proba-extras-flat">
            {/* Előny/Hátrány: the Támadó dobás stepper + its source list (here the only source is Felszerelés) */}
            <div className="elony-blokk">
              <ElonyLepteto szint={ehSzint} onChange={v => { setEhKézi(v); d.reset(); }} />
              <ForrasLista hatások={ehForrások} szint={ehSzint} alapSzint={alapEH} onVissza={váltás(() => setEhKézi(null))} />
              <SzituaciosEHLista lista={státuszEH.szituációs} be={szitBe} onVált={k => váltás(() => szitVált(k))()} />
            </div>
          </div>
        )}

        {!d.vanEredmény ? (
          <>
            {kész && <ProbaOsszegzo bázis={érték} kocka={p.kocka} célszám={vanCélszám ? nehézség : null} rejtett={ismeretlen && !ellenpróba} />}
            {felszNemHarcol || státuszEH.tiltott ? (
              // md/010_03_06: below -2 Felszerelés the roll is an automatic failure - no roll button at all; same for a
              // státusz `letilt` (Ájulás, Sokk, Haldoklás, Érzékvesztés (3) …)
              <div className="kep-proba-tiltott">Automatikus kudarc<br />({felszNemHarcol ? 'felszerelés túlterhelés' : 'státusz'})</div>
            ) : (
              <ProbaDobasSor d={d} kocka={p.kocka} ehSzint={ehSzint} bázis={érték} kész={kész} alapLabel={label}
                lehetetlen={lehetetlen} biztosSiker={biztosSiker} />
            )}
          </>
        ) : (
          <ProbaEredmeny bázis={érték} nehézség={nehézség} csakÖsszeg={ellenpróba || ismeretlen} dobás={d.dobás}
            összetett={összetettDb > 0 ? d.összetett : null} kocka={p.kocka} kiemeltKülönbség={p.kiemelt_különbség} ehSzint={ehSzint} />
        )}
      </div>

      {összetettNyitva && (
        <OsszetettPicker max={próba.összetett_max_másodlagos} érték={összetettDb}
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
