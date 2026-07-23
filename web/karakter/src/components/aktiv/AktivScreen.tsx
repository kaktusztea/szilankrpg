import { useState, useRef, useEffect } from 'react';
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
  const [renderCount, setRenderCount] = useState(0);
  const screenRef = useRef<HTMLDivElement>(null);

  // Diagnostic: count renders
  useEffect(() => { setRenderCount(c => c + 1); });

  // Diagnostic: detect scroll/layout anomaly after each render
  useEffect(() => {
    const el = screenRef.current?.parentElement; // .screen-slide
    if (el) {
      const info = `scrollTop=${el.scrollTop} scrollH=${el.scrollHeight} clientH=${el.clientHeight} offsetH=${el.offsetHeight}`;
      if (el.scrollTop > el.scrollHeight - el.clientHeight + 10) {
        console.warn('[AktivScreen] scroll beyond content:', info);
      }
    }
  });

  // Diagnostic: catch calc errors
  let calcResult;
  try {
    calcResult = calcAktivData(data, karakter, session);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
    console.error('[AktivScreen] calcAktivData crash:', msg);
    return (
      <div className="screen aktiv-screen" ref={screenRef}>
        <h2>✳️ Aktív</h2>
        <div style={{ color: '#f44', background: '#2a1a1a', padding: 12, borderRadius: 6, fontSize: 13, whiteSpace: 'pre-wrap' }}>
          <strong>⚠️ Calc error:</strong><br />{msg}
        </div>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="screen aktiv-screen" ref={screenRef}>
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
    <div className="screen aktiv-screen" ref={screenRef}>
      <h2>✳️ Aktív</h2>

      {/* Diagnostic bar — always visible */}
      <div style={{ fontSize: 10, color: '#888', background: '#111', padding: '2px 6px', borderRadius: 3, marginBottom: 6 }}>
        render#{renderCount} | T:{session.aktív_taktikák.length} H:{session.aktív_helyzetek.length} M:{session.aktív_manőver ? 1 : 0} S:{session.aktív_státuszok.length} N:{session.narratív_módosítók.length}
      </div>

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
