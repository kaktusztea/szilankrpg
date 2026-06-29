import { useState } from 'react';
import { useKarakterState } from './hooks/useKarakterState';
import { useOverlays } from './hooks/useOverlays';
import { useSwipe } from './hooks/useSwipe';
import { useUrlImport } from './hooks/useUrlImport';
import { useKarakterActions } from './hooks/useKarakterActions';
import { useVersionHint } from './hooks/useVersionHint';
import { useGameModeTabSync } from './hooks/useGameModeTabSync';
import { useTaktikaInvalidation } from './hooks/useTaktikaInvalidation';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { KpBar } from './components/KpBar';
import { TabContent, ALL_TABS } from './components/TabContent';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { AppOverlays } from './components/AppOverlays';
import { downloadFile, shareFile } from './engine/file-ops';
import './App.css';

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
  const { versionHint, handleTitleTap } = useVersionHint();

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);
  const { handleTouchStart, handleTouchEnd } = useSwipe(activeTab, TABS.length, setActiveTab);

  useGameModeTabSync(gameMode, activeTab, setActiveTab);
  useTaktikaInvalidation(karakter, data, setKarakter);

  const { importKarakter, shareSlotUrl, duplicateKarakter, handleGenerateSave, loadKarakter, deleteSlot } = useKarakterActions({
    data, karakter, setKarakter, undoStack, setUndoStack, setTestMode, setIsDirty, setOverlay,
  });

  useUrlImport(data, setOverlay, importKarakter);

  function handleUndoTo(index: number) {
    undoTo(index);
    setOverlay('showUndo', false);
    setOverlay('undoSelected', null);
  }

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
        <div className="screen-slider" style={{ '--active-offset': TABS.length - 1 - activeTab } as React.CSSProperties}>
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
        importKarakter={importKarakter} deleteSlot={deleteSlot}
        setUndoStack={setUndoStack} setTestMode={setTestMode} setIsDirty={setIsDirty}
      />
    </div>
  );
}

export default App;
