import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';
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

interface Props {
  tulajdonságNév: string;
  érték: number;
  onClose: () => void;
}

/**
 * Tulajdonságpróba dobás popup (Játék mód): Tulajdonság + k6 vs célszám.
 * Nehézség inline gombok + Előny/Hátrány picker.
 */
export function TulajdonsagProbaPopup({ tulajdonságNév, érték, onClose }: Props) {
  const [nehézség, setNehézség] = useState<number | null>(null);
  const [ehSzint, setEhSzint] = useState(0);
  const [showEhPicker, setShowEhPicker] = useState(false);
  const [dobás, setDobás] = useState<ProbaDobás | null>(null);

  const kész = nehézség !== null;
  const lehetetlen = kész && tulProbaLehetetlen(érték, nehézség!);
  const biztosSiker = kész && !lehetetlen && tulProbaBiztosSiker(érték, nehézség!);
  const eredmény = dobás !== null && kész ? érték + dobás.eredmény : null;
  const siker = eredmény !== null && nehézség !== null && eredmény >= nehézség;
  const ehCímke = előnyHátrányLabel(ehSzint);

  const label = tulajdonságNév.charAt(0).toUpperCase() + tulajdonságNév.slice(1);

  // Escape: ha belső picker nyitva → azt zárjuk, ne a teljes popup-ot.
  const handleOuterClose = () => {
    if (showEhPicker) { setShowEhPicker(false); return; }
    onClose();
  };

  return (
    <PopupOverlay onClose={handleOuterClose}>
      <div className="kep-proba-popup">
        <div className="kep-proba-header">
          Tulajdonságpróba
          <button
            className="kep-proba-reset-btn"
            disabled={dobás === null}
            onClick={() => setDobás(null)}
            title="Újradobás"
          >⟲</button>
        </div>
        <div className="kep-proba-subtitle">{label} ({érték})</div>

        <div className="kep-proba-neh-list">
          {NEHÉZSÉGEK.map(n => (
            <button key={n.érték} className={`he-field-btn${nehézség === n.érték ? ' vallas-active' : ''}`}
              onClick={() => { setNehézség(n.érték); setDobás(null); }}>
              {n.érték} ({n.label})
            </button>
          ))}
        </div>

        <div className="kep-proba-row">
          <button className="he-field-btn kep-proba-kit-btn" onClick={() => setShowEhPicker(true)}>
            {ehSzint !== 0 ? ELŐNY_HÁTRÁNY.find(e => e.szint === ehSzint)?.label : '→ Előny / Hátrány'}
          </button>
        </div>

        {eredmény === null ? (
          <>
            {kész && (
              <div className="kep-proba-summary">
                {érték} <span className="kep-proba-vs">vs</span> <span className="kep-proba-celszam">{nehézség}</span>
              </div>
            )}
            {lehetetlen ? (
              <div className="kep-proba-tiltott">Lehetetlen</div>
            ) : biztosSiker ? (
              <div className="kep-proba-biztos">Biztos siker</div>
            ) : (
              <button className="kep-proba-roll-btn" disabled={!kész} onClick={() => setDobás(rollElőnyHátrányK6(ehSzint))}>
                Dobás
                {ehCímke && <span className={`kep-proba-roll-eh${ehSzint > 0 ? ' kep-proba-eh-előny' : ''}`}>{ehCímke}</span>}
              </button>
            )}
          </>
        ) : (
          <div className="kep-proba-result">
            <div className="kep-proba-result-num">
              {eredmény}<span className="kep-proba-result-vs"> vs </span><span className="kep-proba-result-cel">{nehézség}</span>
            </div>
            <div className={siker ? 'kep-proba-siker' : 'kep-proba-sikertelen'}>
              {siker ? 'Siker' : 'Sikertelen'}
            </div>
            <div className="kep-proba-rolls">
              {ehCímke && <span className={ehSzint > 0 ? 'kep-proba-eh-előny' : 'kep-proba-eh'}>{ehCímke} · </span>}
              k6: {dobás!.rolls.map((r, i) => (
                <span key={i}>{i > 0 ? ' ' : ''}<span className={r === dobás!.eredmény ? 'kep-proba-roll-sel' : ''}>{r}</span></span>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEhPicker && (
        <PopupOverlay onClose={() => setShowEhPicker(false)}>
          <div className="kep-prompt vallas-picker" onClick={e => e.stopPropagation()}>
            <label className="kep-prompt-label-bold-mb">Előny / Hátrány</label>
            <div className="kep-prompt-flex-col-list">
              {ELŐNY_HÁTRÁNY.map(e => (
                <button key={e.szint} className={`he-field-btn${ehSzint === e.szint ? ' vallas-active' : ''}`}
                  onClick={() => { setEhSzint(e.szint); setDobás(null); setShowEhPicker(false); }}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </PopupOverlay>
  );
}
