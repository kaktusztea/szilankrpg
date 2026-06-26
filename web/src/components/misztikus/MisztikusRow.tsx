interface MisztikusRowProps {
  név: string;
  szint: number;
  maxSzint: number;
  canDelete?: boolean;
  warning?: boolean;
  gameMode: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function MisztikusRow({ név, szint, maxSzint, canDelete = true, warning = false, gameMode, onEdit, onDelete }: MisztikusRowProps) {
  const displayName = név.includes(':') ? név.split(':')[1].trim() : név;

  return (
    <div className="miszt-row" onClick={() => !gameMode && onEdit()}>
      <span className={`miszt-row-name${warning ? ' miszt-row-warn' : ''}`}>{displayName}</span>
      {canDelete && !gameMode && (
        <button className="fort-delete" onClick={e => { e.stopPropagation(); onDelete?.(); }}>✕</button>
      )}
      <strong className={`kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`}>{szint}</strong>
    </div>
  );
}
