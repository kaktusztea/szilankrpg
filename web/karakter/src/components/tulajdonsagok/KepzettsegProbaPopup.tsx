import { useState } from 'react';
import type { Tulajdonsagok, Fortely } from '../../engine/types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrány, rollDie, type ProbaDobás } from '../../engine/dice';

// Képzettségpróba célszámok (engine_spec §37.2, md/030_06_01) — elnevezés csak 21-ig.
const NEHÉZSÉGEK: { érték: number; label: string }[] = [
  { érték: 6, label: 'Könnyű' },
  { érték: 9, label: 'Átlagos' },
  { érték: 12, label: 'Nehéz' },
  { érték: 15, label: 'Nagyon nehéz' },
  { érték: 18, label: 'Rendkívül nehéz' },
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

type PickerId = 'kit' | null;

interface Props {
  képzettségNév: string;
  szint: number;
  tulajdonságok: Tulajdonsagok;
  kiterjesztesek: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
  képzettségek: { név: string; szint: number }[];
  sérültFok: number;
  onClose: () => void;
}

/**
 * Képzettségpróba dobás popup (Játék mód): Tulajdonság + Képzettség szint + k10 vs célszám.
 * Extrák szekció: Összetett próba, Vállalás, Ellenpróba, Helyettesítés.
 */
export function KepzettsegProbaPopup({
  képzettségNév, szint, tulajdonságok, kiterjesztesek, fortélyFokok, képzettségek, sérültFok, onClose,
}: Props) {
  const [selTul, setSelTul] = useState<keyof Tulajdonsagok | null>(null);
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [selKit, setSelKit] = useState(-1); // -1 = törzstudás (nincs kiterjesztés)
  const [openPicker, setOpenPicker] = useState<PickerId>(null);
  const [nehTöbbi, setNehTöbbi] = useState(false); // 21 feletti célszámok lenyitva?
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);

  // Extrák state
  const [extrákNyitva, setExtrákNyitva] = useState(false);
  const [összetettDb, setÖsszetettDb] = useState(0); // 0=ki, 1-3=másodlagos dobások száma
  const [vállalás, setVállalás] = useState(0); // 0=ki, 1-3
  const [ellenpróba, setEllenpróba] = useState(false);
  const [helyettesítés, setHelyettesítés] = useState<string | null>(null); // képzettség név vagy null

  // Összetett + Vállalás eredmények
  const [összetettEredmény, setÖsszetettEredmény] = useState<ÖsszetettEredmény | null>(null);
  const [vállalásEredmény, setVállalásEredmény] = useState<VállalásEredmény | null>(null);
  const [összetettManual, setÖsszetettManual] = useState<number[]>([]);

  const kit = selKit >= 0 ? kiterjesztesek[selKit] : null;
  const ehAlap = kit ? kiterjesztésElőnyHátrány(kit.típus, fortélyFokok[kit.fortély] ?? 0) : { szint: 0, tiltott: false };
  // Sérülés hatása: fok 1-2 → Hátrány-1/-2 hozzáadódik, fok 3 → automatikus kudarc (nem dobható)
  const sérültTiltott = sérültFok >= 3;
  const ehSzintRaw = ehAlap.szint - Math.min(sérültFok, 2);
  const eh = { szint: Math.max(-2, Math.min(2, ehSzintRaw)), tiltott: ehAlap.tiltott || sérültTiltott };
  const erősTiltott = eh.tiltott;

  // Pötty szín: felvéve → zöld, hiányzó Erős → piros, hiányzó Normál → sárga.
  const kitDotClass = (k: KiterjesztesEntry): string =>
    (fortélyFokok[k.fortély] ?? 0) > 0 ? 'kep-proba-dot-green'
      : k.típus === 'erős' ? 'kep-proba-dot-red' : 'kep-proba-dot-yellow';

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
      return hSzint + vállalás; // helyettesítő kiváltja az eredeti szintet
    }
    return szint + vállalás;
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
                {tulLabel(t)} ({tulajdonságok[t]})
              </button>
            ))}
          </div>
          {!ellenpróba && (
            <div className="kep-proba-dual-col">
              <button className={`he-field-btn${nehézség === -1 ? ' vallas-active' : ''}`}
                onClick={() => { setNehézség(-1); resetDobás(); }}>
                Ismeretlen célszám
              </button>
              {NEHÉZSÉGEK.map(n => (
                <button key={n.érték} className={`he-field-btn${nehézség === n.érték ? ' vallas-active' : ''}`}
                  onClick={() => { setNehézség(n.érték); resetDobás(); }}>
                  {n.érték} ({n.label})
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
              {kit ? <>Kiterjesztő fortély: {kit.fortély} <span className={kitDotClass(kit)}>●</span></> : 'Kiterjesztő fortély: nincs'}
            </button>
          </div>
        )}

        {/* --- Extrák szekció (eltűnik ha van eredmény) --- */}
        {!vanEredmény && (
        <div className="kep-proba-extras-box">
          <button className="kep-proba-extras-toggle" onClick={() => setExtrákNyitva(v => !v)}>
            Extrák {extrákNyitva ? '▴' : '▾'}
          </button>
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
          <div className="kep-proba-tiltott">{sérültTiltott ? 'Haldoklás — Automatikus kudarc' : 'Nem dobhatsz'}</div>
        ) : !vanEredmény ? (
          <>
            {kész && !ellenpróba && !ismeretlen && (
              <div className="kep-proba-summary">
                {effSzint} + {tulÉrték}{vállalás > 0 ? ` (+${vállalás})` : ''} <span className="kep-proba-vs">vs</span> <span className="kep-proba-celszam">{nehézség}</span>
              </div>
            )}
            {kész && (ellenpróba || ismeretlen) && (
              <div className="kep-proba-summary">
                {effSzint} + {tulÉrték}{vállalás > 0 ? ` (+${vállalás})` : ''} + k10
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <div className="dobas-btn-row">
                <button className="kep-proba-roll-btn" disabled={!kész} onClick={handleDobás}>
                  {sérültFok === 1 && <span className="kep-proba-roll-serult">S3</span>}
                  {sérültFok === 2 && <span className="kep-proba-roll-serult">S4</span>}
                  Dobás
                  {ehCímke && <span className={`kep-proba-roll-eh${eh.szint > 0 ? ' kep-proba-eh-előny' : ''}`}>{ehCímke}</span>}
                </button>
                <ManualDicePicker sides={10} szint={eh.szint} onSelect={handleManualK10} disabled={!kész} alapÉrték={tulÉrték + effSzint} alapLabel={összetettManualLabel ?? 'Alap'} forceOpen={összetettManual.length > 0} />
              </div>
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

      {openPicker !== null && (
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
                  {k.fortély} <span className={kitDotClass(k)}>●</span>
                </button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </PopupOverlay>
  );
}
