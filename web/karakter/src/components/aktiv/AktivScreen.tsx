import { useState, useEffect } from 'react';
import type { AktivBaseProps } from './types';
import { calcHatásPool } from './HatasPoolCalc';
import { AktivFegyverSection } from './AktivFegyverSection';
import { AktivHatasPool } from './AktivHatasPool';
import { AktivHelyzetek } from './AktivHelyzetek';
import { AktivFegyverfogas } from './AktivFegyverfogas';
import { AktivTaktikak } from './AktivTaktikak';
import { AktivStatuszok } from './AktivStatuszok';
import { AktivManover } from './AktivManover';
import { AktivNarrativ } from './AktivNarrativ';
import './AktivScreen.css';

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: AktivBaseProps) {
  const [showFegyverfogás, setShowFegyverfogás] = useState(false);

  useEffect(() => {
    if (!showFegyverfogás) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFegyverfogás(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showFegyverfogás]);

  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév } = calcHatásPool(data, karakter, session);

  return (
    <div className="screen aktiv-screen">
      <h2>✳️ Aktív</h2>

      <AktivFegyverSection
        data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        onShowFegyverfogás={() => setShowFegyverfogás(true)}
      />

      <AktivHatasPool fortélyEmlékeztetők={fortélyEmlékeztetők} alapesetekFiltered={alapesetekFiltered} />

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivManover data={data} session={session} setSession={setSession} manőverBónuszok={manőverBónuszok} />

      <AktivStatuszok data={data} session={session} setSession={setSession} pushUndo={pushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      <AktivNarrativ session={session} setSession={setSession} pushUndo={pushUndo} />

      {showFegyverfogás && (
        <AktivFegyverfogas
          data={data} karakter={karakter} session={session}
          onSelect={(patch) => { pushUndo(`Fogás: ${patch.fegyverfogás}`); setSession(s => ({ ...s, ...patch })); setShowFegyverfogás(false); }}
          onClose={() => setShowFegyverfogás(false)}
        />
      )}
    </div>
  );
}
