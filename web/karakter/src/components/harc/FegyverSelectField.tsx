interface Props {
  label: string;
  selectedIdx: number;
  options: { név: string; idx: number }[];
  onChange: (idx: number) => void;
}

export function FegyverSelectField({ label, selectedIdx, options, onChange }: Props) {
  return (
    <div className="aktiv-field-btn">
      <span className="aktiv-field-label">{label}</span>
      <select className="aktiv-field-select" value={selectedIdx} onChange={e => onChange(parseInt(e.target.value))}>
        {options.map(f => (
          <option key={f.idx} value={f.idx} className={f.idx < 0 ? 'aktiv-option-special' : undefined}>{f.név}</option>
        ))}
      </select>
    </div>
  );
}
