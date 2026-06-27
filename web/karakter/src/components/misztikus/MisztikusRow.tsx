import type { KepzettsegDef, KiterjesztesEntry } from '../../engine/data-loader';
import { KepzettsegInfoPanel } from '../KepzettsegInfoPanel';

interface MisztikusRowProps {
  név: string;
  szint: number;
  maxSzint: number;
  canDelete?: boolean;
  warning?: boolean;
  gameMode: boolean;
  infoOpen?: boolean;
  def?: KepzettsegDef;
  kit?: KiterjesztesEntry[];
  felvettFortelyok?: string[];
  onEdit: () => void;
  onDelete?: () => void;
  onInfoToggle?: () => void;
}

export function MisztikusRow({ név, szint, maxSzint, canDelete = true, warning = false, gameMode, infoOpen, def, kit, felvettFortelyok, onEdit, onDelete, onInfoToggle }: MisztikusRowProps) {
  const displayName = név.includes(':') ? név.split(':')[1].trim() : név;

  return (
    <div className="kep-row-wrapper">
      <div className="miszt-row" onClick={() => {
        if (gameMode) onInfoToggle?.();
        else onEdit();
      }}>
        <span className={`miszt-row-name${warning ? ' miszt-row-warn' : ''}`}>{displayName}</span>
        {canDelete && !gameMode && (
          <button className="fort-delete" onClick={e => { e.stopPropagation(); onDelete?.(); }}>✕</button>
        )}
        <strong className={`kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`}>{szint}</strong>
      </div>
      {gameMode && infoOpen && def && (
        <KepzettsegInfoPanel def={def} kit={kit || []} felvettFortelyok={felvettFortelyok || []} />
      )}
    </div>
  );
}
