import { useRef, useEffect } from 'react';

export interface TabDef { id: string; label: string; editOnly: boolean; }

interface Props {
  tabs: TabDef[];
  activeTab: number;
  setActiveTab: (i: number) => void;
}

export function TabBar({ tabs, activeTab, setActiveTab }: Props) {
  const tabBarRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeTabBtnRef = useRef<HTMLButtonElement | null>(null);
  const indicatorInit = useRef(false);

  useEffect(() => {
    const ind = indicatorRef.current;
    const btn = activeTabBtnRef.current;
    if (!ind || !btn) return;
    const size = ind.offsetHeight || btn.offsetHeight;
    const centerX = btn.offsetLeft + btn.offsetWidth / 2;
    ind.style.transform = `translateX(${centerX - size / 2}px)`;
    if (!indicatorInit.current) {
      requestAnimationFrame(() => {
        if (ind) ind.style.transition = 'transform 0.2s ease-out';
        indicatorInit.current = true;
      });
    }
  });

  return (
    <nav className="tab-bar" ref={tabBarRef} style={{ '--tab-count': tabs.length } as React.CSSProperties}>
      <div className="tab-indicator" ref={indicatorRef} />
      {[...tabs].reverse().map((tab) => {
        const i = tabs.indexOf(tab);
        return (
          <button
            key={tab.id}
            ref={activeTab === i ? activeTabBtnRef : undefined}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
