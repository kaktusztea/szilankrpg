import { useState, useCallback } from 'react';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { MAX_TÁVOLSÁG_MÉTER } from '../../ui-constants';

export function TávolságPicker({ távolság, osztó, onChange }: {
  távolság: number; osztó: number; onChange: (v: number) => void;
}) {
  const [méter, setMéter] = useState(távolság);
  const cellaVal = Math.ceil(méter / osztó);

  const step = useCallback((dir: 1 | -1) => {
    setMéter(v => { const nv = Math.max(1, Math.min(MAX_TÁVOLSÁG_MÉTER, v + dir)); onChange(nv); return nv; });
  }, [onChange]);

  const { holdProps } = useHoldRepeat(step);

  return (
    <div className="th-tavolsag-picker">
      <label className="picker-label">Távolság (méter)</label>
      <div className="picker-controls">
        <button className="fort-fok-btn picker-btn-lg" onClick={() => step(-1)} {...holdProps(-1)}>−</button>
        <strong className="picker-value-lg">{méter}m</strong>
        <button className="fort-fok-btn picker-btn-lg" onClick={() => step(1)} {...holdProps(1)}>+</button>
      </div>
      <span className="picker-hint">(cella: {cellaVal})</span>
    </div>
  );
}
