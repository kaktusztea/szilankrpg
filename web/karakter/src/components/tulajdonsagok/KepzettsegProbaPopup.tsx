import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import type { Kepzettseg, Tulajdonsagok } from '../../engine/types';
import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, PróbaEnyhítés, PróbaKonstansok, StatuszEntry } from '../../engine/data-types';
import { képzettségSzint, képzettségNév as képzettségNévId, findDef } from '../../engine/azonosito';
import { calcStátuszPróbaEH, próbaÉrzékek } from '../../engine/statusz-proba';
import { rollDie, clampEHSzint } from '../../engine/dice';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../dobas/ManualDicePicker';
import { KepzettsegProbaPickers, type ProbaPickerId } from './KepzettsegProbaPickers';
import { probaLehetetlen, probaBiztosSiker, tulLabel, képzetlenCélszám } from '../../engine/proba/proba-common';
import { MIND_TULAJDONSÁG, calcMultiKiterjesztésEH, calcSzitModÖsszeg, calcEffSzint, effektívFortélyFokok } from '../../engine/proba/kepzettseg-proba-calc';
import { useProbaDobas } from './useProbaDobas';
import { ProbaFejlec, ExtraGomb, ProbaEredmeny, CelszamGomb, ProbaModValaszto, ProbaSzamPicker } from './ProbaReszek';

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
  képzettségNév, képzettségKulcs, kepzettsegDefs, képzettségCsoport, szint, tulajdonságok, kiterjesztesek, fortélyFokok, többszörösNevek, negáltKulcsok, onToggleNegál, képzettségek, aktívStátuszok, statuszDefs, módosítóTáblák, próbaEnyhítések, dobásKomment, felszEH = 0, felszNemHarcol = false, próba, képzetlen = false, képzetlenFizikaiToggle = false, onClose,
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
  const ehAlap = calcMultiKiterjesztésEH(selectedKits, effFortélyFokok);
  // Státuszok hatása a képzettségpróbára (Előny/Hátrány + letilt). Alkategóriás státusz (Érzékvesztés: Látás)
  // csak a választott érzékre hat; alapból az első érintett érzék (a büntetés látható, átkapcsolható / kikapcsolható).
  const érzékek = próbaÉrzékek(aktívStátuszok, statuszDefs, képzettségKulcs, képzettségCsoport);
  const [érzék, setÉrzék] = useState<string | undefined>(érzékek.érintett[0]);
  const státuszEH = calcStátuszPróbaEH(aktívStátuszok, statuszDefs, képzettségKulcs, képzettségCsoport, érzék);
  const ehSzintRaw = ehAlap.szint + státuszEH.szint + felszEH;
  const ehForrásSzint = clampEHSzint(ehSzintRaw);
  const eh = { szint: ehKézi ?? ehForrásSzint, tiltott: ehAlap.tiltott || státuszEH.tiltott || felszNemHarcol };
  const erősTiltott = eh.tiltott;
  // Sources listed under the E/H stepper (ForrasLista). Státusz sources are ready-made text lines (value included).
  const ehForrások: DobásHatás[] = [
    ...(ehAlap.szint !== 0 ? [{ forrás: `Kiterjesztés (${selectedKits.map(k => k.név).join(', ') || '–'})`, cél: 'té_dobás' as const, operátor: (ehAlap.szint > 0 ? 'előny' : 'hátrány') as 'előny' | 'hátrány', érték: Math.abs(ehAlap.szint) }] : []),
    ...státuszEH.források.map(f => ({ forrás: f, cél: 'té_dobás' as const, operátor: 'szöveges' as const, érték: 0, megjegyzés: '' })),
    ...(felszEH !== 0 ? [{ forrás: 'Felszerelés túlterhelés', cél: 'té_dobás' as const, operátor: 'hátrány' as const, érték: -felszEH }] : []),
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
  const bázis = tulÉrték + effSzint;
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
          <button type="button" className={`kep-proba-hely-btn${összetettDb > 0 ? ' aktiv kep-proba-osszetett-chip' : ''}`}
            disabled={ellenpróba || vanEredmény} title={ellenpróba ? 'Összetett próba (Ellenpróbánál nem választható)' : 'Összetett próba'}
            aria-label={`Összetett próba: ${összetettDb > 0 ? `${összetettDb}M` : 'nincs'}`} onClick={() => setOpenPicker('összetett')}>
            {összetettDb > 0 ? `${összetettDb}M` : <Ikon név="összetett" />}
          </button>
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
          <div className="kep-proba-osszetett-row kep-proba-erzek-row" role="group" aria-label="Használt érzék">
            {érzékek.opciók.map(é => (
              <ExtraGomb key={é} aktív={érzék === é} title={érzékek.érintett.includes(é) ? 'Érzékvesztés érinti' : undefined}
                onClick={d.váltás(() => { setÉrzék(érzék === é ? undefined : é); })}>
                {é}{érzékek.érintett.includes(é) ? ' ⚠' : ''}
              </ExtraGomb>
            ))}
          </div>
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
              </span>
            </button>
          </div>
        )}

        {/* --- Módosító értékek chip (opens picker popup) --- */}
        {módosítóTáblák.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn kep-proba-kit-flash kep-proba-szit-btn" onClick={() => setOpenPicker('szit')}>
              {/* Two-line caption on the left, the value large on the right (spans both lines) */}
              <span className="kep-proba-kap-cim kep-proba-szit-cim">Helyzetfüggő<br />módosító</span>
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
          </div>
        </div>
        )}

        {/* --- Dobás / Eredmény szekció --- */}
        {erősTiltott ? (
          <div className="kep-proba-tiltott">{státuszEH.tiltott ? `${státuszEH.források[0] || 'Automatikus kudarc'}` : felszNemHarcol ? <>Automatikus kudarc<br />(felszerelés túlterhelés)</> : 'Nem dobhatsz'}</div>
        ) : !vanEredmény ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                <span className="kep-proba-sum-total">{bázis}+k{p.kocka}</span>
                {ismeretlen && !ellenpróba && <><span className="kep-proba-vs">vs</span><span className="kep-proba-celszam">?</span></>}
                {vanCélszám && <><span className="kep-proba-vs">vs</span><span className="kep-proba-celszam">{effNehézség}{képzetlenBüntetés > 0 && <span className="kep-proba-kepzetlen-jel"> (képzetlen +{képzetlenBüntetés})</span>}</span></>}
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <>
              <div className="dobas-btn-row">
                {/* Same roll button as the Támadó dobás: the kocka is in the formula above, the E/H in the stepper / sources */}
                <button type="button" className="tamado-dobas-btn dobas-btn-ikon" disabled={!kész} onClick={d.dob}><Ikon név="kocka" méret={22} />Dobás</button>
                <ManualDicePicker sides={p.kocka} szint={eh.szint} onSelect={d.kéziDobás} disabled={!kész} alapÉrték={bázis} alapLabel={d.kéziFelirat ?? 'Alap'} forceOpen={d.kéziFolyamatban} />
              </div>
              </>
            )}
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
        <ProbaSzamPicker cím="Összetett próba" max={próba.összetett_max_másodlagos} érték={összetettDb}
          felirat={n => (n === 0 ? 'Nincs összetett próba' : `+${n}M (${n} másodlagos próba)`)}
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
