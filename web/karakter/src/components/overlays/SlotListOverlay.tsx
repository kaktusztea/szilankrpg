import { OverlayPortal } from './OverlayPortal';
import { SlotList } from '../SlotList';
import type { Karakter } from '../../engine/types';

interface Props {
  activeUid: string | undefined;
  onLoad: (k: Karakter, undo: any[]) => void;
  onDelete: (uid: string, név: string) => void;
  onShare: (uid: string) => void;
  onTest: () => void;
  onFileLoad: () => void;
  onClose: () => void;
}

export function SlotListOverlay({ activeUid, onLoad, onDelete, onShare, onTest, onFileLoad, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-slots">
        <label className="overlay-label-center">Karakterek</label>
        <SlotList
          activeUid={activeUid}
          onLoad={onLoad}
          onDelete={onDelete}
          onShare={onShare}
          onTest={onTest}
          onFileLoad={onFileLoad}
        />
      </div>
    </OverlayPortal>
  );
}
