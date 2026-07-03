import { useState, useCallback, useEffect } from 'react';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';
import { MAX_KOR } from '../../ui-constants';

interface Props {
  kor: number;
  onSelect: (v: number) => void;
}

export function KorPicker({ kor, onSelect }: Props) {
  const [value, setValue] = useState(kor || 25);

  const step = useCallback((dir: 1 | -1, amount?: number) => {
    setValue(v => Math.max(1, Math.min(MAX_KOR, v + dir * (amount ?? 1))));
  }, []);

  const getStep = useCallback((elapsed: number) => elapsed > 4000 ? 10 : 1, []);

  const { holdProps } = useHoldRepeat(step, { initialDelay: 200, minDelay: 30, factor: 0.82, getStep });

  useEffect(() => { onSelect(value); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="kep-prompt kor-picker">
      <label className="kor-picker-label">Életkor</label>
      <div className="picker-controls">
        <button className="fort-fok-btn picker-btn-lg"
          onClick={() => step(-1)} {...holdProps(-1)}>−</button>
        <strong className="picker-value-lg">{value}</strong>
        <button className="fort-fok-btn picker-btn-lg"
          onClick={() => step(1)} {...holdProps(1)}>+</button>
      </div>
    </div>
  );
}
