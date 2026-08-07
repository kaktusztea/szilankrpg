import type { Karakter, Session } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { UndoPatch } from '../hooks/useUndo';
import { validateKarakterData } from '../engine/validate';
import { generateUid, generateIdLeíró } from '../engine/file-ops';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import { isSlotFull } from '../hooks/slot-utils';
import { restoreBackup } from '../hooks/backup-restore';
import {
  SzilankPickerOverlay, NewCharConfirmOverlay, TestConfirmOverlay,
  SlotListOverlay, SlotDeleteOverlay, SaveFileOverlay,
  UndoOverlay, LoadErrorOverlay, FullscreenHintOverlay,
  OverlayScreenOverlay, SharePopupOverlay, ToastOverlay, ImportConfirmOverlay,
  SlotLimitOverlay, BackupRestoreOverlay,
} from './overlays';

export interface OverlayState {
  showSzilánkPicker: boolean;
  showSlotList: boolean;
  slotDeleteTarget: { uid: string; név: string } | null;
  saveFile: { blob: Blob; filename: string } | null;
  loadError: string;
  showFullscreenHint: boolean;
  showNewConfirm: boolean;
  showTestConfirm: boolean;
  showUndo: boolean;
  undoSelected: number | null;
  overlayScreen: 'jegyzetek' | 'naplo' | null;
  sharePopup: { név: string; copied: boolean; url?: string } | null;
  toast: { msg: string; type: 'success' | 'error' } | null;
  importConfirm: { karakter: Karakter; matchUid: string } | null;
  showSlotLimit: boolean;
  backupRestore: { karakterek: { karakter: Karakter; undo: any[] }[]; dátum: string } | null;
}

interface Props {
  state: OverlayState;
  setState: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: (v: Session | ((prev: Session) => Session)) => void;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string, patches?: UndoPatch[], nextValue?: unknown) => void;
  undoStack: { timestamp: number; leírás: string; patches: unknown[] }[];
  undoTo: (index: number) => void;
  duplicateSlot: (uid: string) => void;
  handleGenerateSave: (mode: 'single' | 'backup') => void;
  shareFile: (blob: Blob, filename: string) => void;
  downloadFile: (blob: Blob, filename: string) => void;
  loadKarakter: () => void;
  shareSlotUrl: (uid: string) => void;
  saveSlotToFile: (uid: string, action: 'download' | 'share') => void;
  importKarakter: (k: Karakter, overwriteUid: string | false) => void;
  deleteSlot: (uid: string) => void;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setTestMode: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
  isDirty: boolean;
}

