import { useState, useRef } from 'react';

export function useVersionHint() {
  const [versionHint, setVersionHint] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  function handleTitleTap() {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      lastTap.current = 0;
      setVersionHint(`Szilánk RPG build: ${__APP_VERSION__}`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVersionHint(''), 5000);
    } else {
      lastTap.current = now;
    }
  }

  return { versionHint, handleTitleTap };
}
