import type { TavharcSzorzoEntry } from '../../engine/types';

export function SzorzóPicker({ label, list, activeId, onSelect }: {
  label: string;
  list: TavharcSzorzoEntry[];
  activeId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="th-picker">
      <div className="th-picker-label">{label}</div>
      {list.map(item => (
        <div
          key={item.id}
          className={`th-picker-item${item.id === activeId ? ' th-picker-active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.szorzó}×: {item.leírás}
        </div>
      ))}
    </div>
  );
}