export function AppOverlays({
  state: s, setState: set, data, karakter, session, setSession,
  setKarakter, pushUndo, undoStack, undoTo, duplicateSlot, handleGenerateSave,
  shareFile, downloadFile, loadKarakter, shareSlotUrl, saveSlotToFile, importKarakter, deleteSlot,
  setUndoStack, setTestMode, setIsDirty, isDirty,
}: Props) {

  // --- Slot delete handler ---
  const handleSlotDelete = () => {
    deleteSlot(s.slotDeleteTarget!.uid);
    set('slotDeleteTarget', null);
  };

  // --- New char handler ---
  const handleNewChar = () => {
    const uid = generateUid();
    setKarakter({ ...data.emptyKarakter, uid, id_leíró: generateIdLeíró('', data.emptyKarakter.tsz) });
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(false);
    set('showNewConfirm', false);
  };

  // --- Slot list handlers ---
  const handleSlotLoad = (k: Karakter, undo: any[]) => {
    setKarakter(k); setUndoStack(undo); setTestMode(false); setIsDirty(true); set('showSlotList', false);
  };

  const loadTestKarakter = () => {
    const refErr = validateKarakterData(data.testKarakter, data);
    if (refErr) { set('showTestConfirm', false); set('loadError', `Teszt karakter hiba: ${refErr}`); return; }
    setKarakter({
      ...data.testKarakter,
      uid: data.testKarakter.uid || generateUid(),
      id_leíró: data.testKarakter.id_leíró || generateIdLeíró(data.testKarakter.név, data.testKarakter.tsz),
      előtörténet: { ...DEFAULT_ELOTORTENET, ...data.testKarakter.előtörténet },
      session: { ...DEFAULT_SESSION, ...data.testKarakter.session },
    });
    setUndoStack([]); setTestMode(false); setIsDirty(true); set('showTestConfirm', false);
  };

  const handleSlotTest = () => loadTestKarakter();

  /** Reset test char if already active, otherwise open confirm dialog */
  const handleTestBtn = () => {
    const testUid = data.testKarakter.uid;
    if (testUid && karakter?.uid === testUid) {
      // Already viewing test char → reset to original state
      loadTestKarakter();
      set('showSlotList', false);
      set('toast', { msg: 'Teszt karakter alapállapotba állítva', type: 'success' });
    } else if (!isDirty) {
      // Untouched empty karakter → load without confirmation
      set('showSlotList', false);
      loadTestKarakter();
    } else {
      set('showSlotList', false);
      set('showTestConfirm', true);
    }
  };

  return (
    <>

      {s.showSzilánkPicker && (
        <SzilankPickerOverlay
          current={session.szilánk}
          onPick={v => { pushUndo(`Szilánk: ${session.szilánk} → ${v}`, [{ field: 'session', prev: session }]); setSession(prev => ({ ...prev, szilánk: v })); set('showSzilánkPicker', false); }}
        />
      )}

      {s.showNewConfirm && <NewCharConfirmOverlay onConfirm={handleNewChar} />}

      {s.showTestConfirm && <TestConfirmOverlay onConfirm={handleSlotTest} />}

      {s.showSlotList && (
        <SlotListOverlay
          activeUid={karakter?.uid}
          onLoad={handleSlotLoad}
          onDelete={(uid, név) => set('slotDeleteTarget', { uid, név })}
          onShare={shareSlotUrl}
          onSaveFile={(uid) => saveSlotToFile(uid, 'download')}
          onShareFile={(uid) => saveSlotToFile(uid, 'share')}
          onDuplicate={duplicateSlot}
          onFileLoad={() => { set('showSlotList', false); loadKarakter(); }}
          onNew={() => { set('showSlotList', false); if (isSlotFull()) { set('showSlotLimit', true); } else { set('showNewConfirm', true); } }}
          onSave={() => { handleGenerateSave('backup'); }}
          newDisabled={!isDirty}
          onTest={handleTestBtn}
          onFullscreenHint={() => { set('showSlotList', false); set('showFullscreenHint', true); }}
          onClose={() => set('showSlotList', false)}
        />
      )}

      {s.slotDeleteTarget && (
        <SlotDeleteOverlay
          név={s.slotDeleteTarget.név}
          onConfirm={handleSlotDelete}
        />
      )}

      {s.saveFile && (
        <SaveFileOverlay
          filename={s.saveFile.filename}
          blob={s.saveFile.blob}
          onShare={(b, f) => { shareFile(b, f); set('saveFile', null); }}
          onDownload={(b, f) => { downloadFile(b, f); set('saveFile', null); }}
          onClose={() => set('saveFile', null)}
        />
      )}

      {s.showUndo && (
        <UndoOverlay
          entries={undoStack}
          selected={s.undoSelected}
          onSelect={i => set('undoSelected', i)}
          onApply={() => { if (s.undoSelected !== null) undoTo(s.undoSelected); }}
          onReset={() => { setUndoStack([]); set('showUndo', false); set('undoSelected', null); }}
          onClose={() => { set('showUndo', false); set('undoSelected', null); }}
        />
      )}

      {s.loadError && <LoadErrorOverlay message={s.loadError} onClose={() => set('loadError', '')} />}

      {s.showFullscreenHint && <FullscreenHintOverlay onClose={() => set('showFullscreenHint', false)} />}

      {s.overlayScreen && (
        <OverlayScreenOverlay
          screen={s.overlayScreen}
          karakter={karakter}
          setKarakter={setKarakter}
          onClose={() => set('overlayScreen', null)}
        />
      )}

      {s.sharePopup && (
        <SharePopupOverlay
          név={s.sharePopup.név}
          copied={s.sharePopup.copied}
          url={s.sharePopup.url}
          onClose={() => set('sharePopup', null)}
        />
      )}

      {s.toast && <ToastOverlay msg={s.toast.msg} type={s.toast.type} />}

      {s.importConfirm && (
        <ImportConfirmOverlay
          karakter={s.importConfirm.karakter}
          matchUid={s.importConfirm.matchUid}
          onOverwrite={() => importKarakter(s.importConfirm!.karakter, s.importConfirm!.matchUid)}
          onNewCopy={() => importKarakter(s.importConfirm!.karakter, false)}
          onCancel={() => set('importConfirm', null)}
        />
      )}

      {s.showSlotLimit && (
        <SlotLimitOverlay onClose={() => set('showSlotLimit', false)} />
      )}

      {s.backupRestore && (
        <BackupRestoreOverlay
          karakterek={s.backupRestore.karakterek}
          dátum={s.backupRestore.dátum}
          onRestore={(selected) => {
            const restored = restoreBackup(selected);
            if (restored) {
              setKarakter(restored.karakter);
              setUndoStack(restored.undo as typeof undoStack);
              setTestMode(false);
              setIsDirty(true);
            }
            set('backupRestore', null);
            set('toast', { msg: `${selected.length} karakter betöltve`, type: 'success' });
          }}
          onClose={() => set('backupRestore', null)}
        />
      )}
    </>
  );
}
