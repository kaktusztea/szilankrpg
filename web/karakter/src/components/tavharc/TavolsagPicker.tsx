import { useState, useCallback } from 'react';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';

export function TávolságPicker({ value, osztó, onChange }: {
  value: number; osztó: number; onChange: (v: number) => void;
}) {
  const [val, setVal] = useState(value);
  const cellaVal = Math.ceil(val / osztó);

  const step = useCallback((dir: 1 | -1) => {
    setVal(v => { const nv = Math.max(1, Math.min(500, v + dir)); onChange(nv); return nv; });
  }, [onChange]);

  const { holdProps } = useHoldRepeat(step);

  return (
    <div className="th-tavolsag-picker">
      <label className="picker-label">Távolság (méter)</label>
      <div className="picker-controls">
        <button className="fort-fok-btn picker-btn-lg" onClick={() => step(-1)} {...holdProps(-1)}>−</button>
        <strong className="picker-value-lg">{val}m</strong>
        <button className="fort-fok-btn picker-btn-lg" onClick={() => step(1)} {...holdProps(1)}>+</button>
      </div>
      <span className="picker-hint">(cella: {cellaVal})</span>
    </div>
  );
}
