import type { Karakter, Session } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import type { UndoPatch } from '../hooks/useUndo';
import { isSlotFull } from '../hooks/slot-utils';
import { restoreBackup } from '../hooks/backup-restore';
import {
  SzilankPickerOverlay, NewCharConfirmOverlay, TestConfirmOverlay,
  SlotListOverlay, SlotDeleteOverlay, SaveFileOverlay,
  UndoOverlay, LoadErrorOverlay, FullscreenHintOverlay,
  OverlayScreenOverlay, SharePopupOverlay, ToastOverlay, ImportConfirmOverlay,
  SlotLimitOverlay, BackupRestoreOverlay, type SlotLimitKind,
} from './overlays';
import { QrCodePopup } from './overlays/QrCodePopup';
import { useOverlayHandlers } from '../hooks/useOverlayHandlers';

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
  overlayScreen: boolean;
  sharePopup: { név: string; copied: boolean; url?: string } | null;
  toast: { msg: string; type: 'success' | 'error' } | null;
  importConfirm: { karakter: Karakter; matchUid: string } | null;
  slotLimit: SlotLimitKind | null;
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
  /** Karakter aktívvá tétele (state + undo + teszt mód + dirty) — useKarakterActions */
  activateKarakter: (k: Karakter, undo?: any[]) => void;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  isDirty: boolean;
  onViewCheckpoint?: (id: string) => void;
}

export function AppOverlays({
  state: s, setState: set, data, karakter, session, setSession,
  setKarakter, pushUndo, undoStack, undoTo, duplicateSlot, handleGenerateSave,
  shareFile, downloadFile, loadKarakter, shareSlotUrl, saveSlotToFile, importKarakter, deleteSlot,
  activateKarakter, setUndoStack, isDirty, onViewCheckpoint,
}: Props) {

  const {
    qrPopup, setQrPopup,
    handleQrCode, handleSlotDelete, handleNewChar, handleSlotLoad,
    loadTestKarakter, handleTestBtn, handleClipboardImport,
  } = useOverlayHandlers({ state: s, set, data, karakter, isDirty, activateKarakter, deleteSlot });

  return (
    <>

      {s.showSzilánkPicker && (
        <SzilankPickerOverlay
          current={session.szilánk}
          onPick={v => { pushUndo(`Szilánk: ${session.szilánk} → ${v}`, [{ field: 'session', prev: session }]); setSession(prev => ({ ...prev, szilánk: v })); set('showSzilánkPicker', false); }}
          onClose={() => set('showSzilánkPicker', false)}
        />
      )}

      {s.showNewConfirm && <NewCharConfirmOverlay onConfirm={handleNewChar} />}

      {s.showTestConfirm && <TestConfirmOverlay onConfirm={loadTestKarakter} />}

      {s.showSlotList && (
        <SlotListOverlay
          activeUid={karakter?.uid}
          onLoad={handleSlotLoad}
          onDelete={(uid, név) => set('slotDeleteTarget', { uid, név })}
          onShare={shareSlotUrl}
          onQrCode={handleQrCode}
          onSaveFile={(uid) => saveSlotToFile(uid, 'download')}
          onShareFile={(uid) => saveSlotToFile(uid, 'share')}
          onDuplicate={duplicateSlot}
          onFileLoad={async () => { await loadKarakter(); set('showSlotList', false); }}
          onClipboardImport={handleClipboardImport}
          onNew={() => { set('showSlotList', false); if (isSlotFull()) { set('slotLimit', 'total'); } else { set('showNewConfirm', true); } }}
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
          karakter={karakter}
          setKarakter={setKarakter}
          onClose={() => set('overlayScreen', false)}
          onViewCheckpoint={onViewCheckpoint}
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

      {s.slotLimit && (
        <SlotLimitOverlay kind={s.slotLimit} onClose={() => set('slotLimit', null)} />
      )}

      {s.backupRestore && (
        <BackupRestoreOverlay
          karakterek={s.backupRestore.karakterek}
          dátum={s.backupRestore.dátum}
          onRestore={(selected) => {
            const restored = restoreBackup(selected);
            if (restored) {
              activateKarakter(restored.karakter, restored.undo as typeof undoStack);
            }
            set('backupRestore', null);
            set('toast', { msg: `${selected.length} karakter betöltve`, type: 'success' });
          }}
          onClose={() => set('backupRestore', null)}
        />
      )}

      {qrPopup && (
        <QrCodePopup
          url={qrPopup.url}
          név={qrPopup.név}
          tsz={qrPopup.tsz}
          onClose={() => setQrPopup(null)}
        />
      )}
    </>
  );
}
