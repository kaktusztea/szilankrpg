import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
import { ManualDicePicker } from '../harc/ManualDicePicker';
import { rollElőnyHátrányK6, type ProbaDobás } from '../../engine/dice';
import { előnyHátrányLabel } from './KepzettsegProbaPopup';

// Tulajdonságpróba célszámok (engine_spec §37.1, md/010_05_04)
const NEHÉZSÉGEK: { érték: number; label: string }[] = [
  { érték: 3, label: 'Könnyű' },
  { érték: 4, label: 'Átlagos' },
  { érték: 5, label: 'Nehéz' },
  { érték: 6, label: 'Nagyon nehéz' },
  { érték: 7, label: 'Rendkívül nehéz' },
  { érték: 8, label: 'Emberfeletti' },
];

const ELŐNY_HÁTRÁNY: { szint: number; label: string }[] = [
  { szint: -2, label: 'Hátrány-2' },
  { szint: -1, label: 'Hátrány-1' },
  { szint: 0, label: '—' },
  { szint: 1, label: 'Előny+1' },
  { szint: 2, label: 'Előny+2' },
];

/** Tulajdonságpróba lehetetlen, ha max k6 (6) dobással sem éri el a célszámot. */
export function tulProbaLehetetlen(tulÉrték: number, célszám: number): boolean {
  return tulÉrték + 6 < célszám;
}

/** Tulajdonságpróba biztos siker, ha min k6 (1) dobással is eléri a célszámot. */
export function tulProbaBiztosSiker(tulÉrték: number, célszám: number): boolean {
  return tulÉrték + 1 >= célszám;
}

// --- Összetett próba eredmény típus ---
interface ÖsszetettSor {
  label: string;
  célszám: number;
  dobás: ProbaDobás;
  összeg: number;
  siker: boolean;
}

interface ÖsszetettEredmény {
  sorok: ÖsszetettSor[];
  összSiker: boolean;
}

interface Props {
  tulajdonságNév: string;
  érték: number;
  onClose: () => void;
}

/**
 * Tulajdonságpróba dobás popup (Játék mód): Tulajdonság + k6 vs célszám.
 * Extrák szekció: Előny/Hátrány, Összetett próba, Ellenpróba.
 */
