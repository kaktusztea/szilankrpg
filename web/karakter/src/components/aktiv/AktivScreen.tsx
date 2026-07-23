import { useState } from 'react';
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
  const [renderError, setRenderError] = useState<string | null>(null);

  // Diagnostic: catch calc errors
  let calcResult;
  try {
    calcResult = calcAktivData(data, karakter, session);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
    console.error('[AktivScreen] calcAktivData crash:', msg);
    return (
      <div className="screen aktiv-screen">
        <h2>✳️ Aktív</h2>
        <div style={{ color: '#f44', background: '#2a1a1a', padding: 12, borderRadius: 6, fontSize: 13, whiteSpace: 'pre-wrap' }}>
          <strong>⚠️ Calc error:</strong><br />{msg}
        </div>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="screen aktiv-screen">
        <h2>✳️ Aktív</h2>
        <div style={{ color: '#f44', background: '#2a1a1a', padding: 12, borderRadius: 6, fontSize: 13, whiteSpace: 'pre-wrap' }}>
          <strong>⚠️ Render error:</strong><br />{renderError}
          <br /><button style={{ marginTop: 8, padding: '4px 12px' }} onClick={() => setRenderError(null)}>Újra</button>
        </div>
      </div>
    );
  }

  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév } = calcResult;

  // Diagnostic: wrap pushUndo to catch errors in event handlers
  const safePushUndo: typeof pushUndo = (...args) => {
    try {
      return pushUndo(...args);
    } catch (e) {
      const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
      console.error('[AktivScreen] pushUndo crash:', msg);
      setRenderError(`pushUndo: ${msg}`);
    }
  };

  const safeSetSession: typeof setSession = (...args) => {
    try {
      return setSession(...args);
    } catch (e) {
      const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
      console.error('[AktivScreen] setSession crash:', msg);
      setRenderError(`setSession: ${msg}`);
    }
  };

  return (
    <div className="screen aktiv-screen">
      <h2>✳️ Aktív</h2>

      <AktivHatasPool fortélyEmlékeztetők={fortélyEmlékeztetők} alapesetekFiltered={alapesetekFiltered} />

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={safeSetSession} pushUndo={safePushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={safeSetSession} pushUndo={safePushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivManover data={data} session={session} setSession={safeSetSession} manőverBónuszok={manőverBónuszok} />

      <AktivStatuszok data={data} session={session} setSession={safeSetSession} pushUndo={safePushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      <AktivNarrativ session={session} setSession={safeSetSession} pushUndo={safePushUndo} />
    </div>
  );
}
