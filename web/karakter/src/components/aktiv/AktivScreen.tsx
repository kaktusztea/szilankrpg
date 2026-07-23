import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const renderCount = useRef(0);
  const screenRef = useRef<HTMLDivElement>(null);

  renderCount.current++;

  const log = useCallback((msg: string) => {
    setDebugLog(prev => [...prev.slice(-9), `${renderCount.current}: ${msg}`]);
  }, []);

  // Log layout info after each render
  useEffect(() => {
    const el = screenRef.current?.parentElement; // .screen-slide
    if (el) {
      const sT = el.scrollTop, sH = el.scrollHeight, cH = el.clientHeight;
      if (sT > sH - cH + 5) {
        log(`SCROLL_BUG sT=${sT} sH=${sH} cH=${cH}`);
        el.scrollTop = 0;
      }
    }
  });

  // Wrap setSession to log removals
  const trackedSetSession: typeof setSession = useCallback((updater) => {
    log(`setSession called`);
    setSession(updater);
  }, [setSession, log]);

  const trackedPushUndo: typeof pushUndo = useCallback((...args) => {
    log(`pushUndo: ${args[0]}`);
    pushUndo(...args);
  }, [pushUndo, log]);

  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév } = calcAktivData(data, karakter, session);

  return (
    <div className="screen aktiv-screen" ref={screenRef}>
      <h2>✳️ Aktív</h2>

      <AktivHatasPool fortélyEmlékeztetők={fortélyEmlékeztetők} alapesetekFiltered={alapesetekFiltered} />

      <AktivTaktikak data={data} karakter={karakter} session={session} setSession={trackedSetSession} pushUndo={trackedPushUndo}
        taktikaHatásPerElem={taktikaHatásPerElem} eseményNév={eseményNév} />

      <AktivHelyzetek data={data} karakter={karakter} session={session} setSession={trackedSetSession} pushUndo={trackedPushUndo}
        helyzetFortélyok={helyzetFortélyok} />

      <AktivManover data={data} session={session} setSession={trackedSetSession} manőverBónuszok={manőverBónuszok} />

      <AktivStatuszok data={data} session={session} setSession={trackedSetSession} pushUndo={trackedPushUndo}
        státuszPerElem={státuszPerElem} eseményNév={eseményNév} />

      <AktivNarrativ session={session} setSession={trackedSetSession} pushUndo={trackedPushUndo} />

      {/* Debug telemetry — iOS standalone layout bug investigation */}
      <div style={{ fontSize: 10, color: '#888', background: '#111', padding: '3px 6px', borderRadius: 3, marginTop: 12, minHeight: 14 }}>
        <div>r#{renderCount.current} | T:{session.aktív_taktikák.length} H:{session.aktív_helyzetek.length} M:{session.aktív_manőver ? 1 : 0} S:{session.aktív_státuszok.length} N:{session.narratív_módosítók.length}</div>
        {debugLog.length > 0 && <div style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{debugLog.join('\n')}</div>}
      </div>
    </div>
  );
}
