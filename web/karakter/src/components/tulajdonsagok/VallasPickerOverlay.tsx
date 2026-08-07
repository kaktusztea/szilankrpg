import type { GameData } from '../../engine/data-loader';
import { OverlayPortal } from '../overlays/OverlayPortal';

interface Props {
  data: GameData;
  current: string;
  onPick: (vallás: string) => void;
  onClose: () => void;
}

export function VallasPickerOverlay({ data, current, onPick, onClose }: Props) {
  // Get istenek from tradíciók → Szakrális entry
  const szakrális = data.tradiciok.find(t => t.név === 'Szakrális');
  const istenek = szakrális?.altípusok ?? [];

  // Group by pantheon
  const byPantheon = new Map<string, typeof istenek>();
  for (const i of istenek) {
    const p = i.pantheon || 'Egyéb';
    if (!byPantheon.has(p)) byPantheon.set(p, []);
    byPantheon.get(p)!.push(i);
  }
  // Sort within each group
  for (const items of byPantheon.values()) {
    items.sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  }

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt vallas-picker" onClick={e => e.stopPropagation()}>
        <label className="kep-prompt-label-bold-mb">Vallás</label>
        <div className="kep-prompt-flex-col-list vallas-picker-list">
          {/* "Nincs" opció */}
          <button
            className={`he-field-btn${!current ? ' vallas-active' : ''}`}
            onClick={() => onPick('')}
          >
            Hitetlen
          </button>

          {[...byPantheon.entries()].map(([pantheon, items]) => (
            <div key={pantheon} className="miszt-pantheon-group">
              <div className="miszt-section-label">{pantheon}</div>
              {items.map(item => (
                <button
                  key={item.név}
                  className={`he-field-btn${current === item.név ? ' vallas-active' : ''}`}
                  onClick={() => onPick(item.név)}
                >
                  {item.név}
                  {item.leírás && <span className="kep-prompt-text-dim-sm"> — {item.leírás}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
}
