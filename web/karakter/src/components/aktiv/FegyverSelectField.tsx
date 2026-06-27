interface Props {
  label: string;
  value: number;
  options: { név: string; idx: number }[];
  onChange: (idx: number) => void;
}

export function FegyverSelectField({ label, value, options, onChange }: Props) {
  return (
    <div className="aktiv-field-btn">
      <span className="aktiv-field-label">{label}</span>
      <select className="aktiv-field-select" value={value} onChange={e => onChange(parseInt(e.target.value))}>
        {options.map(f => (
          <option key={f.idx} value={f.idx} className={f.idx < 0 ? 'aktiv-option-special' : undefined}>{f.név}</option>
        ))}
      </select>
    </div>
  );
}
