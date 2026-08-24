import { useState, useRef } from 'react';
import type { Tulajdonsagok, Fortely } from '../../engine/types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import type { ModositoTabla, ModositoSor, PróbaEnyhítés, StatuszEntry } from '../../engine/data-types';
import { calcStátuszPróbaEH } from '../../engine/statusz-proba';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrány, rollDie, type ProbaDobás } from '../../engine/dice';

// Képzettségpróba célszámok (engine_spec §37.2, md/030_06_01) — elnevezés csak 21-ig.
const NEHÉZSÉGEK: { érték: number; label: string }[] = [
  { érték: 6, label: 'Könnyű' },
  { érték: 9, label: 'Átlagos' },
  { érték: 12, label: 'Nehéz' },
  { érték: 15, label: 'N. nehéz' },
  { érték: 18, label: 'Rendkívüli' },
  { érték: 21, label: 'Emberfeletti' },
];
// 21 felett nincs elnevezés (max 30), a picker lenyitható részében jelenik meg.
const NEHÉZSÉGEK_EXTRA = [24, 27, 30];

const MIND_TULAJDONSÁG: (keyof Tulajdonsagok)[] = [
  'erő', 'edzettség', 'ügyesség', 'gyorsaság', 'intelligencia', 'emlékezet', 'önuralom', 'érzékenység',
];

// Domináns tulajdonság display név (nagybetűs, pl. "Ügyesség") → séma kulcs (kisbetűs).
export function tulKulcs(display: string): keyof Tulajdonsagok {
  return display.toLowerCase() as keyof Tulajdonsagok;
}
function tulLabel(kulcs: string): string {
  return kulcs.charAt(0).toUpperCase() + kulcs.slice(1);
}
function nehézségLabel(érték: number): string {
  return NEHÉZSÉGEK.find(n => n.érték === érték)?.label ?? '';
}
export function nehézségDisplay(érték: number): string {
  const l = nehézségLabel(érték);
  return l ? `${érték} (${l})` : `${érték}`;
}

/** A próba lehetetlen, ha még a max k10 (10) dobással sem érhető el a célszám. */
export function probaLehetetlen(tulÉrték: number, szint: number, célszám: number): boolean {
  return tulÉrték + szint + 10 < célszám;
}

/** A próba biztos siker, ha min k10 (1) dobással is eléri a célszámot. */
export function probaBiztosSiker(tulÉrték: number, szint: number, célszám: number): boolean {
  return tulÉrték + szint + 1 >= célszám;
}

/** Fortély név → felvett (max) fok. Többszörös fortélynél a legmagasabb példány foka. */
export function buildFortélyFokok(fortélyok: Fortely[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const f of fortélyok) m[f.név] = Math.max(m[f.név] ?? 0, f.fok);
  return m;
}

/**
 * Képzettség-kiterjesztés fok → próba Előny/Hátrány szint (md/030_08_01).
 * Normál 0.fok: Hátrány-2. Erős 0.fok: nem dobható. 1.fok: 0, 2.fok: Előny+1, 3.fok: Előny+2.
 */
export function kiterjesztésElőnyHátrány(típus: 'normál' | 'erős', fok: number): { szint: number; tiltott: boolean } {
  if (fok <= 0) return típus === 'erős' ? { szint: 0, tiltott: true } : { szint: -2, tiltott: false };
  return { szint: Math.min(fok - 1, 2), tiltott: false };
}

/** Előny/Hátrány szint → megjelenítendő címke (pl. "Előny+1", "Hátrány-2", "" ha sima). */
export function előnyHátrányLabel(szint: number): string {
  if (szint > 0) return `Előny+${szint}`;
  if (szint < 0) return `Hátrány${szint}`;
  return '';
}

/** Képzettségpróba sikeres, ha Tulajdonság + Képzettség szint + k10 ≥ célszám. */
export function probaSiker(tulÉrték: number, szint: number, k10: number, célszám: number): boolean {
  return tulÉrték + szint + k10 >= célszám;
}

// --- Összetett próba eredmény típus ---
interface ÖsszetettSor {
  label: string;       // "Elsődleges" / "Másodlagos"
  célszám: number;
  dobás: ProbaDobás;
  összeg: number;      // tul + szint + (vállalás) + k10 eredmény
  siker: boolean;
}

interface ÖsszetettEredmény {
  sorok: ÖsszetettSor[];
  összSiker: boolean;
}

// --- Vállalás próba eredmény ---
interface VállalásEredmény {
  k6: number;
  vállalásÉrték: number;
  kritikusHiba: boolean;
}

type PickerId = 'kit' | 'szit' | null;

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
  szerepjátékosMódosító: boolean;
  onClose: () => void;
}

