import { useState, useRef, useCallback } from 'react';

export function useHint(duration = 3000) {
  const [hint, setHint] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHint = useCallback((msg: string) => {
    setHint(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(''), duration);
  }, [duration]);

  return { hint, showHint };
}
