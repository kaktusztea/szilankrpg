import { useRef, useEffect } from 'react';
import type { AktivBaseProps } from './types';
import { calcAktivData } from './aktiv-calc';
import { AktivHatasPool } from './AktivHatasPool';
import { AktivHelyzetek } from './AktivHelyzetek';
import { AktivTaktikak } from './AktivTaktikak';
import { AktivStatuszok } from './AktivStatuszok';
import { AktivManover } from './AktivManover';
import { AktivNarrativ } from './AktivNarrativ';
import './AktivScreen.css';

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: AktivBaseProps) {
  const screenRef = useRef<HTMLDivElement>(null);

  // ponytail: iOS standalone webapp reflow bug workaround —
  // WebKit skips repaint when content shrinks; touching offsetHeight forces layout.
  // Ceiling: if Apple fixes this in WebKit, this effect becomes a no-op (safe to remove).
  useEffect(() => {
    screenRef.current?.offsetHeight;
  });

  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév } = calcAktivData(data, karakter, session);

  return (
    <div className="screen aktiv-screen" ref={screenRef}>
      <h2>✳️ Aktív</h2>

      <AktivHatasPool fortélyEmlékeztetők={fortélyEmlékeztetők} alapesetekFiltered={alapesetekFiltered} />

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivManover data={data} session={session} setSession={setSession} manőverBónuszok={manőverBónuszok} />

      <AktivStatuszok data={data} session={session} setSession={setSession} pushUndo={pushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      <AktivNarrativ session={session} setSession={setSession} pushUndo={pushUndo} />
    </div>
  );
}
