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
  const szintClass = `kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`;

  return (
    <div className="kep-row-wrapper">
      <div className="item-row miszt-row" onClick={() => gameMode ? onInfoToggle?.() : onEdit()}>
        <span className={`miszt-row-name${warning ? ' miszt-row-warn' : ''}`}>{displayName}</span>
        {canDelete && !gameMode && (
          <button className="item-delete" onClick={e => { e.stopPropagation(); onDelete?.(); }}>✕</button>
        )}
        <strong className={szintClass}>{szint}</strong>
      </div>
      {gameMode && infoOpen && def && (
        <KepzettsegInfoPanel def={def} kit={kit || []} felvettFortelyok={felvettFortelyok || []} />
      )}
    </div>
  );
}
