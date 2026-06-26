import { createPortal } from 'react-dom';
import type { Karakter, Session } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { generateUid, generateIdLeíró } from '../engine/file-ops';
import { validateKarakterData } from '../engine/validate';
import { SlotList } from './SlotList';
import { NaploTab } from './NaploTab';

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
}

interface Props {
  state: OverlayState;
  setState: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: (v: Session | ((prev: Session) => Session)) => void;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  undoStack: { timestamp: number; leírás: string; session: Session; karakter: Karakter }[];
  undoTo: (index: number) => void;
  duplicateKarakter: () => void;
  handleGenerateSave: (mode: 'single' | 'backup') => void;
  shareFile: (blob: Blob, filename: string) => void;
  downloadFile: (blob: Blob, filename: string) => void;
  loadKarakter: () => void;
  shareSlotUrl: (uid: string) => void;
  importKarakter: (k: Karakter, overwriteUid: string | false) => void;
  setUndoStack: React.Dispatch<React.SetStateAction<any[]>>;
  setTestMode: (v: boolean) => void;
  setIsDirty: (v: boolean) => void;
}

export function AppOverlays({ state, setState, data, karakter, session, setSession, setKarakter,
  undoStack, undoTo, duplicateKarakter, handleGenerateSave, shareFile, downloadFile,
  loadKarakter, shareSlotUrl, importKarakter, setUndoStack, setTestMode, setIsDirty }: Props) {

  const s = state;
  const set = setState;

  return (
    <>
      {s.showMenu && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-menu">
            <button className="menu-item" disabled={undoStack.length === 0}
              onClick={() => { set('showMenu', false); set('showUndo', true); set('undoSelected', null); }}>
              ↩ Visszavonás{undoStack.length > 0 ? ` (${undoStack.length})` : ''}
            </button>
            <button className="menu-item" onClick={() => { set('showMenu', false); set('showSlotList', true); }}>📂 Karakterek</button>
            <button className="menu-item" onClick={() => { set('showMenu', false); duplicateKarakter(); }}>📋 Duplikál</button>
            <button className="menu-item" onClick={() => { set('showMenu', false); set('showSavePopup', true); }}>💾 Mentés</button>
            <button className="menu-item" onClick={() => { set('showMenu', false); set('showNewConfirm', true); }}>📄 Új karakter</button>
            {document.fullscreenEnabled && (
              <button className="menu-item" onClick={() => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); set('showMenu', false); }}>
                {document.fullscreenElement ? '⛶ Kilépés teljes képernyőből' : '⛶ Teljes képernyő'}
              </button>
            )}
            {!document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches && (
              <button className="menu-item" onClick={() => { set('showMenu', false); set('showFullscreenHint', true); }}>⛶ Teljes képernyő</button>
            )}
          </div>
        </div>,
        document.body
      )}

      {s.showSzilánkPicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-szilank">
            <label className="overlay-label">Szilánk</label>
            <div className="overlay-btn-row">
              {[0, 1, 2, 3].map(v => (
                <button key={v} className={`fort-fok-btn ${session.szilánk === v ? 'active' : ''}`}
                  onClick={() => { setSession(s2 => ({ ...s2, szilánk: v })); set('showSzilánkPicker', false); }}>{v}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {s.showNewConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-confirm">
            <label className="overlay-label">Új karakter?</label>
            <span className="overlay-desc">Az aktuális karakter NEM vész el, hanem mentésre kerül.<br/>A Karakterek menü alatt elérhető.</span>
            <button className="btn-del-confirm overlay-ok-btn" onClick={() => {
              const uid = generateUid();
              setKarakter({ ...data.emptyKarakter, uid, id_leíró: generateIdLeíró('', data.emptyKarakter.tsz) });
              setUndoStack([]);
              setTestMode(false);
              setIsDirty(false);
              set('showNewConfirm', false);
            }}>Új karakter</button>
          </div>
        </div>,
        document.body
      )}

      {s.showSlotList && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('showSlotList', false); }}>
          <div className="kep-prompt overlay-slots">
            <label className="overlay-label-center">Karakterek</label>
            <SlotList
              activeUid={karakter?.uid}
              onLoad={(k, undo) => { setKarakter(k); setUndoStack(undo); setTestMode(false); setIsDirty(true); set('showSlotList', false); }}
              onDelete={(uid, név) => set('slotDeleteTarget', { uid, név })}
              onShare={shareSlotUrl}
              onTest={() => {
                const refErr = validateKarakterData(data.testKarakter, data);
                if (refErr) { set('showSlotList', false); set('loadError', `Teszt karakter hiba: ${refErr}`); return; }
                setKarakter({
                  ...data.testKarakter,
                  uid: data.testKarakter.uid || generateUid(),
                  id_leíró: data.testKarakter.id_leíró || generateIdLeíró(data.testKarakter.név, data.testKarakter.tsz),
                  session: { ...DEFAULT_SESSION, ...data.testKarakter.session }
                });
                setUndoStack([]); setTestMode(true); set('showSlotList', false);
              }}
              onFileLoad={() => { set('showSlotList', false); loadKarakter(); }}
            />
          </div>
        </div>,
        document.body
      )}

      {s.slotDeleteTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('slotDeleteTarget', null); }}>
          <div className="kep-prompt overlay-confirm">
            <label className="overlay-label">Karakter törlése</label>
            <span className="overlay-desc-dim">Törlöd: "{s.slotDeleteTarget.név}"?</span>
            <button className="btn-del-confirm overlay-ok-btn" onClick={() => {
              const uid = s.slotDeleteTarget!.uid;
              localStorage.removeItem(`szilank_char_${uid}`);
              let sl: { uid: string; id_leíró: string; név: string; tsz: number; mentés_dátum: string }[] = [];
              try { sl = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
              sl = sl.filter(x => x.uid !== uid);
              localStorage.setItem('szilank_slots', JSON.stringify(sl));
              if (karakter?.uid === uid) {
                if (sl.length > 0) {
                  const next = localStorage.getItem(`szilank_char_${sl[0].uid}`);
                  if (next) { const p = JSON.parse(next); setKarakter({ ...p, session: { ...DEFAULT_SESSION, ...p.session } }); setUndoStack((p as any)._undo || []); }
                } else { setKarakter({ ...data.emptyKarakter, uid: generateUid(), id_leíró: generateIdLeíró('', data.emptyKarakter.tsz) }); setUndoStack([]); }
              }
              set('slotDeleteTarget', null);
            }}>Törlés</button>
          </div>
        </div>,
        document.body
      )}

      {s.showSavePopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('showSavePopup', false); }}>
          <div className="kep-prompt overlay-menu">
            <label className="overlay-label-center">Mentés</label>
            <button className="menu-item" onClick={() => handleGenerateSave('single')}>📄 Aktuális karakter</button>
            <button className="menu-item" onClick={() => handleGenerateSave('backup')}>📦 Összes karakter (backup)</button>
          </div>
        </div>,
        document.body
      )}

      {s.saveFile && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('saveFile', null); }}>
          <div className="kep-prompt overlay-menu">
            <label className="overlay-label-center">Fájl kész</label>
            <span className="overlay-filename">{s.saveFile.filename}</span>
            {typeof navigator.share === 'function' && (
              <button className="menu-item" onClick={() => { shareFile(s.saveFile!.blob, s.saveFile!.filename); set('saveFile', null); }}>📤 Megosztás</button>
            )}
            <button className="menu-item" onClick={() => { downloadFile(s.saveFile!.blob, s.saveFile!.filename); set('saveFile', null); }}>💾 Helyi mentés</button>
          </div>
        </div>,
        document.body
      )}

      {s.showUndo && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { set('showUndo', false); set('undoSelected', null); } }}>
          <div className="kep-prompt overlay-undo">
            <label className="overlay-label-center">Visszavonás</label>
            <div className="undo-list">
              {undoStack.map((entry, i) => (
                <div key={entry.timestamp} onClick={() => set('undoSelected', i)}
                  className={`undo-entry ${s.undoSelected !== null && i <= s.undoSelected ? 'undo-entry-selected' : ''} ${i === s.undoSelected ? 'undo-entry-target' : ''}`}>
                  {s.undoSelected !== null && i <= s.undoSelected ? '●' : '○'} {entry.leírás}
                </div>
              ))}
            </div>
            <button disabled={s.undoSelected === null} className={`undo-apply-btn ${s.undoSelected !== null ? 'undo-apply-active' : ''}`}
              onClick={() => { if (s.undoSelected !== null) undoTo(s.undoSelected); }}>
              Visszaállítás{s.undoSelected !== null ? ` (${s.undoSelected + 1} művelet)` : ''}
            </button>
          </div>
        </div>,
        document.body
      )}

      {s.loadError && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-confirm">
            <label className="overlay-label overlay-label-error">Betöltési hiba</label>
            <span className="overlay-desc">{s.loadError}</span>
            <button className="btn-del-confirm overlay-ok-btn" onClick={() => set('loadError', '')}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {s.showFullscreenHint && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-confirm">
            <label className="overlay-label">Teljes képernyő</label>
            <span className="overlay-desc">
              {/iPad|iPhone|iPod/.test(navigator.userAgent)
                ? 'Megosztás ikon (⬆️) → Főképernyőhöz adás'
                : '⋮ menü → Telepítés / Hozzáadás a kezdőképernyőhöz'}
            </span>
            <button className="menu-item overlay-ok-btn" onClick={() => set('showFullscreenHint', false)}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {s.overlayScreen && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('overlayScreen', null); }}>
          <div className="fullscreen-overlay">
            <div className="fullscreen-overlay-header">
              <button className="fullscreen-overlay-close" onClick={() => set('overlayScreen', null)}>✕</button>
              <span className="fullscreen-overlay-title">{s.overlayScreen === 'jegyzetek' ? '✏️ Jegyzetek' : '📅 Napló'}</span>
            </div>
            <div className="fullscreen-overlay-body">
              {s.overlayScreen === 'jegyzetek' && (
                <>
                <textarea
                  className="app-jegyzetek-textarea"
                  value={karakter.jegyzetek}
                  onChange={e => setKarakter(prev => prev ? { ...prev, jegyzetek: e.target.value } : prev)}
                  placeholder="Szabad jegyzetek..."
                />
                <div className="app-proba-bar">
                  <details>
                    <summary className="app-proba-summary">Tulajdonságpróba (k6)</summary>
                    <pre className="app-proba-pre">{`3: Könnyű\n4: Átlagos\n5: Nehéz\n6: Nagyon nehéz\n7: Rendkívül nehéz\n8: Emberfeletti`}</pre>
                  </details>
                  <details>
                    <summary className="app-proba-summary">Képzettségpróba (k10)</summary>
                    <pre className="app-proba-pre">{` 6: Könnyű\n 9: Átlagos\n12: Nehéz\n15: Nagyon nehéz\n18: Rendkívül nehéz\n21: Emberfeletti`}</pre>
                  </details>
                </div>
                </>
              )}
              {s.overlayScreen === 'naplo' && <NaploTab karakter={karakter} setKarakter={setKarakter} />}
            </div>
          </div>
        </div>,
        document.body
      )}

      {s.sharePopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) set('sharePopup', null); }}>
          <div className="kep-prompt overlay-confirm">
            <label className="share-popup-label">🔗 Megosztás</label>
            <span className="share-popup-msg">
              {s.sharePopup.copied
                ? <>„{s.sharePopup.név}" link vágólapra másolva!</>
                : <>Másold ki a linket:</>}
            </span>
            {!s.sharePopup.copied && s.sharePopup.url && (
              <input readOnly value={s.sharePopup.url} onFocus={e => e.target.select()} className="share-popup-input" />
            )}
            <button className="menu-item overlay-ok-btn" onClick={() => set('sharePopup', null)}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {s.toast && createPortal(
        <div className={`toast ${s.toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {s.toast.msg}
        </div>,
        document.body
      )}

      {s.importConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt overlay-confirm">
            <label className="import-confirm-label">Karakter importálása</label>
            <span className="import-confirm-msg">
              „{s.importConfirm.karakter.név} ({s.importConfirm.karakter.tsz}sz)" már létezik a Karaktertáradban.
            </span>
            <div className="import-confirm-btns">
              <button className="menu-item" onClick={() => importKarakter(s.importConfirm!.karakter, s.importConfirm!.matchUid)}>Felülírás</button>
              <button className="menu-item" onClick={() => importKarakter(s.importConfirm!.karakter, false)}>Új példány</button>
              <button className="menu-item" onClick={() => set('importConfirm', null)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
