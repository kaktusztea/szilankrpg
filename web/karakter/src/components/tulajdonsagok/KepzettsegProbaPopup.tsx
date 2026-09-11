import { useState, useRef } from 'react';
import type { Tulajdonsagok } from '../../engine/types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, PróbaEnyhítés, StatuszEntry } from '../../engine/data-types';
import { calcStátuszPróbaEH } from '../../engine/statusz-proba';
import { PopupOverlay } from '../PopupOverlay';
import { KepzettsegProbaPickers, type ProbaPickerId } from './KepzettsegProbaPickers';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrány, rollDie, type ProbaDobás, clampEHSzint } from '../../engine/dice';
import { előnyHátrányLabel, type ÖsszetettSor, type ÖsszetettEredmény } from './proba-common';
import {
  NEHÉZSÉGEK, NEHÉZSÉGEK_EXTRA, MIND_TULAJDONSÁG,
  tulLabel, probaLehetetlen, probaBiztosSiker, calcMultiKiterjesztésEH,
  calcSzitModÖsszeg, calcEffSzint, összetettCélszámok,
} from './kepzettseg-proba-calc';

// --- Összetett próba eredmény típus ---
// --- Vállalás próba eredmény ---
interface VállalásEredmény {
  k6: number;
  vállalásÉrték: number;
  kritikusHiba: boolean;
}

interface Props {
  képzettségNév: string;
  képzettségCsoport: string;
  szint: number;
  tulajdonságok: Tulajdonsagok;
  kiterjesztesek: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
  képzettségek: { név: string; szint: number }[];
  aktívStátuszok: string[];
  statuszDefs: StatuszEntry[];
  módosítóTáblák: ModositoTabla[];
  próbaEnyhítések: PróbaEnyhítés[];
  dobásKomment: { line: string }[];
  onClose: () => void;
}

/**
 * Képzettségpróba dobás popup (Játék mód): Tulajdonság + Képzettség szint + k10 vs célszám.
 * Extrák szekció: Összetett próba, Vállalás, Ellenpróba, Helyettesítés.
 */
