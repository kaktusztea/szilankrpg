import { useState, useEffect, useMemo } from 'react';
import { Ikon } from '../common/Ikon';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { KeziBonuszBtn } from '../dobas/KeziBonuszBtn';
import { HelyzetPickerPopup } from '../picker/HelyzetPickerPopup';
import { aktívTerületen } from '../../engine/taktika/taktika-helpers';
import { calcHarcComputed } from '../../engine/harc/harc-computed';
import { collectKéDobásInfo, helyzetDobásMegjegyzések, netElőnySzint } from '../../engine/harc/combat-roll-info';
import { rollElőnyHátrányK20, előnyHátrányLabel, type ProbaDobás } from '../../engine/dice';
import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, UndoPatch } from '../../engine/types';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  /** A végeredmény (KÉ + k20), vagy `null`, ha a dobás előtt zárták be (nem kerül előzménybe). */
  onClose: (eredmény: number | null) => void;
}

interface KéEredmény {
  alap: number;
  kézi: number;
  dobás: ProbaDobás;
  eredmény: number;
}

/**
 * Kezdeményezés (KÉ) dobás popup - two-phase, a Támadó dobás mintájára:
 *  Phase 1: KÉ + k20 képlet, Harci helyzet / Bónusz kapszulák, Előny/Hátrány léptető + források, Dobás
 *  Phase 2: eredmény (a bontás a szám melletti nyíl mögött)
 * A KÉ alapértéket és a feltétel-kiértékelőt maga számolja a session-ből (a helyzet-váltás azonnal tükröződik).
 */
export function KeDobasPopup({ data, karakter, session, setSession, pushUndo, onClose }: Props) {
  const [alPopup, setAlPopup] = useState<'helyzet' | null>(null);
  const [eredmény, setEredmény] = useState<KéEredmény | null>(null);
  const [kéziBónusz, setKéziBónusz] = useState(0);
  const [bontásNyitva, setBontásNyitva] = useState(false);
  const [felülbírálva, setFelülbírálva] = useState(false); // KM override of the Automatikus kudarc block // KÉ + k20 breakdown under the result, collapsed by default

  const hc = useMemo(() => calcHarcComputed(data, karakter, session), [data, karakter, session]);
  const { kéHatások, automatikusKudarc } = useMemo(
    () => collectKéDobásInfo(session, karakter, data, hc.feltételTeljesül),
    [session, karakter, data, hc.feltételTeljesül],
  );
  const megjegyzések = helyzetDobásMegjegyzések(session, data, 'ké_dobás');
  const hatásSzint = netElőnySzint(kéHatások);
  const [szint, setSzint] = useState(hatásSzint);
  // Dobás ELŐTT a szint követi az aktív hatásokat (a helyzet-váltás a popupból azonnal látszik); dobás után nem írjuk felül.
  useEffect(() => {
    if (!eredmény) setSzint(hatásSzint);
  }, [hatásSzint, eredmény]);

  const alap = hc.ké;
  const helyzetDb = aktívTerületen(session, data, 'közelharc').helyzet;

  function rögzít(dobás: ProbaDobás) {
    setBontásNyitva(false);
    setEredmény({ alap, kézi: kéziBónusz, dobás, eredmény: alap + kéziBónusz + dobás.eredmény });
  }

  if (alPopup === 'helyzet') {
    return (
      <HelyzetPickerPopup data={data} karakter={karakter} session={session} terület="közelharc"
        setSession={setSession} pushUndo={pushUndo} onClose={() => setAlPopup(null)} />
    );
  }

  return (
    // Closing before the roll abandons the flow (nothing is recorded); after the roll the result is recorded.
    <PopupOverlay className="kep-prompt tamado-dobas-wrapper" onClose={() => onClose(eredmény?.eredmény ?? null)}>
      <div className="tamado-dobas-popup">
        {eredmény && <button className="sebzes-reset-btn" aria-label="Újradobás" onClick={() => setEredmény(null)}><Ikon név="reset" /></button>}
        <div className="dobas-fejlec">
          <div className="ke-dobas-header">Kezdeményezés</div>
        </div>

        {!eredmény && automatikusKudarc.length > 0 && !felülbírálva ? (
          // Automatikus kudarc (md/081): no roll, the character initiates last. Closing records nothing.
          <div className="kep-proba-tiltott">
            <div>Automatikus kudarc: utolsónak kezdeményezel</div>
            {automatikusKudarc.map(f => <div key={f} className="dobas-info-source">{f}</div>)}
            <div className="dobas-btn-row">
              <button type="button" className="tamado-dobas-btn tiltva-felulbiral-btn" onClick={() => setFelülbírálva(true)}>Felülbírál</button>
            </div>
          </div>
        ) : !eredmény ? (
          <>
            {megjegyzések.length > 0 && (
              <div className="dobas-info-list dobas-notes">
                {megjegyzések.map((m, i) => (
                  <div key={i} className="dobas-info-item">
                    <span className="dobas-info-badge note">⚠</span>
                    <span className="dobas-info-source">{m.forrás}: {m.szöveg}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Formula: KÉ (+ hand bonus) + k20 */}
            <div className="dobas-keplet">
              {alap}
              {kéziBónusz !== 0 && <><span className="dobas-keplet-op"> {kéziBónusz > 0 ? '+' : '−'} </span><span className={`dobas-keplet-kezi ${kéziBónusz > 0 ? 'sebzes-stat-pos' : 'sebzes-stat-neg'}`}>{Math.abs(kéziBónusz)}</span></>}
              <span className="dobas-keplet-op"> + </span>k20
            </div>
            <div className="dobas-oszlop">
              <div className="dobas-kapszulak">
                <button type="button" className="dobas-kapszula" onClick={() => setAlPopup('helyzet')}>
                  Harci helyzet <span className="dobas-kapszula-db">{helyzetDb}</span>
                </button>
                <KeziBonuszBtn kapszula bónusz={kéziBónusz} onChange={setKéziBónusz} />
              </div>
              <div className="elony-blokk">
                <ElonyLepteto szint={szint} onChange={setSzint} />
                <ForrasLista hatások={kéHatások} szint={szint} alapSzint={hatásSzint} onVissza={() => setSzint(hatásSzint)} />
              </div>
            </div>
            {/* No manual-dice entry here on purpose: initiative is rolled by many players at once, a manual entry would stall the table. */}
            <div className="dobas-btn-row">
              <button className="tamado-dobas-btn dobas-btn-ikon" onClick={() => rögzít(rollElőnyHátrányK20(szint))}><Ikon név="kocka" méret={22} />Dobás</button>
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.eredmény}
              <button type="button" className={`sebzes-bontas-nyil${bontásNyitva ? ' nyitva' : ''}`} aria-expanded={bontásNyitva}
                aria-label="Kezdeményezés bontása" title="Bontás" onClick={() => setBontásNyitva(v => !v)}><Ikon név="lenyit" /></button>
            </div>
            {bontásNyitva && <div className="ke-dobas-detail">
              KÉ ({eredmény.alap})
              {eredmény.kézi !== 0 ? ` ${eredmény.kézi > 0 ? '+' : ''}${eredmény.kézi}` : ''}
              {' + '}k20{eredmény.dobás.rolls.length > 1
                ? ` [${eredmény.dobás.rolls.join(', ')}] → ${eredmény.dobás.eredmény}`
                : ` (${eredmény.dobás.eredmény})`}
              {szint !== 0 && ` · ${előnyHátrányLabel(szint)}`}
            </div>}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
