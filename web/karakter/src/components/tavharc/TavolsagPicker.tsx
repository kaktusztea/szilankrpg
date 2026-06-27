import { useState, useRef } from 'react';

export function TávolságPicker({ value, osztó, onChange }: {
  value: number; osztó: number; onChange: (v: number) => void;
}) {
  const [val, setVal] = useState(value);
  const holdRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });
  const cellaVal = Math.ceil(val / osztó);

  function startHold(dir: 1 | -1) {
    holdRef.current.active = true;
    let delay = 200;
    function tick() {
      if (!holdRef.current.active) return;
      setVal(v => { const nv = Math.max(1, Math.min(500, v + dir)); onChange(nv); return nv; });
      delay = Math.max(50, delay * 0.85);
      holdRef.current.timer = setTimeout(tick, delay);
    }
    holdRef.current.timer = setTimeout(tick, delay);
  }

  function stopHold() {
    holdRef.current.active = false;
    if (holdRef.current.timer) { clearTimeout(holdRef.current.timer); holdRef.current.timer = null; }
  }

  return (
    <div className="kep-prompt picker-wrapper">
      <label className="picker-label">Távolság (méter)</label>
      <div className="picker-controls">
        <button className="fort-fok-btn picker-btn-lg"
          onClick={() => { setVal(v => { const nv = Math.max(1, v - 1); onChange(nv); return nv; }); }}
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}>−</button>
        <strong className="picker-value-lg">{val}m</strong>
        <button className="fort-fok-btn picker-btn-lg"
          onClick={() => { setVal(v => { const nv = Math.min(500, v + 1); onChange(nv); return nv; }); }}
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}>+</button>
      </div>
      <span className="picker-hint">(cella: {cellaVal})</span>
    </div>
  );
}
