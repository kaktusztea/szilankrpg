import { OverlayPortal } from './OverlayPortal';
import { MD_BASE, REPO_BASE } from '../MdLink';

interface Props {
  current: number;
  onPick: (value: number) => void;
  onClose: () => void;
}

export function SzilankPickerOverlay({ current, onPick, onClose }: Props) {
  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt overlay-szilank">
        <label className="overlay-label">Szilánk</label>
        <div className="overlay-btn-row">
          {[0, 1, 2, 3].map(v => (
            <button key={v} className={`fort-fok-btn ${current === v ? 'active' : ''}`}
              onClick={() => onPick(v)}>{v}</button>
          ))}
        </div>

        <hr className="szilank-divider" />

        <a className="szilank-hub-link" href={MD_BASE + 'szabalyrendszer.md'}
          target="_blank" rel="noopener noreferrer">📖 Szabályrendszer</a>

        <hr className="szilank-divider" />

        <a className="szilank-hub-link" href={REPO_BASE + 'web/karakter/README.md'}
          target="_blank" rel="noopener noreferrer">📱 Webapp manuál</a>


      </div>
    </OverlayPortal>
  );
}
