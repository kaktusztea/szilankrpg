import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { SzituaciosEHLista, szituációsSzint } from '../dobas/SzituaciosEHLista';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import type { Kepzettseg, Tulajdonsagok } from '../../engine/types';
import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { EsemenyEntry, ModositoTabla, PróbaEnyhítés, PróbaKonstansok, StatuszEntry } from '../../engine/data-types';
import { képzettségSzint, képzettségNév as képzettségNévId, findDef } from '../../engine/azonosito';
import { calcStátuszPróbaEH, próbaÉrzékek } from '../../engine/statusz-proba';
import { rollDie, clampEHSzint } from '../../engine/dice';
import { PopupOverlay } from '../PopupOverlay';
import { KepzettsegProbaPickers, type ProbaPickerId } from './KepzettsegProbaPickers';
import { probaLehetetlen, probaBiztosSiker, tulLabel, képzetlenCélszám, státuszEHForrások, felszerelésEHForrás } from '../../engine/proba/proba-common';
import { MIND_TULAJDONSÁG, calcMultiKiterjesztésMod, calcSzitModÖsszeg, calcEffSzint, effektívFortélyFokok } from '../../engine/proba/kepzettseg-proba-calc';
import { useProbaDobas, useVálasztottÉrzék, useKapcsolóHalmaz } from './useProbaDobas';
import { ProbaFejlec, ProbaEredmeny, CelszamGomb, ProbaModValaszto, ProbaSzamPicker, OsszetettChip, OsszetettPicker, ErzekSor, ProbaOsszegzo, ProbaDobasSor } from './ProbaReszek';

/** Vállalás próba eredménye (k6 vs vállalás: Kritikus hiba, ha ≤). */
interface VállalásEredmény {
  k6: number;
  vállalásÉrték: number;
  kritikusHiba: boolean;
}

interface Props {
  /** Megjelenített név (felirat). */
  képzettségNév: string;
  /** Hivatkozási kulcs ("lexikum", "harcmodor/kardvívás") - státusz-alcél, kiterjesztés-negálás. */
  képzettségKulcs: string;
  kepzettsegDefs: KepzettsegDef[];
  képzettségCsoport: string;
  szint: number;
  tulajdonságok: Tulajdonsagok;
  kiterjesztesek: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
  többszörösNevek: ReadonlySet<string>;
  negáltKulcsok: ReadonlySet<string>;
  onToggleNegál: (fortélyNév: string) => void;
  képzettségek: Kepzettseg[];
  aktívStátuszok: string[];
  statuszDefs: StatuszEntry[];
  /** GameData.esemenyek - a próba-kategóriák definíciója (md/010_11). */
  esemenyek: EsemenyEntry[];
  módosítóTáblák: ModositoTabla[];
  próbaEnyhítések: PróbaEnyhítés[];
  dobásKomment: { line: string }[];
  felszEH?: number;
  felszNemHarcol?: boolean;
  /** konstansok.próba (célszámok, kocka, összetett / vállalás / helyettesítés paraméterek). */
  próba: PróbaKonstansok;
  /** Képzetlen próba (szint 0, a listában nem felvett): nem-fizikai képzettségnél +3 célszám (§030_06_01). */
  képzetlen?: boolean;
  /** Általános képzetlen próba (nincs konkrét képzettség): belső "Fizikai képzettség" kapcsoló dönti a +3-at. */
  képzetlenFizikaiToggle?: boolean;
  onClose: () => void;
}

/**
 * Képzettségpróba dobás popup (Játék mód): Tulajdonság + Képzettség szint + k10 vs célszám.
 * Extrák szekció: Összetett próba, Vállalás, Ellenpróba, Helyettesítés.
 */
