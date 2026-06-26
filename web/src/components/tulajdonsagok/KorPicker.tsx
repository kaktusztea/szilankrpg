import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => { onSelect(value); }, [value]);
  useEffect(() => () => stopHold(), []);

  return (
    <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px', padding: '16px', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Életkor</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => setValue(v => Math.max(1, v - 1))}
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}>−</button>
        <strong style={{ fontSize: '28px', minWidth: '60px', textAlign: 'center', userSelect: 'none' }}>{value}</strong>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => setValue(v => Math.min(2000, v + 1))}
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}>+</button>
      </div>
    </div>
  );
}