export function TulajdonsagProbaPopup({ tulajdonságNév, érték, onClose }: Props) {
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);

  // Extrák state
  const [extrákNyitva, setExtrákNyitva] = useState(false);
  const [ehSzint, setEhSzint] = useState(0);
  const [összetettDb, setÖsszetettDb] = useState(0); // 0=ki, 1-3
  const [ellenpróba, setEllenpróba] = useState(false);

  // Összetett eredmény
  const [összetettEredmény, setÖsszetettEredmény] = useState<ÖsszetettEredmény | null>(null);
  const [összetettManual, setÖsszetettManual] = useState<number[]>([]);

  const resetDobás = () => {
    setDobás(null);
    setÖsszetettEredmény(null);
    setÖsszetettManual([]);
  };

  // Ellenpróba módban nincs célszám szükséges
  const ismeretlen = nehézség === -1;
  const kész = ellenpróba || nehézség !== null;
  const lehetetlen = !ellenpróba && !ismeretlen && kész && nehézség !== null && tulProbaLehetetlen(érték, nehézség);
  const biztosSiker = !ellenpróba && !ismeretlen && kész && nehézség !== null && !lehetetlen && tulProbaBiztosSiker(érték, nehézség);
  const eredmény = dobás !== null && kész ? érték + dobás.eredmény : null;
  const siker = !ellenpróba && !ismeretlen && eredmény !== null && nehézség !== null && eredmény >= nehézség;
  const ehCímke = előnyHátrányLabel(ehSzint);

  const label = tulajdonságNév.charAt(0).toUpperCase() + tulajdonságNév.slice(1);

  // Van-e eredmény megjelenítendő?
  const vanEredmény = összetettDb > 0 ? összetettEredmény !== null : dobás !== null;

  // --- Dobás logika ---
  const handleDobás = () => {
    if (összetettDb > 0 && nehézség !== null) {
      // Összetett próba: 1 elsődleges + N másodlagos (célszám -1 fokozattal)
      const sorok: ÖsszetettSor[] = [];
      const célszámok = [nehézség, ...Array(összetettDb).fill(nehézség - 1)];
      const labels = ['Elsődleges', ...Array(összetettDb).fill('Másodlagos')];
      for (let i = 0; i < célszámok.length; i++) {
        const d = rollElőnyHátrányK6(ehSzint);
        const összeg = érték + d.eredmény;
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
      setDobás(rollElőnyHátrányK6(ehSzint));
    }
  };

  const handleManualK6 = (value: number) => {
    if (összetettDb > 0 && nehézség !== null) {
      const rolls = [...összetettManual, value];
      const total = összetettDb + 1; // 1 elsődleges + N másodlagos
      if (rolls.length < total) {
        setÖsszetettManual(rolls);
        return;
      }
      // All collected → finalize
      const célszámok = [nehézség, ...Array(összetettDb).fill(nehézség - 1)];
      const labels = ['Elsődleges', ...Array(összetettDb).fill('Másodlagos')];
      const sorok: ÖsszetettSor[] = rolls.map((v, i) => {
        const d: ProbaDobás = { rolls: [v], eredmény: v };
        const összeg = érték + d.eredmény;
        return { label: labels[i], célszám: célszámok[i], dobás: d, összeg, siker: összeg >= célszámok[i] };
      });
      setÖsszetettEredmény({ sorok, összSiker: sorok.every(s => s.siker) });
      setDobás(sorok[0].dobás);
      setÖsszetettManual([]);
    } else {
      setDobás({ rolls: [value], eredmény: value });
    }
  };

  /** Label for the current manual összetett step. */
  const összetettManualLabel = összetettDb > 0 && összetettManual.length < összetettDb + 1
    ? (összetettManual.length === 0 ? 'Elsődleges' : `Másodlagos ${összetettManual.length}/${összetettDb}`)
    : null;

  const handleOuterClose = () => onClose();

  return (
    <PopupOverlay onClose={handleOuterClose}>
      <div className="kep-proba-popup">
        <div className="kep-proba-header">
          <button className="kep-proba-close-btn" onClick={onClose} title="Bezárás">✕</button>
          Tulajdonságpróba
          <button
            className="kep-proba-reset-btn"
            disabled={!vanEredmény}
            onClick={resetDobás}
            title="Újradobás"
          >⟲</button>
        </div>
        <div className="kep-proba-subtitle">{label} ({érték})</div>

        {!ellenpróba && (
          <div className="kep-proba-neh-list">
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
              {/* Előny / Hátrány */}
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Előny/Hátrány:</span>
                <div className="kep-proba-extras-btns">
                  {ELŐNY_HÁTRÁNY.map(e => (
                    <button key={e.szint}
                      className={`kep-proba-extras-btn${ehSzint === e.szint ? ' kep-proba-extras-btn-active' : ''}`}
                      onClick={() => { setEhSzint(e.szint); resetDobás(); }}>
                      {e.szint === 0 ? '—' : e.szint > 0 ? `+${e.szint}` : `${e.szint}`}
                    </button>
                  ))}
                </div>
              </div>
              {/* Összetett próba */}
              <div className="kep-proba-extras-row">
                <span className="kep-proba-extras-label">Összetett próba:</span>
                <div className="kep-proba-extras-btns">
                  {[1, 2, 3].map(n => (
                    <button key={n}
                      className={`kep-proba-extras-btn${összetettDb === n ? ' kep-proba-extras-btn-active' : ''}`}
                      disabled={ellenpróba}
                      title={`${n}db Másodlagos dobás (-1)`}
                      onClick={() => { setÖsszetettDb(összetettDb === n ? 0 : n); resetDobás(); }}>
                      +{n}M
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
            </div>
          )}
        </div>
        )}

        {/* --- Dobás / Eredmény szekció --- */}
        {!vanEredmény ? (
          <>
            {kész && !ellenpróba && !ismeretlen && (
              <div className="kep-proba-summary">
                {érték} <span className="kep-proba-vs">vs</span> <span className="kep-proba-celszam">{nehézség}</span>
              </div>
            )}
            {kész && (ellenpróba || ismeretlen) && (
              <div className="kep-proba-summary">
                {érték} + k6
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <div className="dobas-btn-row">
                <button className="kep-proba-roll-btn" disabled={!kész} onClick={handleDobás}>
                  Dobás
                  {ehCímke && <span className={`kep-proba-roll-eh${ehSzint > 0 ? ' kep-proba-eh-előny' : ''}`}>{ehCímke}</span>}
                </button>
                <ManualDicePicker sides={6} szint={ehSzint} onSelect={handleManualK6} disabled={!kész} alapÉrték={érték} alapLabel={összetettManualLabel ?? label} forceOpen={összetettManual.length > 0} />
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
          </div>
        ) : (ellenpróba || ismeretlen) && dobás ? (
          /* --- Ellenpróba / Ismeretlen eredmény (csak szám, nincs vs) --- */
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {érték + dobás.eredmény}
            </div>
            <div className="kep-proba-rolls">
              {ehCímke && <span className={ehSzint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
              k6: {dobás.rolls.map((r, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
              ))}
            </div>
          </div>
        ) : dobás ? (
          /* --- Sima eredmény --- */
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {eredmény}<span className="kep-proba-result-vs"> vs </span><span className="kep-proba-result-cel">{nehézség}</span>
            </div>
            <div className={siker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
              {siker
                ? (nehézség !== null && eredmény !== null && eredmény - nehézség >= 3 ? '⚜️ Kiemelt siker' : 'Siker')
                : (nehézség !== null && eredmény !== null && nehézség - eredmény >= 3 ? '⚜️ Kiemelt kudarc' : 'Sikertelen')}
            </div>
            <div className="kep-proba-rolls">
              {ehCímke && <span className={ehSzint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
              k6: {dobás.rolls.map((r, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PopupOverlay>
  );
}
