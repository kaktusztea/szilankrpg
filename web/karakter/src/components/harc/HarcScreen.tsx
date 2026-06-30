import { useState, useEffect, useRef, useCallback } from 'react';
import type { HarcBaseProps } from './types';
import type { SebzésRubrika } from '../../engine/types';
import { useHarcComputed } from './useHarcComputed';
import { HarcHeader } from './HarcHeader';
import { HarcFegyverTable } from './HarcFegyverTable';
import { HarcPopups } from './HarcPopups';
import { EpTable } from './EpTable';
import { HarcReszletek } from './HarcReszletek';
import { calcFtEnyhites as calcFtEnyhítés } from './pancel-calc';
import { calcSérültFok } from './ep-logic';
import { KeDobas, pushKéDobás } from './KeDobas';
import './HarcScreen.css';

export function HarcScreen({ data, karakter, session, setSession, pushUndo, onNavigate }: HarcBaseProps) {
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showVéHistory, setShowVéHistory] = useState(false);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);
  const [támInfo, setTámInfo] = useState<{ név: string; sebesség: number; harckeret: number } | null>(null);
  const [sebCount, setSebCount] = useState(0);
  const [kéDobásEredmény, setKéDobásEredmény] = useState<number | null>(null);

  const hc = useHarcComputed(data, karakter, session);

  // VÉ flash animation
  const triggerVéFlash = useCallback((dir: 'down' | 'up') => {
    setVéFlash(dir);
    if (véFlashTimer.current) clearTimeout(véFlashTimer.current);
    véFlashTimer.current = setTimeout(() => setVéFlash(''), 1000);
  }, []);

  const changeVé = useCallback((newVal: number) => {
    const diff = newVal - session.vé_csökkenés;
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`);
    setSession(prev => ({
      ...prev,
      vé_csökkenés: newVal,
      vé_history: newVal === 0 ? [] : [...prev.vé_history, diff > 0 ? -diff : Math.abs(diff)],
    }));
    triggerVéFlash(diff > 0 ? 'down' : 'up');
  }, [session.vé_csökkenés, pushUndo, setSession, triggerVéFlash]);

  // KÉ dobás handler
  const handleKéClick = useCallback(() => {
    const k20 = Math.floor(Math.random() * 20) + 1;
    setKéDobásEredmény(hc.ké + k20);
  }, [hc.ké]);

  const handleKéDobásClose = useCallback((eredmény: number) => {
    setKéDobásEredmény(null);
    setSession(prev => ({
      ...prev,
      ké_dobások: pushKéDobás(prev.ké_dobások ?? [], eredmény),
    }));
  }, [setSession]);

  // Popup close handler
  function closePopups() {
    setShowVéResetConfirm(false);
    setShowVéHistory(false);
    setTámInfo(null);
  }

  // Auto Sérült státusz
  useEffect(() => {
    const targetFok = calcSérültFok(sebCount, hc.oszlopMéret);
    const current = session.aktív_státuszok.find(s => s.startsWith('Sérült ('));
    const currentFok = current ? parseInt(current.match(/\((\d+)\)/)?.[1] ?? '0') : 0;
    if (targetFok === currentFok) return;
    setSession(prev => {
      const filtered = prev.aktív_státuszok.filter(s => !s.startsWith('Sérült ('));
      return targetFok === 0
        ? { ...prev, aktív_státuszok: filtered }
        : { ...prev, aktív_státuszok: [...filtered, `Sérült (${targetFok})`] };
    });
  }, [sebCount, hc.oszlopMéret]);

  // TÉ levonás az aktuális sérülés alapján (Fájdalomtűrés enyhítéssel)
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / hc.oszlopMéret) - 1);
  const ftEnyhítés = calcFtEnyhítés(karakter.képzettségek, data.konstansok.fájdalomtűrés_enyhítés);
  const rawTéLevonás = hc.téLevonások[aktKat];
  const téLevonás = rawTéLevonás === 0 ? 0 : Math.min(0, rawTéLevonás + ftEnyhítés);

  const handleSebzésekChange = useCallback((sebzések: SebzésRubrika[]) => {
    setSession(prev => ({ ...prev, sebzések }));
  }, [setSession]);

  const handleNavigateToFt = useCallback(() => {
    onNavigate?.('tulajdonsagok');
    setTimeout(() => {
      document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 200);
  }, [onNavigate]);

  const hasFt = karakter.képzettségek.some(kp => kp.név === 'Fájdalomtűrés');

  return (
    <div className="screen harc-screen">
      <h2>🗡️ Harc</h2>

      <HarcHeader
        ké={hc.ké}
        sfé_fizikai={hc.sfé_fizikai}
        sfé_energia={hc.sfé_energia}
        páncélLefedettség={hc.páncélLefedettség}
        manöverPont={hc.manöverPont}
        maxVéCsökk={hc.maxVéCsökk}
        session={session}
        setSession={setSession}
        pushUndo={pushUndo}
        konstansok={data.konstansok}
        onVéChange={changeVé}
        onVéLabelTap={() => { if (session.vé_csökkenés > 0) setShowVéHistory(true); }}
        onVéResetClick={() => setShowVéResetConfirm(true)}
        onKéClick={handleKéClick}
      />

      <HarcFegyverTable
        karakter={karakter}
        session={session}
        data={data}
        fegyverResults={hc.fegyverResults}
        kétkezesResult={hc.kétkezesResult}
        fogásResult={hc.fogásResult}
        pajzsVÉ={hc.pajzsVÉ}
        pajzsFegyverNév={hc.pajzsFegyverNév}
        taktikaMods={hc.taktikaMods}
        fortelyMods={hc.fortelyMods}
        téLevonás={téLevonás}
        belharciAktív={hc.belharciAktív}
        véFlash={véFlash}
        onTámInfoClick={setTámInfo}
      />

      <div className="harc-section">
        <EpTable
          ÉP={hc.épValue}
          kategóriák={data.konstansok.sebesülés_kategóriák_száma}
          onSebCountChange={setSebCount}
          ftEnyhítés={calcFtEnyhítés(karakter.képzettségek, data.konstansok.fájdalomtűrés_enyhítés)}
          téLevonások={hc.téLevonások}
          onNavigate={hasFt ? handleNavigateToFt : undefined}
          sebzések={session.sebzések}
          onSebzésekChange={handleSebzésekChange}
        />
      </div>

      <HarcReszletek
        karakter={karakter}
        session={session}
        data={data}
        fegyverResults={hc.fegyverResults}
        kétkezesResult={hc.kétkezesResult}
        fogásResult={hc.fogásResult}
        taktikaMods={hc.taktikaMods}
        fortelyMods={hc.fortelyMods}
        téLevonás={téLevonás}
        pajzsVÉ={hc.pajzsVÉ}
        páncélMGT={hc.páncélMGT}
      />

      <HarcPopups
        session={session}
        showVéResetConfirm={showVéResetConfirm}
        showVéHistory={showVéHistory}
        támInfo={támInfo}
        onVéReset={() => { changeVé(0); setShowVéResetConfirm(false); }}
        onCloseAll={closePopups}
      />

      {kéDobásEredmény !== null && (
        <KeDobas ké={hc.ké} eredmény={kéDobásEredmény} onClose={handleKéDobásClose} />
      )}
    </div>
  );
}