export function KepzettsegProbaPopup({
  képzettségNév, képzettségCsoport, szint, tulajdonságok, kiterjesztesek, fortélyFokok, képzettségek, aktívStátuszok, statuszDefs, módosítóTáblák, próbaEnyhítések, dobásKomment, onClose,
}: Props) {
  const [selTul, setSelTul] = useState<keyof Tulajdonsagok | null>(null);
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [selKits, setSelKits] = useState<Set<number>>(new Set()); // multi-select indexes into kiterjesztesek[]
  const [openPicker, setOpenPicker] = useState<ProbaPickerId>(null);
  const [nehTöbbi, setNehTöbbi] = useState(false); // 21 feletti célszámok lenyitva?
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);

  // Extrák state
  const [extrákNyitva, setExtrákNyitva] = useState(false);
  const [ehBontásNyitva, setEhBontásNyitva] = useState(false);
  const ehAccordionRef = useRef<HTMLDivElement>(null);
  const [összetettDb, setÖsszetettDb] = useState(0); // 0=ki, 1-3=másodlagos dobások száma
  const [vállalás, setVállalás] = useState(0); // 0=ki, 1-3
  const [ellenpróba, setEllenpróba] = useState(false);
  const [helyettesítés, setHelyettesítés] = useState<string | null>(null); // képzettség név vagy null

  // Összetett + Vállalás eredmények
  const [összetettEredmény, setÖsszetettEredmény] = useState<ÖsszetettEredmény | null>(null);
  const [vállalásEredmény, setVállalásEredmény] = useState<VállalásEredmény | null>(null);
  const [összetettManual, setÖsszetettManual] = useState<number[]>([]);

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

  const selectedKits = [...selKits].map(i => kiterjesztesek[i]);
  const ehAlap = calcMultiKiterjesztésEH(selectedKits, fortélyFokok);
  // Státuszok hatása a képzettségpróbára (Előny/Hátrány + letilt)
  const státuszEH = calcStátuszPróbaEH(aktívStátuszok, statuszDefs, képzettségNév, képzettségCsoport);
  const ehSzintRaw = ehAlap.szint + státuszEH.szint;
  const eh = { szint: clampEHSzint(ehSzintRaw), tiltott: ehAlap.tiltott || státuszEH.tiltott };
  const erősTiltott = eh.tiltott;

  // Pötty szín: felvéve → zöld, hiányzó Erős → piros, hiányzó Normál → sárga.
  const kitDotClass = (k: KiterjesztesEntry): string =>
    (fortélyFokok[k.fortély] ?? 0) > 0 ? 'kep-proba-dot-green'
      : k.típus === 'erős' ? 'kep-proba-dot-red' : 'kep-proba-dot-yellow';

  // Annyi pötty, ahány fokon van felvéve a fortély (min 1 ha nincs felvéve → szín jelzi hiányt).
  const kitDots = (k: KiterjesztesEntry): string => {
    const fok = fortélyFokok[k.fortély] ?? 0;
    return '●'.repeat(Math.max(1, fok));
  };

  const resetDobás = () => {
    setDobás(null);
    setÖsszetettEredmény(null);
    setVállalásEredmény(null);
    setÖsszetettManual([]);
  };

  // Ellenpróba módban nincs célszám szükséges
  const ismeretlen = nehézség === -1;
  const kész = selTul !== null && (ellenpróba || nehézség !== null);
  const tulÉrték = selTul !== null ? tulajdonságok[selTul] : 0;
  const helyettesítőSzint = helyettesítés ? (képzettségek.find(k => k.név === helyettesítés)?.szint ?? 0) : null;
  const effSzint = calcEffSzint(szint, helyettesítőSzint, vállalás, szitModÖsszeg);
  // Lehetetlen/biztos siker: csak ha nincs ellenpróba mód
  const lehetetlen = !ellenpróba && !ismeretlen && kész && nehézség !== null && probaLehetetlen(tulÉrték, effSzint, nehézség);
  const biztosSiker = !ellenpróba && !ismeretlen && kész && nehézség !== null && !lehetetlen && probaBiztosSiker(tulÉrték, effSzint, nehézség);

  // Sima (nem összetett) eredmény
  const eredmény = dobás !== null && kész ? tulÉrték + effSzint + dobás.eredmény : null;
  const siker = !ellenpróba && !ismeretlen && eredmény !== null && nehézség !== null && (tulÉrték + effSzint + dobás!.eredmény >= nehézség);
  const ehCímke = előnyHátrányLabel(eh.szint);

  // Van-e eredmény megjelenítendő?
  const vanEredmény = összetettDb > 0 ? összetettEredmény !== null : dobás !== null;

  // --- Dobás logika ---
  const handleDobás = () => {
    if (összetettDb > 0 && nehézség !== null) {
      // Összetett próba: 1 elsődleges + N másodlagos
      const sorok: ÖsszetettSor[] = [];
      const sorDefek = összetettCélszámok(nehézség, összetettDb);
      const célszámok = sorDefek.map(d => d.célszám);
      const labels = sorDefek.map(d => d.label);
      for (let i = 0; i < célszámok.length; i++) {
        const d = rollElőnyHátrány(eh.szint);
        const összeg = tulÉrték + effSzint + d.eredmény;
        sorok.push({
          label: labels[i],
          célszám: célszámok[i],
          dobás: d,
          összeg,
          siker: összeg >= célszámok[i],
        });
      }
      const összSiker = sorok.every(s => s.siker);
      setÖsszetettEredmény({ sorok, összSiker });
      setDobás(sorok[0].dobás); // mark as rolled
    } else {
      // Sima vagy ellenpróba dobás
      setDobás(rollElőnyHátrány(eh.szint));
    }

    // Vállalás próba (ha van vállalás)
    if (vállalás > 0) {
      const k6 = rollDie(6);
      setVállalásEredmény({ k6, vállalásÉrték: vállalás, kritikusHiba: k6 <= vállalás });
    }
  };

  const handleManualK10 = (value: number) => {
    if (összetettDb > 0 && nehézség !== null) {
      const rolls = [...összetettManual, value];
      const total = összetettDb + 1;
      if (rolls.length < total) {
        setÖsszetettManual(rolls);
        return;
      }
      // All collected → finalize
      const sorDefek = összetettCélszámok(nehézség, összetettDb);
      const célszámok = sorDefek.map(d => d.célszám);
      const labels = sorDefek.map(d => d.label);
      const sorok: ÖsszetettSor[] = rolls.map((v, i) => {
        const d: ProbaDobás = { rolls: [v], eredmény: v };
        const összeg = tulÉrték + effSzint + d.eredmény;
        return { label: labels[i], célszám: célszámok[i], dobás: d, összeg, siker: összeg >= célszámok[i] };
      });
      setÖsszetettEredmény({ sorok, összSiker: sorok.every(s => s.siker) });
      setDobás(sorok[0].dobás);
      setÖsszetettManual([]);
    } else {
      setDobás({ rolls: [value], eredmény: value });
    }
    if (vállalás > 0) {
      const k6 = rollDie(6);
      setVállalásEredmény({ k6, vállalásÉrték: vállalás, kritikusHiba: k6 <= vállalás });
    }
  };

  /** Label for the current manual összetett step. */
  const összetettManualLabel = összetettDb > 0 && összetettManual.length < összetettDb + 1
    ? (összetettManual.length === 0 ? 'Elsődleges' : `Másodlagos ${összetettManual.length}/${összetettDb}`)
    : null;

  // Escape: ha belső picker nyitva → azt zárjuk, ne a teljes popup-ot.
  const handleOuterClose = () => {
    if (openPicker !== null) { setOpenPicker(null); return; }
    onClose();
  };

  // Max vállalás: képzettség szint
  const maxVállalás = Math.min(3, szint);

  const renderVállalásEredmény = () => vállalásEredmény && (
    <div className={`kep-proba-vallalás-result${vállalásEredmény.kritikusHiba ? ' kep-proba-vallalás-krit' : ''}`}>
      Vállalás (k6): {vállalásEredmény.k6} vs {vállalásEredmény.vállalásÉrték}
      {vállalásEredmény.kritikusHiba ? ' — 🔆 Kritikus hiba!' : ' — OK'}
    </div>
  );

  return (
    <PopupOverlay onClose={handleOuterClose}>
      <div className="kep-proba-popup">
        <div className="kep-proba-header">
          <button className="kep-proba-close-btn" onClick={onClose} title="Bezárás">✕</button>
          Képzettségpróba
          <button
            className="kep-proba-reset-btn"
            disabled={!vanEredmény}
            onClick={resetDobás}
            title="Újradobás"
          >⟲</button>
        </div>
        <div className="kep-proba-subtitle">
          {helyettesítés
            ? <><span className="kep-proba-strike">{képzettségNév} ({szint})</span><br/>{helyettesítés} ({effSzint - vállalás})</>
            : <>{képzettségNév} ({szint})</>}
          {dobásKomment.length > 0 && (
            <button className="kep-proba-info-btn" title="Próbadobás magyarázat" onClick={() => setOpenPicker('info')}>💡</button>
          )}
        </div>

        <div className="kep-proba-dual-list">
          <div className="kep-proba-dual-col">
            {MIND_TULAJDONSÁG.map(t => (
              <button key={t} className={`he-field-btn${selTul === t ? ' vallas-active' : ''}`}
                onClick={() => { setSelTul(t); resetDobás(); }}>
                {tulLabel(t)} • {tulajdonságok[t]}
              </button>
            ))}
          </div>
          {!ellenpróba && (
            <div className="kep-proba-dual-col">
              <button className={`he-field-btn${nehézség === -1 ? ' vallas-active' : ''}`}
                onClick={() => { setNehézség(-1); resetDobás(); }}>
                <span className="kep-proba-rejtett-label">Rejtett célszám</span>
              </button>
              {NEHÉZSÉGEK.map(n => (
                <button key={n.érték} className={`he-field-btn${nehézség === n.érték ? ' vallas-active' : ''}`}
                  onClick={() => { setNehézség(n.érték); resetDobás(); }}>
                  {n.érték} • {n.label}
                </button>
              ))}
              {!nehTöbbi ? (
                <button className="he-field-btn kep-proba-neh-tobbi" onClick={() => setNehTöbbi(true)}>▾</button>
              ) : (
                NEHÉZSÉGEK_EXTRA.map(é => (
                  <button key={é} className={`he-field-btn${nehézség === é ? ' vallas-active' : ''}`}
                    onClick={() => { setNehézség(é); resetDobás(); }}>
                    {é}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {kiterjesztesek.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('kit')}>
              {selKits.size === 0 ? 'Kiterjesztő fortély: nincs'
                : selKits.size === 1 ? <>Kiterjesztő: {selectedKits[0].fortély} <span className={kitDotClass(selectedKits[0])}>{kitDots(selectedKits[0])}</span></>
                : `Kiterjesztő: ${selKits.size} fortély`}
            </button>
          </div>
        )}

        {/* --- Módosító értékek chip (opens picker popup) --- */}
        {módosítóTáblák.length > 0 && (
          <div className="kep-proba-row">
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('szit')}>
              Helyzetfüggő módosítók: <span className={szitModÖsszeg > 0 ? 'kep-proba-szit-pos' : szitModÖsszeg < 0 ? 'kep-proba-szit-neg' : ''}>{szitModÖsszeg === 0 ? '0' : `${szitModÖsszeg > 0 ? '+' : ''}${szitModÖsszeg}`}</span>
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

        {/* --- Extrák szekció (eltűnik ha van eredmény) --- */}
        {!vanEredmény && (
        <div className="kep-proba-extras-box">
          <button className="kep-proba-extras-toggle" onClick={() => setExtrákNyitva(v => !v)}>
            Extra dobás funkciók {extrákNyitva ? '▴' : '▾'}
          </button>
          {!extrákNyitva && (() => {
            const parts: string[] = [];
            if (összetettDb > 0) parts.push(`+${összetettDb}M`);
            if (vállalás > 0) parts.push(`V:${vállalás}`);
            if (helyettesítés) parts.push(`H:${helyettesítés}`);
            return parts.length > 0 ? <span className="kep-proba-extras-summary">{parts.join(', ')}</span> : null;
          })()}
          {extrákNyitva && (
            <div className="kep-proba-extras-body">
              {/* Összetett próba */}
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Összetett próba:</span>
                <div className="kep-proba-extras-btns">
                  {[1, 2, 3].map(n => (
                    <button key={n}
                      className={`kep-proba-extras-btn${összetettDb === n ? ' kep-proba-extras-btn-active' : ''}`}
                      disabled={ellenpróba}
                      title={`${n}db Másodlagos dobás (-3)`}
                      onClick={() => { setÖsszetettDb(összetettDb === n ? 0 : n); setVállalás(0); resetDobás(); }}>
                      +{n}M
                    </button>
                  ))}
                </div>
              </div>
              {/* Vállalás */}
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Vállalás:</span>
                <div className="kep-proba-extras-btns">
                  {[1, 2, 3].map(n => (
                    <button key={n}
                      className={`kep-proba-extras-btn${vállalás === n ? ' kep-proba-extras-btn-active' : ''}`}
                      disabled={összetettDb > 0 || n > maxVállalás}
                      onClick={() => { setVállalás(vállalás === n ? 0 : n); resetDobás(); }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Ellenpróba */}
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Ellenpróba:</span>
                <div className="kep-proba-extras-btns">
                  <button
                    className={`kep-proba-extras-btn${ellenpróba ? ' kep-proba-extras-btn-active' : ''}`}
                    disabled={összetettDb > 0}
                    onClick={() => { setEllenpróba(true); setÖsszetettDb(0); resetDobás(); }}>
                    Igen
                  </button>
                  <button
                    className={`kep-proba-extras-btn${!ellenpróba ? ' kep-proba-extras-btn-active' : ''}`}
                    disabled={összetettDb > 0}
                    onClick={() => { setEllenpróba(false); resetDobás(); }}>
                    Nem
                  </button>
                </div>
              </div>
              {/* Helyettesítés */}
              {képzettségek.length > 1 && (
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Helyettesítés:</span>
                <select className="field-select kep-proba-hely-select"
                  value={helyettesítés || ''}
                  onChange={e => { setHelyettesítés(e.target.value || null); resetDobás(); }}>
                  <option value="">nincs</option>
                  {képzettségek
                    .filter(k => k.név !== képzettségNév && k.szint >= 3)
                    .map(k => <option key={k.név} value={k.név}>{k.név} ({k.szint} → {Math.min(5, Math.floor(k.szint / 3))})</option>)}
                </select>
              </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* --- Dobás / Eredmény szekció --- */}
        {erősTiltott ? (
          <div className="kep-proba-tiltott">{státuszEH.tiltott ? `${státuszEH.források[0] || 'Automatikus kudarc'}` : 'Nem dobhatsz'}</div>
        ) : !vanEredmény ? (
          <>
            {kész && !ellenpróba && !ismeretlen && (
              <div className="kep-proba-summary">
                <span className="kep-proba-sum-total">{effSzint + tulÉrték}+k10</span>
                <span className="kep-proba-vs">vs</span>
                <span className="kep-proba-celszam">{nehézség}</span>
              </div>
            )}
            {kész && (ellenpróba || ismeretlen) && (
              <div className="kep-proba-summary">
                <span className="kep-proba-sum-total">{effSzint + tulÉrték}+k10</span>
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <>
              <div className="dobas-btn-row">
                <button className="kep-proba-roll-btn" disabled={!kész} onClick={handleDobás}>
                  Dobás
                  {ehCímke && (
                    <span className={`kep-proba-roll-eh${eh.szint > 0 ? ' kep-proba-eh-előny' : ''}`}>
                      {ehCímke}
                    </span>
                  )}
                </button>
                <ManualDicePicker sides={10} szint={eh.szint} onSelect={handleManualK10} disabled={!kész} alapÉrték={tulÉrték + effSzint} alapLabel={összetettManualLabel ?? 'Alap'} forceOpen={összetettManual.length > 0} />
              </div>
              {(ehAlap.szint !== 0 || státuszEH.források.length > 0) && (
                <div className="kep-proba-eh-accordion" ref={ehAccordionRef}>
                  <button className="kep-proba-eh-accordion-toggle" data-open={ehBontásNyitva} onClick={() => { setEhBontásNyitva(v => { if (!v) setTimeout(() => ehAccordionRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 50); return !v; }); }}>
                    {ehBontásNyitva ? '▴' : '▾'}
                  </button>
                  {ehBontásNyitva && (
                    <div className="kep-proba-eh-accordion-body" onClick={() => setEhBontásNyitva(false)}>
                      {ehAlap.szint !== 0 && (
                        <div className="kep-proba-eh-bontas-sor">Kiterjesztés ({selectedKits.map(k => k.fortély).join(', ') || '–'}): {előnyHátrányLabel(ehAlap.szint)}</div>
                      )}
                      {státuszEH.források.map((f, i) => <div key={i} className="kep-proba-eh-bontas-sor">{f}</div>)}
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </>
        ) : összetettDb > 0 && összetettEredmény ? (
          /* --- Összetett eredmény --- */
          <div className="kep-proba-result">
            <div className="kep-proba-osszetett-rows">
              {összetettEredmény.sorok.map((s, i) => (
                <div key={i} className={`kep-proba-osszetett-sor${!ismeretlen && !s.siker ? ' kep-proba-osszetett-fail' : ''}`}>
                  <span className="kep-proba-osszetett-label">{s.label}{!ismeretlen ? ` (${s.célszám})` : ''}:</span>
                  <span className="kep-proba-osszetett-sum">{s.összeg}</span>
                  {!ismeretlen && (
                    <span className={s.siker ? 'kep-proba-osszetett-ok' : 'kep-proba-osszetett-x'}>
                      {s.siker ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {!ismeretlen && (
              <div className={összetettEredmény.összSiker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
                {összetettEredmény.összSiker ? 'Siker' : 'Sikertelen'}
                {` (${összetettEredmény.sorok.filter(s => s.siker).length}/${összetettEredmény.sorok.length})`}
              </div>
            )}
            {renderVállalásEredmény()}
          </div>
        ) : (ellenpróba || ismeretlen) && dobás ? (
          /* --- Ellenpróba / Ismeretlen eredmény (csak szám, nincs vs) --- */
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {tulÉrték + effSzint + dobás.eredmény}
            </div>
            <div className="kep-proba-rolls">
              {ehCímke && <span className={eh.szint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
              k10: {dobás.rolls.map((r, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
              ))}
            </div>
            {renderVállalásEredmény()}
          </div>
        ) : dobás ? (
          /* --- Sima eredmény (eredeti viselkedés + vállalás) --- */
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {eredmény}<span className="kep-proba-result-vs"> vs </span><span className="kep-proba-result-cel">{nehézség}</span>
            </div>
            <div className={siker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
              {siker
                ? (nehézség !== null && eredmény !== null && eredmény - nehézség >= 6 ? '⚜️ Kiemelt siker' : 'Siker')
                : (nehézség !== null && eredmény !== null && nehézség - eredmény >= 6 ? '⚜️ Kiemelt kudarc' : 'Sikertelen')}
            </div>
            <div className="kep-proba-rolls">
              {ehCímke && <span className={eh.szint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
              k10: {dobás.rolls.map((r, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
              ))}
            </div>
            {renderVállalásEredmény()}
          </div>
        ) : null}
      </div>

      <KepzettsegProbaPickers
        openPicker={openPicker} setOpenPicker={setOpenPicker} resetDobás={resetDobás}
        kiterjesztesek={kiterjesztesek} selKits={selKits} setSelKits={setSelKits}
        kitDotClass={kitDotClass} kitDots={kitDots}
        módosítóTáblák={módosítóTáblák} próbaEnyhítések={próbaEnyhítések}
        szitMods={szitMods} setSzitMods={setSzitMods} multiMods={multiMods} setMultiMods={setMultiMods}
        szitModÖsszeg={szitModÖsszeg}
        képzettségNév={képzettségNév} dobásKomment={dobásKomment}
      />
    </PopupOverlay>
  );
}