/**
 * Képzettségpróba dobás popup (Játék mód): Tulajdonság + Képzettség szint + k10 vs célszám.
 * Extrák szekció: Összetett próba, Vállalás, Ellenpróba, Helyettesítés.
 */
export function KepzettsegProbaPopup({
  képzettségNév, képzettségCsoport, szint, tulajdonságok, kiterjesztesek, fortélyFokok, képzettségek, aktívStátuszok, statuszDefs, módosítóTáblák, próbaEnyhítések, szerepjátékosMódosító, onClose,
}: Props) {
  const [selTul, setSelTul] = useState<keyof Tulajdonsagok | null>(null);
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [selKit, setSelKit] = useState(-1); // -1 = törzstudás (nincs kiterjesztés)
  const [openPicker, setOpenPicker] = useState<PickerId>(null);
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
      if (t.mód === 'multi' || t.mód === 'chips') continue;
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

  // Szerepjátékos módosító: [-3..+3], 0 = nincs kiválasztva
  const [szerepjátékosÉrték, setSzerepjátékosÉrték] = useState(0);

  // Enyhítés helper
  const enyhítSor = (kategória: string, sor: ModositoSor): number => {
    const raw = sor.érték;
    if (raw >= 0) return raw;
    const enyhítés = próbaEnyhítések
      .filter(e => e.kategória === kategória && (e.sorok.length === 0 || e.sorok.includes(sor.leírás)))
      .reduce((max, e) => Math.max(max, e.érték), 0);
    if (enyhítés >= 999) return 0;
    return Math.min(0, raw + enyhítés);
  };

  const szitModÖsszeg = módosítóTáblák.reduce((sum, t) => {
    if (t.mód === 'multi') {
      const flags = multiMods[t.kategória];
      if (!flags) return sum;
      return sum + t.sorok.reduce((s, sor, i) => s + (flags[i] ? enyhítSor(t.kategória, sor) : 0), 0);
    }
    const idx = szitMods[t.kategória];
    if (idx == null || idx < 0) return sum;
    return sum + enyhítSor(t.kategória, t.sorok[idx]);
  }, 0) + szerepjátékosÉrték;

  const kit = selKit >= 0 ? kiterjesztesek[selKit] : null;
  const ehAlap = kit ? kiterjesztésElőnyHátrány(kit.típus, fortélyFokok[kit.fortély] ?? 0) : { szint: 0, tiltott: false };
  // Státuszok hatása a képzettségpróbára (Előny/Hátrány + letilt)
  const státuszEH = calcStátuszPróbaEH(aktívStátuszok, statuszDefs, képzettségNév, képzettségCsoport);
  const ehSzintRaw = ehAlap.szint + státuszEH.szint;
  const eh = { szint: Math.max(-2, Math.min(2, ehSzintRaw)), tiltott: ehAlap.tiltott || státuszEH.tiltott };
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
  const effSzint = (() => {
    if (helyettesítés) {
      const hKep = képzettségek.find(k => k.név === helyettesítés);
      const hSzint = hKep ? Math.min(5, Math.floor(hKep.szint / 3)) : 0;
      return hSzint + vállalás + szitModÖsszeg;
    }
    return szint + vállalás + szitModÖsszeg;
  })();
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
      const célszámok = [nehézség, ...Array(összetettDb).fill(nehézség - 3)];
      const labels = ['Elsődleges', ...Array(összetettDb).fill('Másodlagos')];
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
      const célszámok = [nehézség, ...Array(összetettDb).fill(nehézség - 3)];
      const labels = ['Elsődleges', ...Array(összetettDb).fill('Másodlagos')];
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
              {kit ? <>Kiterjesztő fortély: {kit.fortély} <span className={kitDotClass(kit)}>{kitDots(kit)}</span></> : 'Kiterjesztő fortély: nincs'}
            </button>
          </div>
        )}

        {/* --- Módosító értékek chip (opens picker popup) --- */}
        {(módosítóTáblák.length > 0 || szerepjátékosMódosító) && (
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
                        <div className="kep-proba-eh-bontas-sor">Kiterjesztés ({kit?.fortély ?? '–'}): {előnyHátrányLabel(ehAlap.szint)}</div>
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

      {openPicker === 'kit' && (
        <PopupOverlay onClose={() => setOpenPicker(null)}>
          <div className="kep-prompt vallas-picker" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold-mb">Kiterjesztő fortély</label>
            <div className="kep-prompt-flex-col-list">
              <button className={`he-field-btn${selKit === -1 ? ' vallas-active' : ''}`}
                onClick={() => { setSelKit(-1); resetDobás(); setOpenPicker(null); }}>
                nincs ❌
              </button>
              {kiterjesztesek.map((k, i) => (
                <button key={i} className={`he-field-btn${selKit === i ? ' vallas-active' : ''}`}
                  onClick={() => { setSelKit(i); resetDobás(); setOpenPicker(null); }}>
                  {k.fortély} <span className={kitDotClass(k)}>{kitDots(k)}</span>
                </button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}

      {openPicker === 'szit' && (
        <PopupOverlay onClose={() => { setOpenPicker(null); resetDobás(); }}>
          <div className="kep-prompt kep-proba-szit-popup" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold-mb">Helyzetfüggő módosítók</label>
            <div className="kep-proba-szit-body">
              {módosítóTáblák.map(t => (
                <div key={t.kategória} className="kep-proba-szit-cat">
                  <span className="kep-proba-szit-label">{t.kategória}</span>
                  {t.mód === 'chips' ? (
                    <div className="kep-proba-szerepjatekos-chips">
                      {t.sorok.map((s, i) => {
                        const isActive = szitMods[t.kategória] === i;
                        return (
                          <button key={i}
                            className={`fort-fok-btn kep-proba-szerepjatekos-chip${isActive ? ' active' : ''}${s.érték > 0 ? ' kep-proba-szerepjatekos-pos' : ' kep-proba-szerepjatekos-neg'}`}
                            onClick={() => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }))}>
                            {s.érték > 0 ? `+${s.érték}` : s.érték}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                  <div className="kep-proba-szit-items">
                    {t.sorok.map((s, i) => {
                      // Enyhítés kalkuláció a sorra
                      let enyhítettÉrték = s.érték;
                      let immunis = false;
                      if (s.érték < 0) {
                        const enyhítés = próbaEnyhítések
                          .filter(e => e.kategória === t.kategória && (e.sorok.length === 0 || e.sorok.includes(s.leírás)))
                          .reduce((max, e) => Math.max(max, e.érték), 0);
                        if (enyhítés >= 999) { immunis = true; enyhítettÉrték = 0; }
                        else enyhítettÉrték = Math.min(0, s.érték + enyhítés);
                      }
                      const isMulti = t.mód === 'multi';
                      const isActive = isMulti ? !!(multiMods[t.kategória]?.[i]) : szitMods[t.kategória] === i;
                      const handleClick = isMulti
                        ? () => setMultiMods(m => ({ ...m, [t.kategória]: m[t.kategória].map((v, j) => j === i ? !v : v) }))
                        : () => setSzitMods(m => ({ ...m, [t.kategória]: m[t.kategória] === i ? -1 : i }));
                      return (
                      <button key={i}
                        className={`kep-proba-szit-item${isActive ? ' kep-proba-szit-item-active' : ''}${immunis || enyhítettÉrték !== s.érték ? ' kep-proba-szit-enyhitett' : s.érték > 0 ? ' kep-proba-szit-pos' : s.érték < 0 ? ' kep-proba-szit-neg' : ''}`}
                        onClick={handleClick}>
                        <span className="kep-proba-szit-val">
                          {immunis || enyhítettÉrték !== s.érték
                            ? <><span className="kep-proba-szit-old">{s.érték}</span><span className="kep-proba-szit-arrow">→</span><span className="kep-proba-szit-new">{immunis ? 0 : enyhítettÉrték}</span></>
                            : <>{s.érték > 0 ? '+' : ''}{s.érték}</>}
                        </span>
                        <span className="kep-proba-szit-desc">{s.leírás}</span>
                      </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              ))}
              {szerepjátékosMódosító && (
                <div className="kep-proba-szit-cat">
                  <span className="kep-proba-szit-label">Szerepjátékos módosító</span>
                  <div className="kep-proba-szerepjatekos-chips">
                    {[-3, -2, -1, 1, 2, 3].map(v => (
                      <button key={v}
                        className={`fort-fok-btn kep-proba-szerepjatekos-chip${szerepjátékosÉrték === v ? ' active' : ''}${v > 0 ? ' kep-proba-szerepjatekos-pos' : ' kep-proba-szerepjatekos-neg'}`}
                        onClick={() => setSzerepjátékosÉrték(szerepjátékosÉrték === v ? 0 : v)}>
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {szitModÖsszeg !== 0 && (
              <div className={`kep-proba-szit-sum-footer${szitModÖsszeg > 0 ? ' kep-proba-szit-pos' : ' kep-proba-szit-neg'}`}>
                Összesen: {szitModÖsszeg > 0 ? '+' : ''}{szitModÖsszeg}
              </div>
            )}
          </div>
        </PopupOverlay>
      )}
    </PopupOverlay>
  );
}
