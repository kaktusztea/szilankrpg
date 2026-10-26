import { useState, useRef } from 'react';
import type { Kepzettseg, Tulajdonsagok } from '../../engine/types';
import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, PróbaEnyhítés, PróbaKonstansok, StatuszEntry } from '../../engine/data-types';
import { képzettségSzint, képzettségNév as képzettségNévId, bontKépzKulcs } from '../../engine/azonosito';
import { calcStátuszPróbaEH, próbaÉrzékek } from '../../engine/statusz-proba';
import { rollDie, clampEHSzint } from '../../engine/dice';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { KepzettsegProbaPickers, type ProbaPickerId } from './KepzettsegProbaPickers';
import { előnyHátrányLabel, probaLehetetlen, probaBiztosSiker, tulLabel, képzetlenCélszám } from './proba-common';
import { MIND_TULAJDONSÁG, calcMultiKiterjesztésEH, calcSzitModÖsszeg, calcEffSzint, effektívFortélyFokok } from './kepzettseg-proba-calc';
import { useProbaDobas } from './useProbaDobas';
import { ProbaFejlec, ExtraGomb, ProbaEredmeny, CelszamGomb, SzitChipFelirat } from './ProbaReszek';

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
  const [ehBontásNyitva, setEhBontásNyitva] = useState(false);
  const ehAccordionRef = useRef<HTMLDivElement>(null);
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
    kepzettsegDefs.find(d => d.id === bontKépzKulcs(képzettségKulcs).id)?.domináns_tulajdonságok ?? [],
  );

  const selectedKits = [...selKits].map(i => kiterjesztesek[i]);
  const ehAlap = calcMultiKiterjesztésEH(selectedKits, effFortélyFokok);
  // Státuszok hatása a képzettségpróbára (Előny/Hátrány + letilt). Alkategóriás státusz (Érzékvesztés: Látás)
  // csak a választott érzékre hat; alapból az első érintett érzék (a büntetés látható, átkapcsolható / kikapcsolható).
  const érzékek = próbaÉrzékek(aktívStátuszok, statuszDefs, képzettségKulcs, képzettségCsoport);
  const [érzék, setÉrzék] = useState<string | undefined>(érzékek.érintett[0]);
  const státuszEH = calcStátuszPróbaEH(aktívStátuszok, statuszDefs, képzettségKulcs, képzettségCsoport, érzék);
  const ehSzintRaw = ehAlap.szint + státuszEH.szint + felszEH;
  const eh = { szint: clampEHSzint(ehSzintRaw), tiltott: ehAlap.tiltott || státuszEH.tiltott || felszNemHarcol };
  const erősTiltott = eh.tiltott;
  // Van-e Előny/Hátrány forrás (a 🛈 info + bontás accordion megjelenítéséhez).
  const vanEhForrás = ehAlap.szint !== 0 || státuszEH.források.length > 0 || felszEH !== 0;

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
  const ehCímke = előnyHátrányLabel(eh.szint);

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
      <div className="kep-proba-popup">
        <ProbaFejlec cím="Képzettségpróba" vanEredmény={vanEredmény} onReset={resetDobás} onClose={onClose} />
        <div className="kep-proba-subtitle">
          {helyettesítés
            ? <><span className="kep-proba-strike">{képzettségNév} ({szint})</span><br/>{képzettségNévId(helyettesítés, { kepzettsegDefs })} ({effSzint - vállalás})</>
            : <>{képzettségNév} ({szint})</>}
          {dobásKomment.length > 0 && (
            <button className="kep-proba-info-btn" title="Próbadobás magyarázat" onClick={() => setOpenPicker('info')}>💡</button>
          )}
        </div>

        {képzetlenFizikaiToggle && (
          <button
            type="button"
            className="kep-proba-fizikai-toggle"
            onClick={() => { setFizikaiKépzetlen(v => !v); resetDobás(); }}
            title="Szellemi képzettségnél +3 célszám-büntetés jár képzetlenül (fizikainál nem)"
          >
            Típus: {fizikaiKépzetlen ? 'fizikai' : 'szellemi (+3)'}
          </button>
        )}

        <div className="kep-proba-dual-list">
          <div className="kep-proba-dual-col">
            {MIND_TULAJDONSÁG.map(t => (
              <CelszamGomb key={t} aktív={selTul === t} onClick={() => { setSelTul(t); resetDobás(); }}
                className={dominánsTulajdonságok.has(tulLabel(t)) ? 'kep-proba-dominans' : ''}>
                {tulLabel(t)} • {tulajdonságok[t]}
              </CelszamGomb>
            ))}
          </div>
          <div className="kep-proba-dual-col">
            <CelszamGomb aktív={ellenpróba} disabled={összetettDb > 0}
              onClick={() => { setEllenpróba(!ellenpróba); if (!ellenpróba) setÖsszetettDb(0); resetDobás(); }}>
              <span className="kep-proba-rejtett-label">Ellenpróba</span>
            </CelszamGomb>
            {!ellenpróba && (<>
              <CelszamGomb aktív={ismeretlen} onClick={() => { setNehézség(-1); resetDobás(); }}>
                <span className="kep-proba-rejtett-label">Rejtett célszám</span>
              </CelszamGomb>
              {p.nehézségek.map(n => (
                <CelszamGomb key={n.érték} aktív={nehézség === n.érték} onClick={() => { setNehézség(n.érték); resetDobás(); }}>
                  {n.érték} • {n.név}
                </CelszamGomb>
              ))}
              {p.nehézségek_extra.length > 0 && (!nehTöbbi ? (
                <button type="button" className="he-field-btn kep-proba-neh-tobbi" aria-label="További célszámok" onClick={() => setNehTöbbi(true)}>▾</button>
              ) : (
                p.nehézségek_extra.map(é => (
                  <CelszamGomb key={é} aktív={nehézség === é} onClick={() => { setNehézség(é); resetDobás(); }}>{é}</CelszamGomb>
                ))
              ))}
            </>)}
          </div>
        </div>

        {érzékek.érintett.length > 0 && !vanEredmény && (
          <div className="kep-proba-osszetett-row kep-proba-erzek-row" role="group" aria-label="Használt érzék">
            {érzékek.opciók.map(é => (
              <ExtraGomb key={é} aktív={érzék === é} title={érzékek.érintett.includes(é) ? 'Érzékvesztés érinti' : undefined}
                onClick={() => { setÉrzék(érzék === é ? undefined : é); resetDobás(); }}>
                {é}{érzékek.érintett.includes(é) ? ' ⚠' : ''}
              </ExtraGomb>
            ))}
          </div>
        )}

        {kiterjesztesek.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('kit')}>
              {selKits.size === 0 ? 'Kiterjesztő fortély: nincs'
                : selKits.size === 1 ? <>Kiterjesztő: {selectedKits[0].név} <span className={kitDotClass(selectedKits[0])}>{kitDots(selectedKits[0])}</span></>
                : `Kiterjesztő: ${selKits.size} fortély`}
            </button>
          </div>
        )}

        {/* --- Módosító értékek chip (opens picker popup) --- */}
        {módosítóTáblák.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn kep-proba-kit-flash" onClick={() => setOpenPicker('szit')}>
              <SzitChipFelirat összeg={szitModÖsszeg} />
              {próbaEnyhítések.length > 0 && (
                <span className="kep-proba-enyhites-lista">
                  {[...new Map(próbaEnyhítések.map(e => [e.fortély, e])).values()].filter(e => e.fortély).map(e => (
                    <span key={e.fortély} className="kep-proba-enyhites-fortely">→ fortély: <span className="kep-proba-enyhites-nev">{e.fortély} ({fortélyFokok[e.fortély!] ?? 0})</span></span>
                  ))}
                </span>
              )}
            </button>
          </div>
        )}

        {!vanEredmény && képzettségek.length > 1 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('hely')}>
              Helyettesítés{helyettesítés ? `: ${képzettségNévId(helyettesítés, { kepzettsegDefs })}` : ' →'}
            </button>
          </div>
        )}

        {/* --- Extrák (accordion nélkül, közvetlenül): Vállalás + Összetett sorok --- */}
        {!vanEredmény && (
        <div className="kep-proba-extras-flat">
          <div className="kep-proba-osszetett-row kep-proba-vm-row">
            {Array.from({ length: próba.vállalás.max }, (_, i) => i + 1).map(n => (
              <ExtraGomb key={n} aktív={vállalás === n} disabled={összetettDb > 0 || n > maxVállalás} title="Vállalás mértéke"
                onClick={() => { setVállalás(vállalás === n ? 0 : n); resetDobás(); }}>V{n}</ExtraGomb>
            ))}
            <span className="kep-proba-extras-sep">•</span>
            {Array.from({ length: próba.összetett_max_másodlagos }, (_, i) => i + 1).map(n => (
              <ExtraGomb key={n} aktív={összetettDb === n} disabled={ellenpróba} title="Másodlagos próbák száma"
                onClick={() => { setÖsszetettDb(összetettDb === n ? 0 : n); setVállalás(0); resetDobás(); }}>+{n}M</ExtraGomb>
            ))}
          </div>
        </div>
        )}

        {/* --- Dobás / Eredmény szekció --- */}
        {erősTiltott ? (
          <div className="kep-proba-tiltott">{státuszEH.tiltott ? `${státuszEH.források[0] || 'Automatikus kudarc'}` : 'Nem dobhatsz'}</div>
        ) : !vanEredmény ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                <span className="kep-proba-sum-total">{bázis}+k{p.kocka}</span>
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
                <button type="button" className="kep-proba-roll-btn" disabled={!kész} onClick={d.dob}>
                  Dobás (k{p.kocka})
                  {ehCímke && (
                    <span className={`kep-proba-roll-eh${eh.szint > 0 ? ' kep-proba-eh-előny' : ''}`}>
                      {ehCímke}
                      {vanEhForrás && (
                        <button
                          type="button"
                          className="kep-proba-eh-info"
                          title="Mi adja a módosítót?"
                          onClick={e => { e.stopPropagation(); setEhBontásNyitva(v => { if (!v) setTimeout(() => ehAccordionRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50); return !v; }); }}
                        >i</button>
                      )}
                    </span>
                  )}
                </button>
                <ManualDicePicker sides={p.kocka} szint={eh.szint} onSelect={d.kéziDobás} disabled={!kész} alapÉrték={bázis} alapLabel={d.kéziFelirat ?? 'Alap'} forceOpen={d.kéziFolyamatban} />
              </div>
              {vanEhForrás && ehBontásNyitva && (
                <div className="kep-proba-eh-accordion" ref={ehAccordionRef}>
                  <div className="kep-proba-eh-accordion-body" onClick={() => setEhBontásNyitva(false)}>
                    {ehAlap.szint !== 0 && (
                      <div className="kep-proba-eh-bontas-sor">Kiterjesztés ({selectedKits.map(k => k.név).join(', ') || '–'}): {előnyHátrányLabel(ehAlap.szint)}</div>
                    )}
                    {státuszEH.források.map((f, i) => <div key={i} className="kep-proba-eh-bontas-sor">{f}</div>)}
                    {felszEH !== 0 && (
                      <div className="kep-proba-eh-bontas-sor">Felszerelés túlterhelés: {előnyHátrányLabel(felszEH)}</div>
                    )}
                  </div>
                </div>
              )}
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
