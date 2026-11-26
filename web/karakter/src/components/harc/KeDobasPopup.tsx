import { useState, useMemo } from 'react';
import { Ikon } from '../common/Ikon';
import { PopupOverlay } from '../PopupOverlay';
import { ElonyLepteto } from '../dobas/ElonyLepteto';
import { ForrasLista } from '../dobas/ForrasLista';
import { KeziBonuszBtn } from '../dobas/KeziBonuszBtn';
import { TaktikaHelyzetPicker } from '../picker/TaktikaHelyzetPicker';
import { MegjegyzesLista, DobasKeplet, BontasNyil, k20Eredmény, k20BontásSzöveg, useEHSzint, type K20Eredmény } from '../dobas/K20Reszek';
import { aktívTerületen } from '../../engine/taktika/taktika-helpers';
import { calcHarcComputed } from '../../engine/harc/harc-computed';
import { collectKéDobásInfo, helyzetDobásMegjegyzések, netElőnySzint } from '../../engine/harc/combat-roll-info';
import { rollElőnyHátrányK20 } from '../../engine/dice';
import type { SessionProps } from '../session-props';

interface Props extends SessionProps {
  /** A végeredmény (KÉ + k20), vagy `null`, ha a dobás előtt zárták be (nem kerül előzménybe). */
  onClose: (eredmény: number | null) => void;
}

/**
 * Kezdeményezés (KÉ) dobás popup - two-phase, a Támadó dobás mintájára:
 *  Phase 1: KÉ + k20 képlet, Harci helyzet / Bónusz kapszulák, Előny/Hátrány léptető + források, Dobás
 *  Phase 2: eredmény (a bontás a szám melletti nyíl mögött)
 * A KÉ alapértéket és a feltétel-kiértékelőt maga számolja a session-ből (a helyzet-váltás azonnal tükröződik).
 */
export function KeDobasPopup({ data, karakter, session, setSession, pushUndo, onClose }: Props) {
  const [alPopup, setAlPopup] = useState<'helyzet' | null>(null);
  const [eredmény, setEredmény] = useState<K20Eredmény | null>(null);
  const [kéziBónusz, setKéziBónusz] = useState(0);
  const [bontásNyitva, setBontásNyitva] = useState(false);
  const [felülbírálva, setFelülbírálva] = useState(false); // KM override of the Automatikus kudarc block

  const hc = useMemo(() => calcHarcComputed(data, karakter, session), [data, karakter, session]);
  const { kéHatások, automatikusKudarc } = useMemo(
    () => collectKéDobásInfo(session, karakter, data, hc.feltételTeljesül),
    [session, karakter, data, hc.feltételTeljesül],
  );
  const megjegyzések = helyzetDobásMegjegyzések(session, data, 'ké_dobás');
  const hatásSzint = netElőnySzint(kéHatások);
  const [szint, setSzint] = useEHSzint(hatásSzint, !!eredmény);

  const alap = hc.ké;
  const helyzetDb = aktívTerületen(session, data, 'közelharc').helyzet;

  function dob() {
    setBontásNyitva(false);
    setEredmény(k20Eredmény(alap, kéziBónusz, rollElőnyHátrányK20(szint)));
  }

  if (alPopup) {
    return (
      <TaktikaHelyzetPicker fajta={alPopup} terület="közelharc" data={data} karakter={karakter} session={session}
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
          // Automatikus kudarc (md/081): no roll, the character acts last in the round. Closing records nothing.
          <div className="kep-proba-tiltott">
            <div>Automatikus kudarc: utolsónak cselekedhetsz a körben</div>
            {automatikusKudarc.map(f => <div key={f} className="dobas-info-source">{f}</div>)}
            <div className="dobas-btn-row">
              <button type="button" className="tamado-dobas-btn tiltva-felulbiral-btn" onClick={() => setFelülbírálva(true)}>Felülbírál</button>
            </div>
          </div>
        ) : !eredmény ? (
          <>
            <MegjegyzesLista lista={megjegyzések} />
            <DobasKeplet alap={alap} kézi={kéziBónusz} />
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
              <button className="tamado-dobas-btn dobas-btn-ikon" onClick={dob}><Ikon név="kocka" méret={22} />Dobás</button>
            </div>
          </>
        ) : (
          <>
            <div className="ke-dobas-result">{eredmény.eredmény}
              <BontasNyil nyitva={bontásNyitva} onVált={() => setBontásNyitva(v => !v)} label="Kezdeményezés bontása" />
            </div>
            {bontásNyitva && <div className="ke-dobas-detail">{k20BontásSzöveg('KÉ', eredmény, szint)}</div>}
          </>
        )}
      </div>
    </PopupOverlay>
  );
}
