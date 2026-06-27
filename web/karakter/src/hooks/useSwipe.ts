import { useRef, type TouchEvent } from 'react';

export function useSwipe(activeTab: number, tabCount: number, setActiveTab: (i: number) => void) {
  const touchStart = useRef(0);
  const touchY = useRef(0);

  function handleTouchStart(e: TouchEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.kep-prompt-overlay')) { touchStart.current = 0; touchY.current = 0; return; }
    touchStart.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (!touchStart.current && !touchY.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && activeTab < tabCount - 1) setActiveTab(activeTab + 1);
      if (dx < 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  }

  return { handleTouchStart, handleTouchEnd };
}
