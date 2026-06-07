import { useState, useEffect, useRef, TouchEvent, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { HarcScreen } from './components/HarcScreen';
import { TulajdonsagokScreen } from './components/TulajdonsagokScreen';
import { FortelyokScreen } from './components/FortelyokScreen';
import { evaluate, buildContext, buildArrayContext } from './engine/reactive';
import type { Karakter, Session, Fortely } from './engine/types';
import { DEFAULT_SESSION } from './engine/types';
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

/** Validate minimal schema compliance */
function validateKarakter(obj: unknown): obj is Karakter {
  if (!obj || typeof obj !== 'object') return false;
  const k = obj as Record<string, unknown>;
  return (
    k.schema_version === 2 &&
    typeof k.név === 'string' &&
    typeof k.tsz === 'number' &&
    typeof k.tulajdonságok === 'object' &&
    Array.isArray(k.képzettségek) &&
    Array.isArray(k.fortélyok) &&
    typeof k.fortélyok_speciális === 'object' &&
    typeof k.hátterek === 'object' &&
    Array.isArray(k.fegyverek) &&
    typeof k.páncél === 'object'
  );
}

/** Validate referential integrity against loaded tables. Returns error message or null. */
function validateKarakterData(k: Karakter, data: GameData): string | null {
  const errors: string[] = [];

  // Faj
  if (k.hátterek.faj && !data.fajNevek.includes(k.hátterek.faj)) {
    errors.push(`Ismeretlen faj: "${k.hátterek.faj}"`);
  }

  // Fortélyok
  const fortelyNevek = new Set(data.fortelySummaries.map(d => d.név));
  for (const f of k.fortélyok) {
    if (!fortelyNevek.has(f.név)) {
      errors.push(`Ismeretlen fortély: "${f.név}"`);
    }
  }

  // Képzettségek (including többszörös alnevek)
  const validKepNames = new Set(data.kepzettsegDefs.map(d => d.név));
  for (const d of data.kepzettsegDefs) {
    if (d.többszörös) for (const alnév of d.többszörös) validKepNames.add(alnév);
  }
  for (const kep of k.képzettségek) {
    if (!validKepNames.has(kep.név)) {
      errors.push(`Ismeretlen képzettség: "${kep.név}"`);
    }
  }

  // Páncél enum értékek
  const validKidolgozottság = new Set(Object.keys(data.konstansok.páncél_csatolt_tag_mgt.merevvért_fém));
  const validMéret = new Set(['passzoló', 'közepesen_más', 'nagyon_más']);
  const validAnyag = new Set(['', ...data.konstansok.páncél_fémalapanyagok.map(a => a.anyag)]);
  const validStruktúra = new Set(['', ...data.konstansok.páncél_struktúrák.map(s => s.struktúra)]);

  if (k.páncél.alap && !validStruktúra.has(k.páncél.alap)) {
    errors.push(`Ismeretlen páncél struktúra: "${k.páncél.alap}"`);
  }
  if (k.páncél.kidolgozottság && !validKidolgozottság.has(k.páncél.kidolgozottság)) {
    errors.push(`Ismeretlen kidolgozottság: "${k.páncél.kidolgozottság}"`);
  }
  if (k.páncél.méret_illeszkedés && !validMéret.has(k.páncél.méret_illeszkedés)) {
    errors.push(`Ismeretlen méret_illeszkedés: "${k.páncél.méret_illeszkedés}"`);
  }
  if (k.páncél.fémalapanyag && !validAnyag.has(k.páncél.fémalapanyag)) {
    errors.push(`Ismeretlen fémalapanyag: "${k.páncél.fémalapanyag}"`);
  }

  // Fegyverek anyag
  const validFegyverAnyag = new Set(['acél', 'bronz', 'abbitacél', 'mithrill', 'lunír']);
  for (const f of k.fegyverek) {
    if (f.anyag && !validFegyverAnyag.has(f.anyag)) {
      errors.push(`Ismeretlen fegyver anyag: "${f.anyag}"`);
    }
    if (f.alap) {
      const found = data.fegyverek.some(fd => fd.Fegyver.toLowerCase() === f.alap.toLowerCase());
      if (!found) errors.push(`Ismeretlen fegyver alaptípus: "${f.alap}"`);
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}

function App() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(2);
  const [gameMode, setGameMode] = useState(false);

  // --- Karakter state (egyben mentendő) ---
  const [karakter, setKarakter] = useState<Karakter | null>(null);

  useEffect(() => {
    loadGameData().then(d => {
      setData(d);
      if (!validateKarakter(d.emptyKarakter)) {
        setError('Az empty_karakter.json érvénytelen (schema_version !== 2 vagy hiányzó mezők). Ellenőrizd a data/empty_karakter.json fájlt.');
        return;
      }
      const refErr = validateKarakterData(d.emptyKarakter, d);
      if (refErr) {
        setError(`empty_karakter.json referencia hiba: ${refErr}`);
        return;
      }
      setKarakter(d.emptyKarakter);
    }).catch(e => setError(`Betöltési hiba: ${String(e)}`));
  }, []);

  const setTulajdonságok = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, tulajdonságok: typeof val === 'function' ? val(prev.tulajdonságok) : val } : prev);
  }, []);

  const setKépzettségek = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, képzettségek: typeof val === 'function' ? val(prev.képzettségek) : val } : prev);
  }, []);

  const setFortélyok = useCallback((val: any) => {
    setKarakter(prev => prev ? { ...prev, fortélyok: typeof val === 'function' ? val(prev.fortélyok) : val } : prev);
  }, []);

  const setSession = useCallback((val: Session | ((prev: Session) => Session)) => {
    setKarakter(prev => prev ? { ...prev, session: typeof val === 'function' ? val(prev.session) : val } : prev);
  }, []);

  // --- Touch / swipe ---
  const touchStart = useRef<number>(0);
  const touchY = useRef<number>(0);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showTestConfirm, setShowTestConfirm] = useState(false);

  useEffect(() => {
    if (!showNewConfirm && !showTestConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowNewConfirm(false); setShowTestConfirm(false); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showNewConfirm, showTestConfirm]);

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (el.classList.contains('kep-prompt-overlay')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
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

  // --- Save / Load ---
  function saveKarakter() {
    if (!karakter) return;
    const json = JSON.stringify(karakter, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${karakter.név || 'karakter'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadKarakter() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result as string);
          if (!validateKarakter(obj)) {
            alert('Érvénytelen karakter fájl (schema_version !== 2 vagy hiányzó mezők).');
            return;
          }
          const refErr = validateKarakterData(obj, data!);
          if (refErr) {
            alert(`Referencia hiba: ${refErr}`);
            return;
          }
          // Ensure session exists (backward compat)
          if (!obj.session) obj.session = { ...DEFAULT_SESSION };
          setKarakter(obj);
        } catch {
          alert('Nem sikerült betölteni a fájlt.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data || !karakter) return <div className="loading">Betöltés...</div>;

  const { tulajdonságok, képzettségek, fortélyok, session } = karakter;

  return (
    <div className="app" onContextMenu={e => e.preventDefault()} onSelect={e => e.preventDefault()}>
      <header className="header">
        <span className="title">Szilánk RPG</span>
        <div className="header-btns">
          <button className="test-btn" onClick={() => setShowTestConfirm(true)} title="Teszt karakter betöltése">🧪</button>
          <button className="new-btn" onClick={() => setShowNewConfirm(true)} title="Új karakter">📄</button>
          <button className="save-btn" onClick={saveKarakter} title="Mentés">💾</button>
          <button className="load-btn" onClick={loadKarakter} title="Betöltés">📂</button>
          <button
            className="mode-toggle"
            style={{ background: gameMode ? '#4caf50' : '#ff9800', color: '#000' }}
            onClick={() => setGameMode(!gameMode)}
          >
            {gameMode ? '🎮 Game' : '🔧 Szerk'}
          </button>
        </div>
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
                <TabContent
                  tab={tab.id} data={data} gameMode={gameMode} setActiveTab={setActiveTab}
                  tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok}
                  képzettségek={képzettségek} setKépzettségek={setKépzettségek}
                  fortélyok={fortélyok} setFortélyok={setFortélyok}
                  session={session} setSession={setSession}
                  karakter={karakter} setKarakter={setKarakter}
                />
              )}
            </div>
          ))}
        </div>
      </main>

      {!gameMode && data && (() => {
        const spec = karakter.fortélyok_speciális;
        const bónusz = data.konstansok.kp_bónusz;
        let spec_kp = 0;
        if (spec.analfabéta) spec_kp += bónusz.analfabéta;
        if (spec.apró_méretű_lény) spec_kp += bónusz.apró_méretű_lény;
        if (spec.süketség) spec_kp += bónusz.süketség;
        if (spec.vakság) spec_kp += bónusz.vakság;
        spec_kp += spec.tartós_sérülés_fok * bónusz.tartós_sérülés_per_fok;

        const tsz = karakter.tsz;
        let kiemelt_kp = 0;
        for (const d of data.fortelySummaries) {
          if (d.ingyenes_perszint <= 0) continue;
          const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
          const felvettDb = fortélyok.filter(f => f.név === d.név).reduce((s, f) => s + f.fok, 0);
          const fizetősDb = Math.max(0, felvettDb - ingyenesDb);
          kiemelt_kp += fizetősDb * d.kp_perfok;
        }

        const kpCtx = buildContext(tulajdonságok, tsz, data.konstansok as any, {
          spec_kp,
          kiemelt_kp,
          HM_TÉ: karakter.HM_TÉ,
          HM_VÉ: karakter.HM_VÉ,
          CM: karakter.CM,
          fortélyMod_KÉ: 0,
          harcmodor_összeg: 0,
          felszerelés_terhelés: 0,
        });
        const fortelyKpMap = new Map(data.fortelySummaries.map(d => [d.név, d.ingyenes_perszint > 0 ? 0 : d.kp_perfok]));
        const arrays = buildArrayContext(képzettségek, fortélyok, data.kepzettsegKp, fortelyKpMap);
        const kpComputed = evaluate(data.rules, kpCtx, arrays);

        const maradékKp = kpComputed.get('maradék_kp') ?? 0;
        const maradékSzekunder = Math.max(0, (kpComputed.get('összes_szekunder_kp') ?? 0) - (kpComputed.get('kp_képzettségek') ?? 0));
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

      {showNewConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>Új karakter?</label>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Az aktuális állapot elvész.</span>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { setKarakter(data.emptyKarakter); setShowNewConfirm(false); }}>Új karakter</button>
          </div>
        </div>,
        document.body
      )}

      {showTestConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>Teszt karakter betöltése?</label>
            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Az aktuális állapot elvész.</span>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { setKarakter(testKarakter8); setShowTestConfirm(false); }}>Betöltés</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function TabContent({ tab, data, gameMode, setActiveTab, tulajdonságok, setTulajdonságok, képzettségek, setKépzettségek, fortélyok, setFortélyok, session, setSession, karakter, setKarakter }: {
  tab: string; data: GameData; gameMode: boolean; setActiveTab: (i: number) => void;
  tulajdonságok: any; setTulajdonságok: any;
  képzettségek: { név: string; szint: number }[]; setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  fortélyok: Fortely[]; setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  session: Session; setSession: React.Dispatch<React.SetStateAction<Session>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
}) {
  switch (tab) {
    case 'aktiv': return <div className="screen"><h2>❎ Aktív</h2><p>Szituáció beállítás (TODO)</p></div>;
    case 'harc': return <HarcScreen data={data} karakter={karakter} session={session} setSession={setSession} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tulajdonsagok': return <TulajdonsagokScreen data={data} gameMode={gameMode} tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok} képzettségek={képzettségek} setKépzettségek={setKépzettségek} név={karakter.név} setNév={v => setKarakter(prev => prev ? { ...prev, név: v } : prev)} tsz={karakter.tsz} setTsz={v => setKarakter(prev => prev ? { ...prev, tsz: v } : prev)} kor={karakter.kor} setKor={v => setKarakter(prev => prev ? { ...prev, kor: v } : prev)} faj={karakter.hátterek.faj} setFaj={v => setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, faj: v } } : prev)} />;
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
