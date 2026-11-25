import { useState } from 'react';
import { Ikon } from '../common/Ikon';
import { kattinthatóProps } from '../a11y';
import type { SessionProps } from '../session-props';
import { calcAktivData, FÜL_SORREND } from './aktiv-calc';
import { AktivHatasPool } from './AktivHatasPool';
import { AktivHelyzetek } from './AktivHelyzetek';
import { AktivTaktikak } from './AktivTaktikak';
import { AktivStatuszok } from './AktivStatuszok';
import './AktivScreen.css';

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: SessionProps) {
  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, taktikaFortélyok, alapesetek, eseményNév } = calcAktivData(data, karakter, session);

  // The whole "Fortélyok és Alapesetek" block folds with one arrow; collapsed by default
  const [fortélyNyitva, setFortélyNyitva] = useState(false);
  const vanFortélyBox = FÜL_SORREND.some(({ kulcs }) => fortélyEmlékeztetők[kulcs].length > 0 || alapesetek[kulcs].length > 0);

  return (
    <div className="screen aktiv-screen">
      <h2><Ikon név="aktív" /> Aktív</h2>

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} taktikaFortélyok={taktikaFortélyok} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivStatuszok data={data} session={session} setSession={setSession} pushUndo={pushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      {vanFortélyBox && (
        <h3 className="aktiv-fortely-header aktiv-fortely-header-nyithato" aria-expanded={fortélyNyitva}
          {...kattinthatóProps(() => setFortélyNyitva(v => !v))}>
          Fortélyok és Alapesetek <Ikon név={fortélyNyitva ? 'lenyit' : 'jobbra'} />
        </h3>
      )}

      {fortélyNyitva && FÜL_SORREND.map(({ kulcs, cím }) => (
        <AktivHatasPool key={kulcs} cím={cím}
          fortélyEmlékeztetők={fortélyEmlékeztetők[kulcs]} alapesetek={alapesetek[kulcs]} />
      ))}
    </div>
  );
}
