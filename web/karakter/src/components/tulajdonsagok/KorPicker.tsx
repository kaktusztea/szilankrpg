import { useState, useRef, useEffect } from 'react';

interface Props {
  kor: number;
  onSelect: (v: number) => void;
}

export function KorPicker({ kor, onSelect }: Props) {
  const [value, setValue] = useState(kor || 25);
  const holdRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });

  function startHold(dir: 1 | -1) {
    holdRef.current.active = true;
    let delay = 200;
    const startTime = Date.now();
    function tick() {
      if (!holdRef.current.active) return;
      const elapsed = Date.now() - startTime;
      const step = elapsed > 4000 ? 10 : 1;
      setValue(v => Math.max(1, Math.min(2000, v + dir * step)));
      delay = Math.max(30, delay * 0.82);
      holdRef.current.timer = setTimeout(tick, delay);
    }
    holdRef.current.timer = setTimeout(tick, delay);
  }

  function stopHold() {
    holdRef.current.active = false;
    if (holdRef.current.timer) { clearTimeout(holdRef.current.timer); holdRef.current.timer = null; }
  }

  useEffect(() => { onSelect(value); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopHold(), []);

  return (
    <div className="kep-prompt kor-picker">
      <label className="kor-picker-label">Életkor</label>
      <div className="kor-picker-controls">
        <button className="fort-fok-btn kor-picker-btn"
          onClick={() => setValue(v => Math.max(1, v - 1))}
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={e => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}>−</button>
        <strong className="kor-picker-value">{value}</strong>
        <button className="fort-fok-btn kor-picker-btn"
          onClick={() => setValue(v => Math.min(2000, v + 1))}
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={e => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}>+</button>
      </div>
    </div>
  );
}
