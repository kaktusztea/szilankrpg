import { useState } from 'react';
import { useKarakterState } from './hooks/useKarakterState';
import { useOverlays } from './hooks/useOverlays';
import { useSwipe } from './hooks/useSwipe';
import { useUrlImport } from './hooks/useUrlImport';
import { useKarakterActions } from './hooks/useKarakterActions';
import { useGameModeTabSync } from './hooks/useGameModeTabSync';
import { useTaktikaInvalidation } from './hooks/useTaktikaInvalidation';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { KpBar } from './components/KpBar';
import { TabContent, ALL_TABS } from './components/TabContent';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { AppOverlays } from './components/AppOverlays';
import { downloadFile, shareFile, generateUid, generateIdLeíró } from './engine/file-ops';
import { restoreTruncate, restoreAppend } from './engine/checkpoint-utils';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from './engine/types';
import type { Karakter } from './engine/types';
import { validateKarakterData } from './engine/validate';
import { CheckpointBanner } from './components/CheckpointBanner';
import { CheckpointRestoreOverlay } from './components/overlays/CheckpointRestoreOverlay';
import './App.css';

function App() {
  const {
    data, error, karakter, setKarakter,
    testMode, setTestMode, isDirty, setIsDirty,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewingMode: _viewingMode, setViewingMode,
    undoStack, setUndoStack, pushUndo, undoTo,
    setTulajdonságok, setKépzettségek, setFortélyok, setSession,
  } = useKarakterState();

  const { overlays, setOverlay } = useOverlays();
  const [activeTab, setActiveTab] = useState(5);
  const [gameMode, setGameMode] = useState(false);
  const [viewingCheckpointId, setViewingCheckpointId] = useState<string | null>(null);

  // When viewing a checkpoint, everything is read-only
  const effectiveGameMode = gameMode || !!viewingCheckpointId;

  const TABS = ALL_TABS.filter(t => !t.editOnly || !effectiveGameMode);
  const { handleTouchStart, handleTouchEnd } = useSwipe(activeTab, TABS.length, setActiveTab);

  useGameModeTabSync(gameMode, activeTab, setActiveTab);
  useTaktikaInvalidation(karakter, data, setKarakter);

  const { importKarakter, shareSlotUrl, saveSlotToFile, duplicateSlot, handleGenerateSave, loadKarakter, deleteSlot } = useKarakterActions({
    data, karakter, setKarakter, undoStack, setUndoStack, setTestMode, setIsDirty, setOverlay,
  });

  useUrlImport(data, setOverlay, importKarakter);

  function handleUndoTo(index: number) {
    undoTo(index);
    setOverlay('showUndo', false);
    setOverlay('undoSelected', null);
  }

  function handleTestReset() {
    if (!data) return;
    const refErr = validateKarakterData(data.testKarakter, data);
    if (refErr) return;
    setKarakter({
      ...data.testKarakter,
      uid: data.testKarakter.uid,
      id_leíró: data.testKarakter.id_leíró,
      előtörténet: { ...DEFAULT_ELOTORTENET, ...data.testKarakter.előtörténet },
      session: { ...DEFAULT_SESSION, ...data.testKarakter.session },
    });
    setUndoStack([]);
    setIsDirty(true);
    setOverlay('toast', { msg: 'Teszt karakter alapállapotba állítva', type: 'success' });
  }

  const [showRestoreOverlay, setShowRestoreOverlay] = useState(false);
  // latestSnapshot: stores the full karakter state before switching to a checkpoint view
  const [latestSnapshot, setLatestSnapshot] = useState<Karakter | null>(null);

  const viewingCheckpoint = viewingCheckpointId
    ? (latestSnapshot ?? karakter)?.checkpoints.find(c => c.id === viewingCheckpointId) ?? null
    : null;

  /** Enter checkpoint viewing: save current state, apply snapshot read-only */
  function handleViewCheckpoint(id: string) {
    if (!karakter) return;
    const cp = karakter.checkpoints.find(c => c.id === id);
    if (!cp) return;
    // Save latest state (only if not already viewing a checkpoint)
    if (!latestSnapshot) {
      setLatestSnapshot(karakter);
    }
    // Apply checkpoint snapshot onto karakter (read-only view)
    setKarakter({
      ...karakter,
      ...cp.snapshot,
      uid: karakter.uid,
      id_leíró: karakter.id_leíró,
      schema_version: karakter.schema_version,
      checkpoints: karakter.checkpoints,
      session: karakter.session,
      mentés_dátum: karakter.mentés_dátum,
    });
    setViewingCheckpointId(id);
    setViewingMode(true);
  }

  /** Exit checkpoint viewing: restore latest state */
  function handleCheckpointBack() {
    if (latestSnapshot) {
      setKarakter(latestSnapshot);
      setLatestSnapshot(null);
    }
    setViewingCheckpointId(null);
    setViewingMode(false);
  }

  function handleCheckpointRestore(mode: 'truncate' | 'append') {
    if (!latestSnapshot || !viewingCheckpointId) return;
    // Restore operates on the latestSnapshot's checkpoints (the real data)
    const base = latestSnapshot;
    const restored = mode === 'truncate'
      ? restoreTruncate(base, viewingCheckpointId)
      : restoreAppend(base, viewingCheckpointId);
    setKarakter(restored);
    setUndoStack([]);
    setIsDirty(true);
    setLatestSnapshot(null);
    setViewingCheckpointId(null);
    setViewingMode(false);
    setShowRestoreOverlay(false);
    setOverlay('toast', { msg: 'Verzió visszaállítva', type: 'success' });
  }

  function handleCheckpointDuplicate() {
    if (!viewingCheckpointId) return;
    const base = latestSnapshot ?? karakter;
    if (!base) return;
    const cp = base.checkpoints.find(c => c.id === viewingCheckpointId);
    if (!cp) return;
    const newUid = generateUid();
    const restored = {
      ...base,
      ...cp.snapshot,
      uid: newUid,
      session: { ...DEFAULT_SESSION },
      checkpoints: [],
    } as Karakter;
    restored.id_leíró = generateIdLeíró(restored.név, restored.tsz);
    restored.becenév = restored.becenév ? `${restored.becenév} (dup)` : '';
    setKarakter(restored);
    setUndoStack([]);
    setIsDirty(true);
    setLatestSnapshot(null);
    setViewingCheckpointId(null);
    setViewingMode(false);
    setOverlay('toast', { msg: 'Új karakter példányba duplikálva', type: 'success' });
  }

  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data || !karakter) return <div className="loading">Betöltés...</div>;

  const { tulajdonságok, képzettségek, fortélyok, session } = karakter;

  return (
    <div className="app" onContextMenu={e => e.preventDefault()}>
      <Header
        testMode={testMode} gameMode={gameMode} setGameMode={setGameMode}
        viewingCheckpoint={!!viewingCheckpointId}
        session={session} undoCount={undoStack.length} setOverlay={setOverlay}
      />

      {viewingCheckpoint && (
        <CheckpointBanner
          checkpoint={viewingCheckpoint}
          onBack={handleCheckpointBack}
          onRestore={() => setShowRestoreOverlay(true)}
          onDuplicate={handleCheckpointDuplicate}
        />
      )}

      {showRestoreOverlay && (
        <CheckpointRestoreOverlay
          onRestore={handleCheckpointRestore}
          onClose={() => setShowRestoreOverlay(false)}
        />
      )}

      <main className="content" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="screen-slider" style={{ '--active-offset': TABS.length - 1 - activeTab } as React.CSSProperties}>
          {[...TABS].reverse().map((tab, vi) => {
            const i = TABS.length - 1 - vi;
            return (
              <div key={tab.id} className="screen-slide">
                {Math.abs(i - activeTab) <= 1 && (
                  <ScreenErrorBoundary>
                    <TabContent
                      tab={tab.id} data={data} gameMode={effectiveGameMode} setActiveTab={setActiveTab}
                      tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok}
                      képzettségek={képzettségek} setKépzettségek={setKépzettségek}
                      fortélyok={fortélyok} setFortélyok={setFortélyok}
                      session={session} setSession={setSession}
                      karakter={karakter} setKarakter={setKarakter}
                      pushUndo={pushUndo}
                      onTestReset={handleTestReset}
                    />
                  </ScreenErrorBoundary>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {!effectiveGameMode && <KpBar data={data} karakter={karakter} />}

      <TabBar tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      <AppOverlays
        state={overlays} setState={setOverlay}
        data={data} karakter={karakter} session={session}
        setSession={setSession} setKarakter={setKarakter}
        pushUndo={pushUndo}
        undoStack={undoStack} undoTo={handleUndoTo}
        duplicateSlot={duplicateSlot}
        handleGenerateSave={handleGenerateSave}
        shareFile={shareFile} downloadFile={downloadFile}
        loadKarakter={loadKarakter} shareSlotUrl={shareSlotUrl} saveSlotToFile={saveSlotToFile}
        importKarakter={importKarakter} deleteSlot={deleteSlot}
        setUndoStack={setUndoStack} setTestMode={setTestMode} setIsDirty={setIsDirty}
        isDirty={isDirty}
        onViewCheckpoint={handleViewCheckpoint}
      />
    </div>
  );
}

export default App;
