import { useState, useEffect, useRef } from 'react';
import { useKarakterState } from './hooks/useKarakterState';
import { useOverlays } from './hooks/useOverlays';
import { useSwipe } from './hooks/useSwipe';
import { useUrlImport } from './hooks/useUrlImport';
import { useKarakterActions } from './hooks/useKarakterActions';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { KpBar } from './components/KpBar';
import { TabContent, ALL_TABS } from './components/TabContent';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { AppOverlays } from './components/AppOverlays';
import { downloadFile, shareFile } from './engine/file-ops';
import './App.css';

declare const __APP_VERSION__: string;

function App() {
  const {
    data, error, karakter, setKarakter,
    testMode, setTestMode, setIsDirty,
    undoStack, setUndoStack, pushUndo, undoTo,
    setTulajdonságok, setKépzettségek, setFortélyok, setSession,
  } = useKarakterState();

  const { overlays, setOverlay } = useOverlays();

  const [activeTab, setActiveTab] = useState(5);
  const [gameMode, setGameMode] = useState(false);

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);
  const { handleTouchStart, handleTouchEnd } = useSwipe(activeTab, TABS.length, setActiveTab);

  // --- Version hint (double-tap title) ---
  const [versionHint, setVersionHint] = useState('');
  const versionHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTitle = useRef(0);

  function handleTitleTap() {
    const now = Date.now();
    if (now - lastTapTitle.current < 350) {
      lastTapTitle.current = 0;
      setVersionHint(`Szilánk RPG build: ${__APP_VERSION__}`);
      if (versionHintTimer.current) clearTimeout(versionHintTimer.current);
      versionHintTimer.current = setTimeout(() => setVersionHint(''), 5000);
    } else {
      lastTapTitle.current = now;
    }
  }

  // --- GameMode tab index correction ---
  const prevGameMode = useRef(gameMode);
  useEffect(() => {
    if (prevGameMode.current !== gameMode) {
      const currentId = (prevGameMode.current ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS)[activeTab]?.id;
      const newTabs = gameMode ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS;
      const newIdx = newTabs.findIndex(t => t.id === currentId);
      if (newIdx >= 0 && newIdx !== activeTab) setActiveTab(newIdx);
      prevGameMode.current = gameMode;
    }
  }, [gameMode, activeTab]);

  // --- Taktika fok invalidáció ---
  useEffect(() => {
    if (!karakter || !data) return;
    const session = karakter.session;
    let changed = false;
    const újTaktikák = session.aktív_taktikák.filter(at => {
      const def = data.taktikak.find(t => t.név === at.név);
      if (!def?.fokozatos || !def.fokok || at.fok == null) return true;
      const alapMax = def.fokok[def.fokok.length - 1].fok;
      if (at.fok <= alapMax) return true;
      if (!def.fortély_bővítés) { changed = true; return false; }
      const fortélyFok = karakter.fortélyok.find(f => f.név === def.fortély_bővítés!.fortély)?.fok ?? 0;
      const maxFok = alapMax + fortélyFok * def.fortély_bővítés.extra_fokok_per_fok;
      if (at.fok > maxFok) { changed = true; return false; }
      return true;
    });
    if (changed) setKarakter(prev => prev ? { ...prev, session: { ...prev.session, aktív_taktikák: újTaktikák } } : prev);
  }, [karakter?.fortélyok, data]);

  // --- kep-prompt-overlay click dismiss ---
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (el.classList.contains('kep-prompt-overlay')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // --- Actions hook ---
  const { importKarakter, shareSlotUrl, duplicateKarakter, handleGenerateSave, loadKarakter } = useKarakterActions({
    data, karakter, setKarakter, undoStack, setUndoStack, setTestMode, setIsDirty, setOverlay,
  });

  useUrlImport(data, setOverlay, importKarakter);

  // --- Undo wrapper (closes overlay) ---
  function handleUndoTo(index: number) {
    undoTo(index);
    setOverlay('showUndo', false);
    setOverlay('undoSelected', null);
  }

  // --- Render ---
  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data || !karakter) return <div className="loading">Betöltés...</div>;

  const { tulajdonságok, képzettségek, fortélyok, session } = karakter;

  return (
    <div className="app" onContextMenu={e => e.preventDefault()}>
      <Header
        testMode={testMode} gameMode={gameMode} setGameMode={setGameMode}
        session={session} setOverlay={setOverlay} onTitleTap={handleTitleTap}
      />

      <main className="content" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="screen-slider" style={{ transform: `translateX(-${(TABS.length - 1 - activeTab) * 100}%)` }}>
          {[...TABS].reverse().map((tab, vi) => {
            const i = TABS.length - 1 - vi;
            return (
              <div key={tab.id} className="screen-slide">
                {Math.abs(i - activeTab) <= 1 && (
                  <ScreenErrorBoundary>
                    <TabContent
                      tab={tab.id} data={data} gameMode={gameMode} setActiveTab={setActiveTab}
                      tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok}
                      képzettségek={képzettségek} setKépzettségek={setKépzettségek}
                      fortélyok={fortélyok} setFortélyok={setFortélyok}
                      session={session} setSession={setSession}
                      karakter={karakter} setKarakter={setKarakter}
                      pushUndo={pushUndo}
                    />
                  </ScreenErrorBoundary>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {versionHint && <div className="version-hint">{versionHint}</div>}
      {!gameMode && <KpBar data={data} karakter={karakter} />}

      <TabBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      <AppOverlays
        state={overlays} setState={setOverlay}
        data={data} karakter={karakter} session={session}
        setSession={setSession} setKarakter={setKarakter}
        undoStack={undoStack} undoTo={handleUndoTo}
        duplicateKarakter={duplicateKarakter}
        handleGenerateSave={handleGenerateSave}
        shareFile={shareFile} downloadFile={downloadFile}
        loadKarakter={loadKarakter} shareSlotUrl={shareSlotUrl}
        importKarakter={importKarakter}
        setUndoStack={setUndoStack} setTestMode={setTestMode} setIsDirty={setIsDirty}
      />
    </div>
  );
}

export default App;
