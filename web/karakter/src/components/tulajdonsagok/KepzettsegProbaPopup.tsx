import { useState } from 'react';
import type { Tulajdonsagok, Fortely } from '../../engine/types';
import type { KiterjesztesEntry } from '../../engine/data-loader';
import { PopupOverlay } from '../PopupOverlay';
import { rollElőnyHátrány, type ProbaDobás } from '../../engine/dice';

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

type PickerId = 'kit' | 'tul' | 'neh' | null;

interface Props {
  képzettségNév: string;
  szint: number;
  tulajdonságok: Tulajdonsagok;
  kiterjesztesek: KiterjesztesEntry[];
  fortélyFokok: Record<string, number>;
  onClose: () => void;
}

/**
 * Képzettségpróba dobás popup (Játék mód): Tulajdonság + Képzettség szint + k10 vs célszám.
 * Három overlay picker (Kiterjesztés / Tulajdonság / Nehézség). Kiterjesztés Előny/Hátrány
 * rendszer a fortély foka szerint (§030_08_01): Erős 0.fok → nem dobható.
 */
export function KepzettsegProbaPopup({
  képzettségNév, szint, tulajdonságok, kiterjesztesek, fortélyFokok, onClose,
}: Props) {
  const [selTul, setSelTul] = useState<keyof Tulajdonsagok | null>(null);
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [selKit, setSelKit] = useState(-1); // -1 = törzstudás (nincs kiterjesztés)
  const [openPicker, setOpenPicker] = useState<PickerId>(null);
  const [nehTöbbi, setNehTöbbi] = useState(false); // 21 feletti célszámok lenyitva?
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);

  const kit = selKit >= 0 ? kiterjesztesek[selKit] : null;
  const eh = kit ? kiterjesztésElőnyHátrány(kit.típus, fortélyFokok[kit.fortély] ?? 0) : { szint: 0, tiltott: false };
  const erősTiltott = eh.tiltott;

  // Pötty szín: felvéve → zöld, hiányzó Erős → piros, hiányzó Normál → sárga.
  const kitDotClass = (k: KiterjesztesEntry): string =>
    (fortélyFokok[k.fortély] ?? 0) > 0 ? 'kep-proba-dot-green'
      : k.típus === 'erős' ? 'kep-proba-dot-red' : 'kep-proba-dot-yellow';

  const resetDobás = () => setDobás(null);
  const kész = selTul !== null && nehézség !== null;
  const tulÉrték = selTul !== null ? tulajdonságok[selTul] : 0;
  // Lehetetlen: még a max k10 (10) dobással sem érhető el a célszám.
  const lehetetlen = kész && probaLehetetlen(tulÉrték, szint, nehézség!);
  const eredmény = dobás !== null && kész ? tulÉrték + szint + dobás.eredmény : null;
  const siker = eredmény !== null && nehézség !== null && probaSiker(tulÉrték, szint, dobás!.eredmény, nehézség);
  const ehCímke = előnyHátrányLabel(eh.szint);

  return (
    <PopupOverlay onClose={onClose}>
      <div className="kep-proba-popup">
        <div className="kep-proba-header">Képzettségpróba</div>
        <div className="kep-proba-subtitle">{képzettségNév} ({szint})</div>

        <div className="kep-proba-row">
          {kiterjesztesek.length > 0 && (
            <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('kit')}>
              {kit ? <>{kit.fortély} <span className={kitDotClass(kit)}>●</span></> : 'Kiterjesztés'}
            </button>
          )}
          <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('tul')}>
            {selTul !== null ? `${tulLabel(selTul)} (${tulajdonságok[selTul]})` : 'Tulajdonság'}
          </button>
          <button className="he-field-btn kep-proba-kit-btn" onClick={() => setOpenPicker('neh')}>
            {nehézség !== null ? nehézségDisplay(nehézség) : 'Nehézség'}
          </button>
        </div>

        {erősTiltott ? (
          <div className="kep-proba-tiltott">Nem dobhatsz</div>
        ) : eredmény === null ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                {szint} + {tulÉrték} <span className="kep-proba-vs">vs</span> <span className="kep-proba-celszam">{nehézség}</span>
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : (
              <button className="kep-proba-roll-btn" disabled={!kész} onClick={() => setDobás(rollElőnyHátrány(eh.szint))}>
                Dobás
                {ehCímke && <span className={`kep-proba-roll-eh${eh.szint > 0 ? ' kep-proba-eh-előny' : ''}`}>{ehCímke}</span>}
              </button>
            )}
          </>
        ) : (
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {eredmény}<span className="kep-proba-result-vs"> vs </span><span className="kep-proba-result-cel">{nehézség}</span>
            </div>
            {ehCímke && <div className={`kep-proba-eh${eh.szint > 0 ? ' kep-proba-eh-előny' : ''}`}>{ehCímke} — dobások: {dobás!.rolls.join(', ')}</div>}
            <div className={siker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
              {siker ? 'Siker' : 'Sikertelen'}
            </div>
          </div>
        )}
      </div>

      {openPicker !== null && (
        <PopupOverlay onClose={() => setOpenPicker(null)}>
          <div className="kep-prompt vallas-picker" onClick={e => e.stopPropagation()}>
            {openPicker === 'kit' && (<>
              <label className="kep-prompt-label-bold-mb">Kiterjesztő fortély</label>
              <div className="kep-prompt-flex-col-list">
                <button className={`he-field-btn${selKit === -1 ? ' vallas-active' : ''}`}
                  onClick={() => { setSelKit(-1); resetDobás(); setOpenPicker(null); }}>
                  Kiterjesztés
                </button>
                {kiterjesztesek.map((k, i) => (
                  <button key={i} className={`he-field-btn${selKit === i ? ' vallas-active' : ''}`}
                    onClick={() => { setSelKit(i); resetDobás(); setOpenPicker(null); }}>
                    {k.fortély} <span className={kitDotClass(k)}>●</span>
                  </button>
                ))}
              </div>
            </>)}
            {openPicker === 'tul' && (<>
              <label className="kep-prompt-label-bold-mb">Tulajdonság</label>
              <div className="kep-prompt-flex-col-list">
                {MIND_TULAJDONSÁG.map(t => (
                  <button key={t} className={`he-field-btn${selTul === t ? ' vallas-active' : ''}`}
                    onClick={() => { setSelTul(t); resetDobás(); setOpenPicker(null); }}>
                    {tulLabel(t)} ({tulajdonságok[t]})
                  </button>
                ))}
              </div>
            </>)}
            {openPicker === 'neh' && (<>
              <label className="kep-prompt-label-bold-mb">Nehézség</label>
              <div className="kep-prompt-flex-col-list">
                {NEHÉZSÉGEK.map(n => (
                  <button key={n.érték} className={`he-field-btn${nehézség === n.érték ? ' vallas-active' : ''}`}
                    onClick={() => { setNehézség(n.érték); resetDobás(); setOpenPicker(null); }}>
                    {n.érték} ({n.label})
                  </button>
                ))}
                {!nehTöbbi ? (
                  <button className="he-field-btn kep-proba-neh-tobbi" onClick={() => setNehTöbbi(true)}>▾</button>
                ) : (
                  NEHÉZSÉGEK_EXTRA.map(é => (
                    <button key={é} className={`he-field-btn${nehézség === é ? ' vallas-active' : ''}`}
                      onClick={() => { setNehézség(é); resetDobás(); setOpenPicker(null); }}>
                      {é}
                    </button>
                  ))
                )}
              </div>
            </>)}
          </div>
        </PopupOverlay>
      )}
    </PopupOverlay>
  );
}
