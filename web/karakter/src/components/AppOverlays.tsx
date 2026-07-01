import type { Karakter, Session } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { validateKarakterData } from '../engine/validate';
import { generateUid, generateIdLeíró } from '../engine/file-ops';
import { DEFAULT_SESSION } from '../engine/types';
import { isSlotFull } from '../hooks/slot-utils';
import { MAX_KARAKTER_DB } from '../ui-constants';
import {
  MenuOverlay, SzilankPickerOverlay, NewCharConfirmOverlay,
  SlotListOverlay, SlotDeleteOverlay, SaveOverlay, SaveFileOverlay,
  UndoOverlay, LoadErrorOverlay, FullscreenHintOverlay,
  OverlayScreenOverlay, SharePopupOverlay, ToastOverlay, ImportConfirmOverlay,
  SlotLimitOverlay, BackupRestoreOverlay,
} from './overlays';

export interface OverlayState {
  showMenu: boolean;
  showSzilánkPicker: boolean;
  showSlotList: boolean;
  slotDeleteTarget: { uid: string; név: string } | null;
  showSavePopup: boolean;
  saveFile: { blob: Blob; filename: string } | null;
  loadError: string;
  showFullscreenHint: boolean;
  showNewConfirm: boolean;
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
  undoStack: { timestamp: number; leírás: string; patches: unknown[] }[];
  undoTo: (index: number) => void;
  duplicateKarakter: () => void;
  handleGenerateSave: (mode: 'single' | 'backup') => void;
  shareFile: (blob: Blob, filename: string) => void;
  downloadFile: (blob: Blob, filename: string) => void;
  loadKarakter: () => void;
  shareSlotUrl: (uid: string) => void;
  importKarakter: (k: Karakter, overwriteUid: string | false) => void;
  deleteSlot: (uid: string) => void;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setTestMode: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
  isDirty: boolean;
}

export function AppOverlays({
  state: s, setState: set, data, karakter, session, setSession,
  setKarakter, undoStack, undoTo, duplicateKarakter, handleGenerateSave,
  shareFile, downloadFile, loadKarakter, shareSlotUrl, importKarakter, deleteSlot,
  setUndoStack, setTestMode, setIsDirty, isDirty,
}: Props) {

  // --- Menu ---
  const closeMenu = () => set('showMenu', false);

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

  const handleSlotTest = () => {
    const refErr = validateKarakterData(data.testKarakter, data);
    if (refErr) { set('showSlotList', false); set('loadError', `Teszt karakter hiba: ${refErr}`); return; }
    setKarakter({
      ...data.testKarakter,
      uid: data.testKarakter.uid || generateUid(),
      id_leíró: data.testKarakter.id_leíró || generateIdLeíró(data.testKarakter.név, data.testKarakter.tsz),
      session: { ...DEFAULT_SESSION, ...data.testKarakter.session },
    });
    setUndoStack([]); setTestMode(true); setIsDirty(true); set('showSlotList', false);
  };

  return (
    <>
      {s.showMenu && (
        <MenuOverlay
          undoCount={undoStack.length}
          isNewDisabled={!isDirty}
          onUndo={() => { closeMenu(); set('showUndo', true); set('undoSelected', null); }}
          onSlots={() => { closeMenu(); set('showSlotList', true); }}
          onDuplicate={() => { closeMenu(); duplicateKarakter(); }}
          onSave={() => { closeMenu(); set('showSavePopup', true); }}
          onNew={() => { closeMenu(); if (isSlotFull()) { set('showSlotLimit', true); } else { set('showNewConfirm', true); } }}
          onFullscreenHint={() => { closeMenu(); set('showFullscreenHint', true); }}
          onClose={closeMenu}
        />
      )}

      {s.showSzilánkPicker && (
        <SzilankPickerOverlay
          current={session.szilánk}
          onPick={v => { setSession(prev => ({ ...prev, szilánk: v })); set('showSzilánkPicker', false); }}
        />
      )}

      {s.showNewConfirm && <NewCharConfirmOverlay onConfirm={handleNewChar} />}

      {s.showSlotList && (
        <SlotListOverlay
          activeUid={karakter?.uid}
          onLoad={handleSlotLoad}
          onDelete={(uid, név) => set('slotDeleteTarget', { uid, név })}
          onShare={shareSlotUrl}
          onTest={handleSlotTest}
          onFileLoad={() => { set('showSlotList', false); loadKarakter(); }}
          onClose={() => set('showSlotList', false)}
        />
      )}

      {s.slotDeleteTarget && (
        <SlotDeleteOverlay
          név={s.slotDeleteTarget.név}
          onConfirm={handleSlotDelete}
          onClose={() => set('slotDeleteTarget', null)}
        />
      )}

      {s.showSavePopup && (
        <SaveOverlay
          onSingle={() => handleGenerateSave('single')}
          onBackup={() => handleGenerateSave('backup')}
          onClose={() => set('showSavePopup', false)}
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
            // Perform the actual restore
            let slots: { uid: string; id_leíró: string; név: string; tsz: number; mentés_dátum: string }[] = [];
            try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { slots = []; }

            const MAX = MAX_KARAKTER_DB;
            // Count how many new entries we can still insert
            const currentCount = slots.length;
            let newInserted = 0;
            const maxNew = MAX - currentCount;
            let lastKarakter: Karakter | null = null;
            let lastUndo: any[] = [];

            for (const { karakter: k, undo } of selected) {
              const existingIdx = slots.findIndex(sl => sl.uid === k.uid);
              // If it's a new character and we've reached the limit, skip
              if (existingIdx < 0 && newInserted >= maxNew) continue;

              const toSave = { ...k, _undo: undo } as any;
              try {
                localStorage.setItem(`szilank_char_${k.uid}`, JSON.stringify(toSave));
                const entry = { uid: k.uid, id_leíró: k.id_leíró, név: k.név, tsz: k.tsz, mentés_dátum: (k as any).mentés_dátum || new Date().toISOString() };
                if (existingIdx >= 0) { slots[existingIdx] = entry; }
                else { slots.push(entry); newInserted++; }
                lastKarakter = k;
                lastUndo = undo;
              } catch { /* quota exceeded */ break; }
            }

            localStorage.setItem('szilank_slots', JSON.stringify(slots));

            if (lastKarakter) {
              setKarakter(lastKarakter);
              setUndoStack(lastUndo);
              setTestMode(false);
              setIsDirty(true);
              localStorage.setItem('szilank_active', lastKarakter.uid);
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
