import { OverlayPortal } from './OverlayPortal';
import { SlotList } from '../SlotList';
import type { Karakter } from '../../engine/types';

interface Props {
  activeUid: string | undefined;
  onLoad: (k: Karakter, undo: any[]) => void;
  onDelete: (uid: string, név: string) => void;
  onShare: (uid: string) => void;
  onSaveFile: (uid: string) => void;
  onShareFile: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onFileLoad: () => void;
  onClipboardImport: (text: string) => void;
  onNew: () => void;
  onSave: () => void;
  newDisabled: boolean;
  onTest: () => void;
  onFullscreenHint: () => void;
  onClose: () => void;
}

export function SlotListOverlay({ activeUid, onLoad, onDelete, onShare, onSaveFile, onShareFile, onDuplicate, onFileLoad, onClipboardImport, onNew, onSave, newDisabled, onTest, onFullscreenHint, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-slots">
        <label className="overlay-label-center">Karakterek</label>
        <SlotList
          activeUid={activeUid}
          onLoad={onLoad}
          onDelete={onDelete}
          onShare={onShare}
          onSaveFile={onSaveFile}
          onShareFile={onShareFile}
          onDuplicate={onDuplicate}
          onFileLoad={onFileLoad}
          onClipboardImport={onClipboardImport}
          onNew={onNew}
          onSave={onSave}
          newDisabled={newDisabled}
          onTest={onTest}
          onFullscreenHint={onFullscreenHint}
          onClose={onClose}
        />
      </div>
    </OverlayPortal>
  );
}
