import { useState, useEffect, useRef, TouchEvent } from 'react';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { HarcScreen } from './components/HarcScreen';
import { TulajdonsagokScreen } from './components/TulajdonsagokScreen';
import './App.css';

const ALL_TABS = [
  { id: 'aktiv', label: '❎ Aktív', editOnly: false },
  { id: 'harc', label: '🗡️ Harc', editOnly: false },
  { id: 'tulajdonsagok', label: '🔵 Tul/Képz', editOnly: false },
  { id: 'fortelyok', label: '🟣 Fortélyok', editOnly: false },
  { id: 'misztikus', label: '✨ Misztikus', editOnly: false },
  { id: 'harcertekek', label: '🛡️ Harcértékek', editOnly: true },
  { id: 'hatterek', label: '📜 Hátterek', editOnly: false },
  { id: 'taktikak', label: '🎯 Taktikák', editOnly: false },
  { id: 'helyzetek', label: '🎯 Helyzetek', editOnly: false },
  { id: 'manoverek', label: '🎯 Manőverek', editOnly: false },
];

function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [gameMode, setGameMode] = useState(false);
  const touchStart = useRef<number>(0);
  const touchY = useRef<number>(0);

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);

  useEffect(() => {
    loadGameData().then(setData).catch(e => setError(String(e)));
  }, []);

  function handleTouchStart(e: TouchEvent) {
    touchStart.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
      if (dx > 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  }

  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data) return <div className="loading">Betöltés...</div>;

  return (
    <div className="app">
      <header className="header">
        <span className="title">Szilánk RPG</span>
        <button
          className="mode-toggle"
          style={{ background: gameMode ? '#4caf50' : '#ff9800', color: '#000' }}
          onClick={() => setGameMode(!gameMode)}
        >
          {gameMode ? '🎮 Game mód' : '🔧 Szerkesztés'}
        </button>
      </header>

      <main
        className="content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="screen-slider" style={{ transform: `translateX(-${activeTab * 100}%)` }}>
          {TABS.map((tab, i) => (
            <div key={tab.id} className="screen-slide">
              {Math.abs(i - activeTab) <= 1 && (
                <TabContent tab={tab.id} data={data} gameMode={gameMode} setActiveTab={setActiveTab} />
              )}
            </div>
          ))}
        </div>
      </main>

      <nav className="tab-bar" onWheel={e => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function TabContent({ tab, data, gameMode, setActiveTab }: { tab: string; data: GameData; gameMode: boolean; setActiveTab: (i: number) => void }) {
  switch (tab) {
    case 'aktiv': return <div className="screen"><h2>❎ Aktív</h2><p>Szituáció beállítás (TODO)</p></div>;
    case 'harc': return <HarcScreen data={data} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tulajdonsagok': return <TulajdonsagokScreen data={data} gameMode={gameMode} />;
    case 'fortelyok': return <div className="screen"><h2>🟣 Fortélyok</h2><p>{gameMode ? 'Read-only mód' : 'Szerkesztő mód'}</p></div>;
    case 'misztikus': return <div className="screen"><h2>✨ Misztikus</h2></div>;
    case 'harcertekek': return <div className="screen"><h2>🛡️ Harcértékek</h2><p>HM/CM, Harcmodor bónuszok, Fegyverek, Páncél beállítás (TODO)</p></div>;
    case 'hatterek': return <div className="screen"><h2>📜 Hátterek</h2></div>;
    case 'taktikak': return <div className="screen"><h2>🎯 Harci taktikák</h2></div>;
    case 'helyzetek': return <div className="screen"><h2>🎯 Harci helyzetek</h2></div>;
    case 'manoverek': return <div className="screen"><h2>🎯 Manőverek</h2></div>;
    default: return null;
  }
}

export default App;
