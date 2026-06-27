import { OverlayPortal } from './OverlayPortal';
import type { Karakter } from '../../engine/types';

interface Props {
  karakter: Karakter;
  matchUid: string;
  onOverwrite: () => void;
  onNewCopy: () => void;
  onCancel: () => void;
}

export function ImportConfirmOverlay({ karakter, onOverwrite, onNewCopy, onCancel }: Props) {
  return (
    <OverlayPortal>
      <div className="kep-prompt overlay-confirm">
        <label className="import-confirm-label">Karakter importálása</label>
        <span className="import-confirm-msg">
          „{karakter.név} ({karakter.tsz}sz)" már létezik a Karaktertáradban.
        </span>
        <div className="import-confirm-btns">
          <button className="menu-item" onClick={onOverwrite}>Felülírás</button>
          <button className="menu-item" onClick={onNewCopy}>Új példány</button>
          <button className="menu-item" onClick={onCancel}>Mégse</button>
        </div>
      </div>
    </OverlayPortal>
  );
}
