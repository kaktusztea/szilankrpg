import type { HátterField } from './types';

interface TagCloudProps {
  items: string[];
  aktív: string[];
  field: HátterField;
  többszörös: boolean;
  gameMode: boolean;
  colorClass?: string;
  onToggle: (item: string, field: HátterField, többszörös: boolean) => void;
  onRemove: (entry: string, field: HátterField) => void;
  getMultiEntries: (baseNév: string, field: HátterField) => string[];
  isMaxed?: (item: string) => boolean;
}

export function TagCloud({ items, aktív, field, többszörös, gameMode, colorClass = '', onToggle, onRemove, getMultiEntries, isMaxed }: TagCloudProps) {
  if (többszörös) {
    return (
      <div className="hatter-cloud">
        {items.flatMap(item =>
          getMultiEntries(item, field).map((entry, i) => (
            <span key={`a-${entry}-${i}`} className={`hatter-tag ${colorClass} active`} onClick={() => !gameMode && onRemove(entry, field)}>
              {entry}
            </span>
          ))
        )}
        {!gameMode && items.map(item => (
          <span key={item} className={`hatter-tag ${colorClass} hatter-tag-multi${isMaxed?.(item) ? ' hatter-tag-disabled' : ''}`} onClick={() => onToggle(item, field, true)}>{item}</span>
        ))}
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => {
    const aAct = aktív.includes(a) ? 0 : 1;
    const bAct = aktív.includes(b) ? 0 : 1;
    return aAct - bAct || a.localeCompare(b, 'hu');
  });

  return (
    <div className="hatter-cloud">
      {sorted.map(item => (
        <span
          key={item}
          className={`hatter-tag ${colorClass} ${aktív.includes(item) ? 'active' : ''}`}
          onClick={() => onToggle(item, field, false)}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
