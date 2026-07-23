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

  // iOS standalone webapp scroll fix: reset scroll if it's beyond content
  useEffect(() => {
    const el = screenRef.current?.parentElement; // .screen-slide
    if (el && el.scrollTop > 0 && el.scrollTop > el.scrollHeight - el.clientHeight) {
      el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    }
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
