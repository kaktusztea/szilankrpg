import type { AktivBaseProps } from './types';
import { calcAktivData } from './aktiv-calc';
import { AktivHatasPool } from './AktivHatasPool';
import { AktivHelyzetek } from './AktivHelyzetek';
import { AktivTaktikak } from './AktivTaktikak';
import { AktivStatuszok } from './AktivStatuszok';
import './AktivScreen.css';

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: AktivBaseProps) {
  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, taktikaFortélyok, alapesetekFiltered, eseményNév } = calcAktivData(data, karakter, session);

  return (
    <div className="screen aktiv-screen">
      <h2>✳️ Aktív</h2>

      <AktivHatasPool fortélyEmlékeztetők={fortélyEmlékeztetők} alapesetekFiltered={alapesetekFiltered} />

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} taktikaFortélyok={taktikaFortélyok} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivStatuszok data={data} session={session} setSession={setSession} pushUndo={pushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />
    </div>
  );
}
