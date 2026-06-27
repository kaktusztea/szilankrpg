import { useEffect, useRef } from 'react';
import { ALL_TABS } from '../components/TabContent';

export function useGameModeTabSync(gameMode: boolean, activeTab: number, setActiveTab: (i: number) => void) {
  const prevGameMode = useRef(gameMode);

  useEffect(() => {
    if (prevGameMode.current !== gameMode) {
      const prevTabs = prevGameMode.current ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS;
      const currentId = prevTabs[activeTab]?.id;
      const newTabs = gameMode ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS;
      const newIdx = newTabs.findIndex(t => t.id === currentId);
      if (newIdx >= 0 && newIdx !== activeTab) setActiveTab(newIdx);
      prevGameMode.current = gameMode;
    }
  }, [gameMode, activeTab, setActiveTab]);
}
