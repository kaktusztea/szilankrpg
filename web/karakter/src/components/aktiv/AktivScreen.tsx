import type { AktivBaseProps } from './types';
import { calcAktivData, FÜL_SORREND } from './aktiv-calc';
import { AktivHatasPool } from './AktivHatasPool';
import { AktivHelyzetek } from './AktivHelyzetek';
import { AktivTaktikak } from './AktivTaktikak';
import { AktivStatuszok } from './AktivStatuszok';
import './AktivScreen.css';

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: AktivBaseProps) {
  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, taktikaFortélyok, alapesetek, eseményNév } = calcAktivData(data, karakter, session);

  const vanFortélyBox = FÜL_SORREND.some(({ kulcs }) => fortélyEmlékeztetők[kulcs].length > 0 || alapesetek[kulcs].length > 0);

  return (
    <div className="screen aktiv-screen">
      <h2>✳️ Aktív</h2>

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} taktikaFortélyok={taktikaFortélyok} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivStatuszok data={data} session={session} setSession={setSession} pushUndo={pushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      {vanFortélyBox && <h3 className="aktiv-fortely-header">Fortélyok és Alapesetek</h3>}

      {FÜL_SORREND.map(({ kulcs, cím }) => (
        <AktivHatasPool key={kulcs} cím={cím}
          fortélyEmlékeztetők={fortélyEmlékeztetők[kulcs]} alapesetek={alapesetek[kulcs]} />
      ))}
    </div>
  );
}
