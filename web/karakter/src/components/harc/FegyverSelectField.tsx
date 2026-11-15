import { useState } from 'react';
import { ListaPicker } from '../picker/ListaPicker';

interface Props {
  label: string;
  selectedIdx: number;
  options: { név: string; idx: number; disabled?: boolean }[];
  onChange: (idx: number) => void;
}

/** Field button (label + selected weapon); tap opens an overlay list picker. */
export function FegyverSelectField({ label, selectedIdx, options, onChange }: Props) {
  const [nyitva, setNyitva] = useState(false);
  const kiválasztott = options.find(f => f.idx === selectedIdx)?.név ?? '-';
  return (
    <>
      <button type="button" className="aktiv-field-btn" onClick={() => setNyitva(true)}>
        <span className="aktiv-field-label">{label}</span>
        <strong className="aktiv-field-select">{kiválasztott}</strong>
      </button>
      {nyitva && (
        <ListaPicker title={label} aktív={String(selectedIdx)} onClose={() => setNyitva(false)}
          opciók={options.map(f => ({ érték: String(f.idx), név: f.név, disabled: f.disabled, megjegyzés: f.disabled ? 'nincs nálad' : undefined }))}
          onVálaszt={v => onChange(parseInt(v))} />
      )}
    </>
  );
}
