import { useState, useRef, useCallback } from 'react';

export type HintType = 'warning' | 'info';

export function useHint(defaultDuration = 3000) {
  const [hint, setHint] = useState('');
  const [hintType, setHintType] = useState<HintType>('warning');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHint = useCallback((msg: string, type: HintType = 'warning', duration?: number) => {
    setHint(msg);
    setHintType(type);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(''), duration ?? defaultDuration);
  }, [defaultDuration]);

  return { hint, hintType, showHint };
}