export function KepzettsegProbaPopup({
  képzettségNév, képzettségKulcs, kepzettsegDefs, képzettségCsoport, szint, tulajdonságok, kiterjesztesek, fortélyFokok, többszörösNevek, negáltKulcsok, onToggleNegál, képzettségek, aktívStátuszok, statuszDefs, esemenyek, módosítóTáblák, próbaEnyhítések, dobásKomment, felszEH = 0, felszNemHarcol = false, próba, képzetlen = false, képzetlenFizikaiToggle = false, onClose,
}: Props) {
  const p = próba.képzettség;
  const [selTul, setSelTul] = useState<keyof Tulajdonsagok | null>(null);
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [selKits, setSelKits] = useState<Set<number>>(new Set()); // multi-select indexes into kiterjesztesek[]
  const [openPicker, setOpenPicker] = useState<ProbaPickerId>(null);
  const [nehTöbbi, setNehTöbbi] = useState(false); // 21 feletti célszámok lenyitva?
  // Általános képzetlen próba (nincs konkrét képzettség): a fizikai-e a próba, ez vezérli a +3-at.
  const [fizikaiKépzetlen, setFizikaiKépzetlen] = useState(false);

  // Extrák state
  // Hand-set Előny/Hátrány (null = the level computed from the sources), like the Támadó dobás stepper
  const [ehKézi, setEhKézi] = useState<number | null>(null);
  const [összetettDb, setÖsszetettDb] = useState(0); // 0=ki, 1-3=másodlagos dobások száma
  const [vállalás, setVállalás] = useState(0); // 0=ki, 1-3
  const [ellenpróba, setEllenpróba] = useState(false);
  const [helyettesítés, setHelyettesítés] = useState<string | null>(null); // képzettség név vagy null

  const [vállalásEredmény, setVállalásEredmény] = useState<VállalásEredmény | null>(null);

  // Szituációs módosítók: single kategóriánként kiválasztott sor indexe (-1 = nincs kiválasztva)
  const [szitMods, setSzitMods] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const t of módosítóTáblák) {
      if (t.mód === 'multi') continue;
      const zeroIdx = t.sorok.findIndex(s => s.érték === 0);
      if (zeroIdx >= 0) init[t.kategória] = zeroIdx;
    }
    return init;
  });
  // Multi módú kategóriák: soronként be/ki toggle
  const [multiMods, setMultiMods] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {};
    for (const t of módosítóTáblák) {
      if (t.mód === 'multi') init[t.kategória] = t.sorok.map(() => false);
    }
    return init;
  });

  // (A szerepjátékos módosító nem külön state: standard helyzetfüggő módosító tábla a yaml-ból.)

  const szitModÖsszeg = calcSzitModÖsszeg(módosítóTáblák, szitMods, multiMods, próbaEnyhítések);

  // A manuálisan negált kiterjesztéseket VALÓDIként vesszük be: effektív fok-map ehhez a
  // képzettséghez (a negált fortélyok auto-értéke megfordítva). A calc + pötty ezt használja.
  const effFortélyFokok = effektívFortélyFokok(fortélyFokok, képzettségKulcs, kiterjesztesek, negáltKulcsok);

  // A képzettség domináns tulajdonságai (data: domináns_tulajdonságok) - a chip háttere ennél kiemelt.
  // A lista nagy kezdőbetűs ("Ügyesség"), a chip id-je kisbetűs ("ügyesség") → tulLabel-lel vetjük össze.
  // Képzetlen próbánál nincs konkrét képzettség → üres halmaz.
  const dominánsTulajdonságok = new Set(
    findDef(képzettségKulcs, kepzettsegDefs)?.domináns_tulajdonságok ?? [],
  );

  const selectedKits = [...selKits].map(i => kiterjesztesek[i]);
  // Extension fortély → static modifier on the base (md/030_08_01: -3 / +0 / +2 / +4; Erős missing → not rollable).
  const kit = calcMultiKiterjesztésMod(selectedKits, effFortélyFokok, { hiány: p.kiterjesztés_hiány ?? 0, fokbónusz: p.kiterjesztés_fokbónusz ?? 0 });
  // Státuszok hatása a képzettségpróbára (Előny/Hátrány + letilt). Alkategóriás státusz (Érzékvesztés: Látás)
  // csak a választott érzékre hat; alapból az első érintett érzék (a büntetés látható, átkapcsolható / kikapcsolható).
  // A fizikai / szellemi / érzék próba-kategória a választott Tulajdonságon múlik (md/010_11) - Tulajdonság nélkül nem hat.
  const érzékek = próbaÉrzékek(aktívStátuszok, statuszDefs, esemenyek, képzettségKulcs, képzettségCsoport, selTul ?? undefined);
  const [érzék, setÉrzék] = useVálasztottÉrzék(érzékek.érintett);
  const státuszEH = calcStátuszPróbaEH(aktívStátuszok, statuszDefs, esemenyek, képzettségKulcs, képzettségCsoport, érzék, selTul ?? undefined);
  // Helyzetfüggő státusz-sorok (szituációs, pl. Hangulat: kreatív / koncentráció): alapból ki, a lista alatt kapcsolhatók.
  const [szitBe, szitVált] = useKapcsolóHalmaz();
  const ehSzintRaw = státuszEH.szint + szituációsSzint(státuszEH.szituációs, szitBe) + felszEH;
  const ehForrásSzint = clampEHSzint(ehSzintRaw);
  const eh = { szint: ehKézi ?? ehForrásSzint, tiltott: kit.tiltott || státuszEH.tiltott || felszNemHarcol };
  const erősTiltott = eh.tiltott;
  // Sources listed under the E/H stepper (ForrasLista). Státusz sources are ready-made text lines (value included).
  const ehForrások: DobásHatás[] = [
    ...státuszEHForrások(státuszEH.források),
    ...felszerelésEHForrás(felszEH),
  ];

  // Pötty szín az EFFEKTÍV fok szerint (a negálás már bele van számolva): felvéve → zöld,
  // hiányzó Erős → piros, hiányzó Normál → sárga. Így a negálás mindkét irányban látható
  // színváltást ad (felvett→sárga, hiányzó→zöld).
  const kitDotClass = (k: KiterjesztesEntry): string =>
    (effFortélyFokok[k.fortély] ?? 0) > 0 ? 'kep-proba-dot-green'
      : k.típus === 'erős' ? 'kep-proba-dot-red' : 'kep-proba-dot-yellow';

  // Annyi pötty, ahány fokon EFFEKTÍVEN felvéve (min 1 ha nincs → szín jelzi hiányt).
  const kitDots = (k: KiterjesztesEntry): string => {
    const fok = effFortélyFokok[k.fortély] ?? 0;
    return '●'.repeat(Math.max(1, fok));
  };

  // Ellenpróba módban nincs célszám szükséges
  const ismeretlen = nehézség === -1;
  // Képzetlen próba: +képzetlen_büntetés a célszámra, DE fizikai képzettségnél nincs büntetés (§030_06_01).
  // Általános képzetlen (nincs konkrét képzettség): a belső "Fizikai" kapcsoló dönti; különben a csoport.
  const fizikaiKépzettség = képzetlenFizikaiToggle ? fizikaiKépzetlen : képzettségCsoport === 'fizikai';
  const képzetlenBüntetés = képzetlen && !fizikaiKépzettség ? (p.képzetlen_büntetés ?? 0) : 0;
  const effNehézség = képzetlenCélszám(nehézség, képzetlen, fizikaiKépzettség, p.képzetlen_büntetés ?? 0);
  const kész = selTul !== null && (ellenpróba || nehézség !== null);
  const tulÉrték = selTul !== null ? tulajdonságok[selTul] : 0;
  const helyettesítőSzint = helyettesítés ? képzettségSzint(képzettségek, helyettesítés) : null;
  const effSzint = calcEffSzint(szint, helyettesítőSzint, vállalás, szitModÖsszeg, próba.helyettesítés);
  const bázis = tulÉrték + effSzint + kit.mod;
  const vanCélszám = !ellenpróba && !ismeretlen && nehézség !== null;
  const lehetetlen = kész && vanCélszám && probaLehetetlen(bázis, p.kocka, effNehézség ?? 0);
  const biztosSiker = kész && vanCélszám && !lehetetlen && probaBiztosSiker(bázis, effNehézség ?? 0);

  const d = useProbaDobas({
    bázis, ehSzint: eh.szint, kocka: p.kocka, nehézség: effNehézség, összetettDb, másodlagosLevonás: p.másodlagos_levonás,
    onDobott: () => {
      if (vállalás <= 0) return;
      const k6 = rollDie(próba.vállalás.kocka);
      setVállalásEredmény({ k6, vállalásÉrték: vállalás, kritikusHiba: k6 <= vállalás });
    },
    onReset: () => setVállalásEredmény(null),
  });
  const resetDobás = d.reset;
  const vanEredmény = d.vanEredmény;


  // Escape / mellékattintás: belső picker nyitva → azt zárjuk. DE ha már megtörtént a dobás
  // (vanEredmény), a flow véget ért → mindig a teljes popup záruljon (ne térjen vissza pickerbe).
  const handleOuterClose = () => {
    if (!vanEredmény && openPicker !== null) { setOpenPicker(null); return; }
    onClose();
  };

  // Max vállalás: a konstans, de legfeljebb a képzettség szintje
  const maxVállalás = Math.min(próba.vállalás.max, szint);

  const renderVállalásEredmény = () => vállalásEredmény && (
    <div className={`kep-proba-vallalás-result${vállalásEredmény.kritikusHiba ? ' kep-proba-vallalás-krit' : ''}`}>
      Vállalás (k6): {vállalásEredmény.k6} vs {vállalásEredmény.vállalásÉrték}
      {vállalásEredmény.kritikusHiba ? ' - 🔆 Kritikus hiba!' : ' - OK'}
    </div>
  );

  return (
    <PopupOverlay onClose={handleOuterClose}>
      <div className="kep-proba-popup kep-proba-popup-kepz">
        <ProbaFejlec cím="Képzettségpróba" vanEredmény={vanEredmény} onReset={resetDobás} onClose={onClose} />
        <div className="kep-proba-subtitle">
          {helyettesítés
            ? <><span className="kep-proba-strike">{képzettségNév} ({szint})</span><br/>{képzettségNévId(helyettesítés, { kepzettsegDefs })} ({effSzint - vállalás})</>
            : <>{képzettségNév} ({szint})</>}
          {/* Vállalás / Összetett próba: icon chips next to the name (rarely used) → picker; show "V2" / "2M" once chosen */}
          <button type="button" className={`kep-proba-hely-btn${vállalás > 0 ? ' aktiv kep-proba-osszetett-chip' : ''}`}
            disabled={összetettDb > 0 || maxVállalás === 0 || vanEredmény}
            title={összetettDb > 0 ? 'Vállalás (Összetett próbánál nem választható)' : maxVállalás === 0 ? 'Vállalás (0. szinten nem választható)' : 'Vállalás'}
            aria-label={`Vállalás: ${vállalás > 0 ? `V${vállalás}` : 'nincs'}`} onClick={() => setOpenPicker('vállalás')}>
            {vállalás > 0 ? `V${vállalás}` : <Ikon név="vállalás" />}
          </button>
          <OsszetettChip db={összetettDb} ellenpróba={ellenpróba} vanEredmény={vanEredmény} onClick={() => setOpenPicker('összetett')} />
          {!vanEredmény && képzettségek.length > 1 && (
            <button type="button" className={`kep-proba-hely-btn${helyettesítés ? ' aktiv' : ''}`}
              title={helyettesítés ? `Helyettesítés: ${képzettségNévId(helyettesítés, { kepzettsegDefs })}` : 'Helyettesítés másik képzettséggel'}
              aria-label="Helyettesítés" onClick={() => setOpenPicker('hely')}><Ikon név="helyettesít" /></button>
          )}
          {dobásKomment.length > 0 && (
            <button className="kep-proba-info-btn" title="Próbadobás magyarázat" onClick={() => setOpenPicker('info')}><Ikon név="infó" /></button>
          )}
        </div>

        {képzetlenFizikaiToggle && (
          <button
            type="button"
            className="kep-proba-fizikai-toggle"
            onClick={d.váltás(() => { setFizikaiKépzetlen(v => !v); })}
            title="Szellemi képzettségnél +3 célszám-büntetés jár képzetlenül (fizikainál nem)"
          >
            Típus: {fizikaiKépzetlen ? 'fizikai' : 'szellemi (+3)'}
          </button>
        )}

        <div className="kep-proba-dual-list">
          <div className="kep-proba-dual-col">
            <div className="kep-proba-oszlop-cim">Tulajdonság</div>
            {MIND_TULAJDONSÁG.map(t => (
              <CelszamGomb key={t} aktív={selTul === t} onClick={d.váltás(() => { setSelTul(t); })}
                className={dominánsTulajdonságok.has(tulLabel(t)) ? 'kep-proba-dominans' : ''}>
                <span>{tulLabel(t)}</span><b>{tulajdonságok[t]}</b>
              </CelszamGomb>
            ))}
          </div>
          <div className="kep-proba-dual-col kep-proba-celszam-col">
            <div className="kep-proba-oszlop-cim">Célszám</div>
            <ProbaModValaszto ellenpróba={ellenpróba} ismeretlen={ismeretlen} ellenTiltva={összetettDb > 0}
              onIsmert={d.váltás(() => { setEllenpróba(false); if (ismeretlen) setNehézség(null); })}
              onRejtett={d.váltás(() => { setEllenpróba(false); setNehézség(-1); })}
              onEllen={d.váltás(() => { setEllenpróba(true); setÖsszetettDb(0); })} />
            {!ellenpróba && (<div className={`kep-proba-celszam-lista${ismeretlen ? ' halvany' : ''}`}>
              {p.nehézségek.map(n => (
                <CelszamGomb key={n.érték} aktív={nehézség === n.érték} onClick={d.váltás(() => { setNehézség(n.érték); })}>
                  <b>{n.érték}</b><span>{n.név}</span>
                </CelszamGomb>
              ))}
              {p.nehézségek_extra.length > 0 && (!nehTöbbi ? (
                <button type="button" className="he-field-btn kep-proba-neh-tobbi" aria-label="További célszámok" onClick={() => setNehTöbbi(true)}><Ikon név="lenyit" /></button>
              ) : (
                p.nehézségek_extra.map(é => (
                  <CelszamGomb key={é} aktív={nehézség === é} onClick={d.váltás(() => { setNehézség(é); })}>{é}</CelszamGomb>
                ))
              ))}
            </div>)}
          </div>
        </div>

        {érzékek.érintett.length > 0 && !vanEredmény && (
          <ErzekSor érzékek={érzékek} érzék={érzék} onVálaszt={é => d.váltás(() => setÉrzék(é))()} />
        )}

        {/* Modifier pills: Kiterjesztő / Helyzetfüggő / Helyettesítés (each still one tap) */}
        <div className="kep-proba-kapszulak">
        {kiterjesztesek.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('kit')}>
              {/* Caption + value; a long fortély name wraps at word boundaries, the dots stay glued to the last word (nbsp) */}
              <span className="kep-proba-kap-cim">Kiterjesztő fortély</span>
              <span className="kep-proba-kap-ertek">
                {selKits.size === 0 ? <span className="kep-proba-kap-ures">nincs</span>
                  : selKits.size === 1 ? <>{selectedKits[0].név}{'\u00a0'}<span className={`kep-proba-kap-jel ${kitDotClass(selectedKits[0])}`}>{kitDots(selectedKits[0])}</span></>
                  : <>{selKits.size} fortély</>}
                {kit.mod !== 0 && <span className={kit.mod > 0 ? 'kep-proba-szit-pos' : 'kep-proba-szit-neg'}>{'\u00a0'}{kit.mod > 0 ? '+' : ''}{kit.mod}</span>}
              </span>
            </button>
          </div>
        )}

        {/* --- Módosító értékek chip (opens picker popup) --- */}
        {módosítóTáblák.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn kep-proba-kit-flash kep-proba-szit-btn" onClick={() => setOpenPicker('szit')}>
              {/* Two-line caption on the left, the value large on the right (spans both lines) */}
              {/* Single line when it is the only chip in the row (no Kiterjesztő fortély chip) */}
              <span className={`kep-proba-kap-cim kep-proba-szit-cim${kiterjesztesek.length === 0 ? ' kep-proba-szit-cim-egysor' : ''}`}>
                {kiterjesztesek.length === 0 ? 'Helyzetfüggő módosító' : <>Helyzetfüggő<br />módosító</>}
              </span>
              <span className={`kep-proba-szit-ertek${szitModÖsszeg > 0 ? ' kep-proba-szit-pos' : szitModÖsszeg < 0 ? ' kep-proba-szit-neg' : ' kep-proba-kap-ures'}`}>
                {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
                {/* Easing fortély: small green dot (names in the tooltip; per-row old → new values are in the popup) */}
                {próbaEnyhítések.some(e => e.fortély) && (
                  <span className="kep-proba-szit-enyhitve" aria-label="enyhítve"
                    title={'Enyhíti: ' + [...new Map(próbaEnyhítések.map(e => [e.fortély, e])).values()].filter(e => e.fortély)
                      .map(e => `${e.fortély} (${fortélyFokok[e.fortély!] ?? 0})`).join(', ')}>●</span>
                )}
              </span>
            </button>
          </div>
        )}

        </div>

        {/* --- Előny/Hátrány: same stepper + source list as the Tulajdonságpróba / Támadó dobás (not shown when the roll is forbidden) --- */}
        {!vanEredmény && !erősTiltott && (
        <div className="kep-proba-extras-flat">
          <div className="elony-blokk">
            <ElonyLepteto szint={eh.szint} onChange={v => { setEhKézi(v); d.reset(); }} />
            <ForrasLista hatások={ehForrások} szint={eh.szint} alapSzint={ehForrásSzint} onVissza={() => { setEhKézi(null); d.reset(); }} />
            <SzituaciosEHLista lista={státuszEH.szituációs} be={szitBe} onVált={k => d.váltás(() => szitVált(k))()} />
          </div>
        </div>
        )}

        {/* --- Dobás / Eredmény szekció --- */}
        {erősTiltott ? (
          <div className="kep-proba-tiltott">{státuszEH.tiltott ? `${státuszEH.források[0] || 'Automatikus kudarc'}` : felszNemHarcol ? <>Automatikus kudarc<br />(felszerelés túlterhelés)</> : 'Nem dobhatsz'}</div>
        ) : !vanEredmény ? (
          <>
            {kész && (
              <ProbaOsszegzo bázis={bázis} kocka={p.kocka} célszám={vanCélszám ? effNehézség : null} rejtett={ismeretlen && !ellenpróba}>
                {képzetlenBüntetés > 0 && <span className="kep-proba-kepzetlen-jel"> (képzetlen +{képzetlenBüntetés})</span>}
              </ProbaOsszegzo>
            )}
            <ProbaDobasSor d={d} kocka={p.kocka} ehSzint={eh.szint} bázis={bázis} kész={kész} alapLabel="Alap"
              lehetetlen={lehetetlen} biztosSiker={biztosSiker} />
          </>
        ) : (
          <ProbaEredmeny bázis={bázis} nehézség={effNehézség} csakÖsszeg={ellenpróba || ismeretlen} dobás={d.dobás}
            összetett={összetettDb > 0 ? d.összetett : null} kocka={p.kocka} kiemeltKülönbség={p.kiemelt_különbség} ehSzint={eh.szint}>
            {renderVállalásEredmény()}
          </ProbaEredmeny>
        )}
      </div>

      {openPicker === 'vállalás' && (
        <ProbaSzamPicker cím="Vállalás" max={próba.vállalás.max} érték={vállalás} tiltott={n => n > maxVállalás}
          felirat={n => (n === 0 ? 'Nincs vállalás' : `V${n} (+${n} szint, k${próba.vállalás.kocka} ≤ ${n}: Kritikus hiba)`)}
          onValaszt={n => { setVállalás(n); resetDobás(); }} onClose={() => setOpenPicker(null)} />
      )}
      {openPicker === 'összetett' && (
        <OsszetettPicker max={próba.összetett_max_másodlagos} érték={összetettDb}
          onValaszt={n => { setÖsszetettDb(n); setVállalás(0); resetDobás(); }} onClose={() => setOpenPicker(null)} />
      )}

      <KepzettsegProbaPickers
        openPicker={openPicker} setOpenPicker={setOpenPicker} resetDobás={resetDobás}
        kiterjesztesek={kiterjesztesek} selKits={selKits} setSelKits={setSelKits}
        kitDotClass={kitDotClass} kitDots={kitDots}
        többszörösNevek={többszörösNevek} onToggleNegál={onToggleNegál}
        módosítóTáblák={módosítóTáblák} próbaEnyhítések={próbaEnyhítések}
        szitMods={szitMods} setSzitMods={setSzitMods} multiMods={multiMods} setMultiMods={setMultiMods}
        szitModÖsszeg={szitModÖsszeg}
        képzettségNév={képzettségNév} dobásKomment={dobásKomment}
        képzettségek={képzettségek} képzettségKulcs={képzettségKulcs}
        helyettesítés={helyettesítés} setHelyettesítés={setHelyettesítés}
        helyettesítésParams={próba.helyettesítés} kepzettsegDefs={kepzettsegDefs}
      />
    </PopupOverlay>
  );
}
