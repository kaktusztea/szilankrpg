import { OverlayPortal } from './OverlayPortal';

interface Props {
  filename: string;
  blob: Blob;
  onShare: (blob: Blob, filename: string) => void;
  onDownload: (blob: Blob, filename: string) => void;
  onClose: () => void;
}

export function SaveFileOverlay({ filename, blob, onShare, onDownload, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-menu">
        <label className="overlay-label-center">Fájl kész</label>
        <span className="overlay-filename">{filename}</span>
        {typeof navigator.share === 'function' && (
          <button className="menu-item" onClick={() => onShare(blob, filename)}>📤 Megosztás</button>
        )}
        <button className="menu-item" onClick={() => onDownload(blob, filename)}>💾 Helyi mentés</button>
      </div>
    </OverlayPortal>
  );
}
