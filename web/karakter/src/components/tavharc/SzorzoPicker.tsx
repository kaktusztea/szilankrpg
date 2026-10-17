import type { TavharcSzorzoEntry } from '../../engine/types';

interface Props {
  label: string;
  list: TavharcSzorzoEntry[];
  activeId: number;
  onSelect: (id: number) => void;
}

export function SzorzóPicker({ label, list, activeId, onSelect }: Props) {
  return (
    <div className="th-picker">
      <div className="th-picker-label">{label}</div>
      {list.map(item => (
        <button
          type="button"
          key={item.id}
          className={`th-picker-item${item.id === activeId ? ' th-picker-active' : ''}`}
          aria-pressed={item.id === activeId}
          onClick={() => onSelect(item.id)}
        >
          {item.szorzó}×: {item.leírás}
        </button>
      ))}
    </div>
  );
}
