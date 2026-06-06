import { useState, useEffect, useRef, TouchEvent } from 'react';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { HarcScreen } from './components/HarcScreen';
import { TulajdonsagokScreen } from './components/TulajdonsagokScreen';
import { FortelyokScreen } from './components/FortelyokScreen';
import { calcKp } from './engine/kp';
import { testKarakter8 } from './testdata';
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
  const [activeTab, setActiveTab] = useState(2);
  const [gameMode, setGameMode] = useState(false);
  const [képzettségek, setKépzettségek] = useState(testKarakter8.képzettségek.map(k => ({ név: k.név, szint: k.szint })));
  const [fortélyok, setFortélyok] = useState(() => [
    ...testKarakter8.fortélyok.map(f => ({ név: f.név, fok: f.fok })),
    ...testKarakter8.fortélyok_kiemelt.kulturkörök.map(k => ({ név: `Kultúrkör - ${k.név}`, fok: 1 })),
    ...testKarakter8.fortélyok_kiemelt.helyismeret.map(h => ({ név: `Helyismeret - ${h.helynév}`, fok: 1 })),
  ]);
  const touchStart = useRef<number>(0);
  const touchY = useRef<number>(0);

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);

  useEffect(() => {
    loadGameData().then(setData).catch(e => setError(String(e)));
  }, []);

  // Prevent iOS text selection on long-press for interactive elements
  useEffect(() => {
    function handler(e: Event) {
      const el = e.target as HTMLElement;
      if (el.tagName === 'SELECT' || el.tagName === 'OPTION' || el.closest('.kep-row-new, .fort-row-new')) return;
      if (el.closest('.tul-cell, .kep-row, .fort-row, .tul-header-box, .tul-faj-row')) {
        e.preventDefault();
      }
    }
    document.addEventListener('touchstart', handler, { passive: false });
    return () => document.removeEventListener('touchstart', handler);
  }, []);

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
      if (dx < 0 && activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
      if (dx > 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  }

  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data) return <div className="loading">Betöltés...</div>;

  return (
    <div className="app" onContextMenu={e => e.preventDefault()} onSelect={e => e.preventDefault()}>
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
                <TabContent tab={tab.id} data={data} gameMode={gameMode} setActiveTab={setActiveTab} képzettségek={képzettségek} setKépzettségek={setKépzettségek} fortélyok={fortélyok} setFortélyok={setFortélyok} />
              )}
            </div>
          ))}
        </div>
      </main>

      {!gameMode && data && (() => {
        const primerKepz = new Set<string>();
        const primerPrefixes: string[] = [];
        for (const d of data.kepzettsegDefs) {
          if (!d.primer) continue;
          if (d.többszörös.length > 0) {
            if (d.többszörös[0] === '*') {
              primerPrefixes.push(d.név + ':');
            } else {
              for (const sub of d.többszörös) primerKepz.add(sub);
            }
          } else {
            primerKepz.add(d.név);
          }
        }
        // Add actual slot names that match free-text primer prefixes
        for (const k of képzettségek) {
          if (primerPrefixes.some(p => k.név.startsWith(p))) primerKepz.add(k.név);
        }
        const primerFortGroups = new Set(data.primerFortelyok);
        const fortelyKpMap = new Map(data.fortelySummaries.map(d => [d.név, d.ingyenes_perszint > 0 ? 0 : d.kp_perfok]));
        const karakter = { ...testKarakter8, képzettségek: képzettségek.map(k => ({ ...k, spec: '' })), fortélyok: fortélyok.map(f => ({ ...f, spec: '' })) };
        const kpResult = calcKp(karakter, data.konstansok.kp, data.konstansok.kp_bónusz, data.kepzettsegKp, primerKepz, primerFortGroups, fortelyKpMap);

        // Kiemelt fortélyok KP költése (Kultúrkör, Helyismeret): ingyenesek feletti példányok
        const tsz = testKarakter8.tsz;
        let kiemeltKp = 0;
        for (const d of data.fortelySummaries) {
          if (d.ingyenes_perszint <= 0) continue;
          const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
          const felvettDb = fortélyok.filter(f => f.név === d.név || f.név.startsWith(d.név + ' - ')).reduce((s, f) => s + f.fok, 0);
          const fizetősDb = Math.max(0, felvettDb - ingyenesDb);
          kiemeltKp += fizetősDb * d.kp_perfok;
        }

        const maradékKp = kpResult.maradék_kp - kiemeltKp;
        const maradékSzekunder = Math.max(0, kpResult.összes_szekunder_kp - kpResult.kp_szekunder_költött);
        const isNeg = maradékKp < 0;
        return (
          <div className={`kp-bar ${isNeg ? 'kp-bar-neg' : ''}`}>
            <span>Maradt KP: {maradékKp}</span>
            <span>Maradt Szekunder KP: {maradékSzekunder}</span>
          </div>
        );
      })()}

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

function TabContent({ tab, data, gameMode, setActiveTab, képzettségek, setKépzettségek, fortélyok, setFortélyok }: { tab: string; data: GameData; gameMode: boolean; setActiveTab: (i: number) => void; képzettségek: { név: string; szint: number }[]; setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>; fortélyok: { név: string; fok: number }[]; setFortélyok: React.Dispatch<React.SetStateAction<{ név: string; fok: number }[]>> }) {
  switch (tab) {
    case 'aktiv': return <div className="screen"><h2>❎ Aktív</h2><p>Szituáció beállítás (TODO)</p></div>;
    case 'harc': return <HarcScreen data={data} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tulajdonsagok': return <TulajdonsagokScreen data={data} gameMode={gameMode} képzettségek={képzettségek} setKépzettségek={setKépzettségek} />;
    case 'fortelyok': return <FortelyokScreen data={data} gameMode={gameMode} fortélyok={fortélyok} setFortélyok={setFortélyok} />;
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
