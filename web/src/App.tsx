import { useState, useEffect, useRef, TouchEvent, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { AktivScreen } from './components/AktivScreen';
import { HarcScreen } from './components/HarcScreen';
import { TulajdonsagokScreen } from './components/TulajdonsagokScreen';
import { FortelyokScreen } from './components/FortelyokScreen';
import { HarcertekekScreen } from './components/HarcertekekScreen';
import { evaluate, buildContext, buildArrayContext } from './engine/reactive';
import type { Karakter, Session, Fortely } from './engine/types';
import { DEFAULT_SESSION } from './engine/types';
import './App.css';

const ALL_TABS = [
  { id: 'harcertekek', label: '🛡️', editOnly: true },
  { id: 'aktiv', label: '❎', editOnly: false },
  { id: 'harc', label: '🗡️', editOnly: false },
  { id: 'tavharc', label: '🏹', editOnly: false },
  { id: 'misztikus', label: '✨', editOnly: false },
  { id: 'tulajdonsagok', label: '🔵', editOnly: false },
  { id: 'fortelyok', label: '🟣', editOnly: false },
  { id: 'hatterek', label: '🟡', editOnly: false },
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
    typeof k.páncél === 'object' &&
    Array.isArray(k.napló)
  );
}

/** Validate referential integrity against loaded tables. Returns error message or null. */
function validateKarakterData(k: Karakter, data: GameData): string | null {
  const errors: string[] = [];

  // Faj
  if (k.hátterek.faj && !data.fajNevek.includes(k.hátterek.faj)) {
    errors.push(`Ismeretlen faj: "${k.hátterek.faj}"`);
  }

  // Anyanyelv
  const nyelvNevek = new Set(data.nyelvek.map(n => n.név));
  if (k.anyanyelv && !nyelvNevek.has(k.anyanyelv)) {
    errors.push(`Ismeretlen anyanyelv: "${k.anyanyelv}"`);
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
  // Prefixes for special képzettségek (e.g. "Tradíció: ...", "Ősi nyelv ismerete: ...")
  const validKepPrefixes = data.kepzettsegDefs.filter(d => d.többszörös.length === 0 && d.csoport === 'misztikus').map(d => d.név + ': ');
  // Also free-text többszörös prefixes
  for (const d of data.kepzettsegDefs) {
    if (d.többszörös.length > 0 && d.többszörös[0] === '*') validKepPrefixes.push(d.név + ': ');
  }
  for (const kep of k.képzettségek) {
    if (!validKepNames.has(kep.név) && !validKepPrefixes.some(p => kep.név.startsWith(p))) {
      errors.push(`Ismeretlen képzettség: "${kep.név}"`);
    }
  }

  // Páncél enum értékek
  const validKidolgozottság = new Set(Object.keys(data.konstansok.páncél_csatolt_tag_mgt.merevvért_fém));
  const validMéret = new Set(['passzol', 'nem passzol', 'borzalmas']);
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
  const [activeTab, setActiveTab] = useState(5);
  const [gameMode, setGameMode] = useState(false);

  // --- Karakter state (egyben mentendő) ---
  const [karakter, setKarakter] = useState<Karakter | null>(null);

  useEffect(() => {
    loadGameData().then(d => {
      setData(d);
      if (!validateKarakter(d.emptyKarakter)) {
        setError('Az empty_karakter.json érvénytelen (schema_version !== 2 vagy hiányzó mezők). Ellenőrizd a data/karakter/empty_karakter.json fájlt.');
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
  const [showMenu, setShowMenu] = useState(false);
  const [showSzilánkPicker, setShowSzilánkPicker] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [versionHint, setVersionHint] = useState('');
  const [overlayScreen, setOverlayScreen] = useState<'jegyzetek' | 'naplo' | null>(null);
  const versionHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTitle = useRef(0);
  const tabBarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!showNewConfirm && !showTestConfirm && !showMenu && !loadError && !overlayScreen && !showFullscreenHint && !showSzilánkPicker) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowNewConfirm(false); setShowTestConfirm(false); setShowMenu(false); setLoadError(''); setOverlayScreen(null); setShowFullscreenHint(false); setShowSzilánkPicker(false); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showNewConfirm, showTestConfirm, showMenu, loadError, overlayScreen, showFullscreenHint, showSzilánkPicker]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveKarakter(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  function handleTitleTap() {
    const now = Date.now();
    if (now - lastTapTitle.current < 350) {
      lastTapTitle.current = 0;
      setVersionHint(`Szilánk RPG build: ${__APP_VERSION__}`);
      if (versionHintTimer.current) clearTimeout(versionHintTimer.current);
      versionHintTimer.current = setTimeout(() => setVersionHint(''), 5000);
    } else {
      lastTapTitle.current = now;
    }
  }

  const TABS = ALL_TABS.filter(t => !t.editOnly || !gameMode);

  // Korrekció: gameMode váltáskor az editOnly tab kiszűrése/visszakerülése miatt index eltolódik
  const prevGameMode = useRef(gameMode);
  useEffect(() => {
    if (prevGameMode.current !== gameMode) {
      const currentId = (prevGameMode.current ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS)[activeTab]?.id;
      const newTabs = gameMode ? ALL_TABS.filter(t => !t.editOnly) : ALL_TABS;
      const newIdx = newTabs.findIndex(t => t.id === currentId);
      if (newIdx >= 0 && newIdx !== activeTab) setActiveTab(newIdx);
      prevGameMode.current = gameMode;
    }
  }, [gameMode, activeTab]);

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
      if (dx > 0 && activeTab < TABS.length - 1) setActiveTab(activeTab + 1);
      if (dx < 0 && activeTab > 0) setActiveTab(activeTab - 1);
    }
  }

  // --- Save / Load ---
  function saveKarakter() {
    if (!karakter) return;
    const now = new Date();
    const dátum = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const saved = { ...karakter, mentés_dátum: dátum };
    const json = JSON.stringify(saved, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Filename: first name (max 20 char) + optional játékos first name, ascii lowercase, no spaces + _Xtsz.json
    const firstName = (karakter.név || 'karakter').split(' ')[0].slice(0, 20);
    const charAscii = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const playerFirst = karakter.játékos ? karakter.játékos.split(' ')[0].slice(0, 20) : '';
    const playerAscii = playerFirst.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const namePart = playerAscii ? `${charAscii || 'karakter'}_${playerAscii}` : (charAscii || 'karakter');
    a.download = `${namePart}_${karakter.tsz}tsz.json`;
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
            setLoadError('Érvénytelen karakter json állomány.');
            return;
          }
          const refErr = validateKarakterData(obj, data!);
          if (refErr) {
            setLoadError(`Referencia hiba: ${refErr}`);
            return;
          }
          setKarakter({ ...obj, session: { ...DEFAULT_SESSION, ...obj.session } });
        } catch {
          setLoadError('Nem sikerült betölteni a fájlt (hibás JSON).');
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
    <div className="app" onContextMenu={e => e.preventDefault()}>
      <header className="header">
        <span className="title" onClick={handleTitleTap}>Szilánk RPG</span>
        <span className="header-szilank" onClick={() => setShowSzilánkPicker(true)}>{session.szilánk}</span>
        <div className="header-btns">
                    <button className="gear-btn" onClick={() => setOverlayScreen('naplo')}>📅</button>
          <button className="gear-btn" onClick={() => setOverlayScreen('jegyzetek')}>✏️</button>
          <button className="gear-btn" onClick={() => setShowMenu(true)}>⚙️</button>
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
        <div className="screen-slider" style={{ transform: `translateX(-${(TABS.length - 1 - activeTab) * 100}%)` }}>
          {[...TABS].reverse().map((tab, vi) => {
            const i = TABS.length - 1 - vi;
            return (
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
            );
          })}
        </div>
      </main>

      {versionHint && <div className="version-hint" style={{ background: '#ff9800', color: '#000', textAlign: 'center', padding: '6px 12px', fontSize: '14px', fontWeight: 'bold', borderRadius: '4px', margin: '0 8px 4px' }}>{versionHint}</div>}

      {!gameMode && data && (() => {
        const spec = karakter.fortélyok_speciális;
        const tsz = karakter.tsz;

        const harcmodorÖsszeg = ['Közelharc', 'Kardvívás', 'Rombolás', 'Lándzsavívás', 'Ostorharc']
          .reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
        const alakzatharcSzint = képzettségek.find(k => k.név === 'Alakzatharc')?.szint ?? 0;

        const kpCtx = buildContext(tulajdonságok, tsz, data.konstansok as any, {
          spec_tartós_sérülés_fok: spec.tartós_sérülés_fok,
          HM_TÉ: karakter.HM_TÉ,
          HM_VÉ: karakter.HM_VÉ,
          CM: karakter.CM,
          harcmodor_összeg: harcmodorÖsszeg,
          alakzatharc_szint: alakzatharcSzint,
          felszerelés_terhelés: 0,
          páncél_van: 0,
          páncél_végtagvédettség: 0,
          páncél_sisak: 0,
          páncél_idea: 0,
          páncél_rongálódás: 0,
          merevvért_fok: 0,
        });

        const fortelyKpMap = new Map(data.fortelySummaries.map(d => [d.név, d.ingyenes_perszint > 0 ? 0 : d.kp_perfok]));
        const harciFortelyNevek = new Set(data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név));

        // Primer képzettség nevek
        const primerKepNevek = new Set(data.kepzettsegDefs.filter(d => d.primer).map(d => d.név));
        const harcmodorDef = data.kepzettsegDefs.find(d => d.név === 'Harcmodor');
        if (harcmodorDef?.többszörös) for (const a of harcmodorDef.többszörös) primerKepNevek.add(a);
        // Tradíció és egyéb prefix-alapú primer képzettségek: ha a karakter képzettség neve
        // "AlapNév: ..." formátumú és az alapnév primer, azt is primernek tekintjük
        for (const k of képzettségek) {
          const colonIdx = k.név.indexOf(':');
          if (colonIdx > 0) {
            const base = k.név.slice(0, colonIdx).trim();
            if (primerKepNevek.has(base)) primerKepNevek.add(k.név);
          }
        }

        // Ingyenes fortélyok (kiemelt_kp-hoz)
        const ingyenesFortelyok = data.fortelySummaries.filter(d => d.ingyenes_perszint > 0);

        const arrays = buildArrayContext(képzettségek, fortélyok, data.kepzettsegKp, fortelyKpMap, harciFortelyNevek, {
          tsz,
          ingyenesFortelyok,
          primerKepNevek,
          primerFortNevek: new Set(data.primerFortelyok),
          szabadFortelyNevek: new Set(data.fortelySummaries.filter(d => d.csoport === 'szabad').map(d => d.név)),
        });
        const kpComputed = evaluate(data.rules, kpCtx, arrays);

        const maradékKp = kpComputed.get('maradék_kp') ?? 0;
        const primerMaradt = kpComputed.get('primer_keret') ?? 0;
        const primerTúllépés = primerMaradt < 0;

        return (
          <div className="kp-bar">
            <span className={maradékKp < 0 ? 'kp-section-neg' : 'kp-section-ok'}>Maradt KP: {maradékKp}</span>
            <span className={primerTúllépés ? 'kp-section-neg' : 'kp-section-ok'}>Primer keret: {primerMaradt}</span>
          </div>
        );
      })()}

      <nav className="tab-bar" ref={tabBarRef} style={{ '--tab-count': TABS.length } as React.CSSProperties}>
        {[...TABS].reverse().map((tab, _i) => {
          const i = TABS.indexOf(tab);
          return (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
          );
        })}
      </nav>

      {showMenu && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'stretch', gap: '6px', minWidth: '200px' }}>
            <button className="menu-item" onClick={() => { setShowMenu(false); loadKarakter(); }}>📂 Karakter betöltése</button>
            <button className="menu-item" onClick={() => { setShowMenu(false); saveKarakter(); }}>💾 Karakter mentése</button>
            <button className="menu-item" onClick={() => { setShowMenu(false); setShowNewConfirm(true); }}>📄 Új karakter</button>
            <button className="menu-item" onClick={() => { setShowMenu(false); setShowTestConfirm(true); }}>🧪 Teszt karakter</button>
            {document.fullscreenEnabled && (
              <button className="menu-item" onClick={() => { setShowMenu(false); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }}>
                {document.fullscreenElement ? '⛶ Kilépés teljes képernyőből' : '⛶ Teljes képernyő'}
              </button>
            )}
            {!document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches && (
              <button className="menu-item" onClick={() => { setShowMenu(false); setShowFullscreenHint(true); }}>⛶ Teljes képernyő</button>
            )}
          </div>
        </div>,
        document.body
      )}

      {showSzilánkPicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>Szilánk</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[0, 1, 2, 3].map(v => (
                <button key={v} className={`fort-fok-btn ${session.szilánk === v ? 'active' : ''}`} onClick={() => { setSession(s => ({ ...s, szilánk: v })); setShowSzilánkPicker(false); }}>{v}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

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
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => {
              const refErr = validateKarakterData(data.testKarakter, data);
              if (refErr) { setShowTestConfirm(false); setLoadError(`Teszt karakter hiba: ${refErr}`); return; }
              setKarakter({ ...data.testKarakter, session: { ...DEFAULT_SESSION, ...data.testKarakter.session } }); setShowTestConfirm(false);
            }}>Betöltés</button>
          </div>
        </div>,
        document.body
      )}

      {loadError && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px', maxWidth: '320px' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--error)' }}>Betöltési hiba</label>
            <span style={{ fontSize: '13px', color: 'var(--text)', textAlign: 'center' }}>{loadError}</span>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => setLoadError('')}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {showFullscreenHint && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px', maxWidth: '320px' }}>
            <label style={{ fontWeight: 'bold' }}>Teljes képernyő</label>
            <span style={{ fontSize: '13px', color: 'var(--text)', textAlign: 'center' }}>
              {/iPad|iPhone|iPod/.test(navigator.userAgent)
                ? 'Megosztás ikon (⬆️) → Főképernyőhöz adás'
                : '⋮ menü → Telepítés / Hozzáadás a kezdőképernyőhöz'}
            </span>
            <button className="menu-item" style={{ padding: '6px 15px' }} onClick={() => setShowFullscreenHint(false)}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {overlayScreen && karakter && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setOverlayScreen(null); }}>
          <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)', zIndex: 101 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #333', background: 'var(--primary)' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '18px', cursor: 'pointer' }} onClick={() => setOverlayScreen(null)}>✕</button>
              <span style={{ marginLeft: '10px', fontWeight: 'bold', color: 'var(--text)' }}>{overlayScreen === 'jegyzetek' ? '✏️ Jegyzetek' : '📅 Napló'}</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {overlayScreen === 'jegyzetek' && (
                <textarea
                  style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 80px)', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid #555', borderRadius: '6px', padding: '10px', fontSize: '14px', resize: 'none', fontFamily: 'inherit' }}
                  value={karakter.jegyzetek}
                  onChange={e => setKarakter(prev => prev ? { ...prev, jegyzetek: e.target.value } : prev)}
                  placeholder="Szabad jegyzetek..."
                />
              )}
              {overlayScreen === 'naplo' && <NaploTab karakter={karakter} setKarakter={setKarakter} />}
            </div>
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
    case 'aktiv': return <AktivScreen data={data} karakter={karakter} session={session} setSession={setSession} />;
    case 'harc': return <HarcScreen data={data} karakter={karakter} session={session} setSession={setSession} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tavharc': return <div className="screen"><h2>🏹 Távharc</h2><p>Távharc kalkulátor (TODO)</p></div>;
    case 'tulajdonsagok': {
      const setAnyanyelv = (v: string) => setKarakter(prev => {
        if (!prev) return prev;
        const közös = 'Közös (pyarroni)';
        const filtered = prev.fortélyok.filter(f => !(f.név === 'Nyelvismeret' && f.kiérdemelt));
        const ingyenesek: Fortely[] = [
          { név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: közös, kiérdemelt: true },
        ];
        if (v && v !== közös) {
          ingyenesek.push({ név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: v, kiérdemelt: true });
        }
        return { ...prev, anyanyelv: v, fortélyok: [...ingyenesek, ...filtered] };
      });
      return <TulajdonsagokScreen data={data} gameMode={gameMode}
        tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok}
        képzettségek={képzettségek} setKépzettségek={setKépzettségek}
        név={karakter.név} setNév={v => setKarakter(prev => prev ? { ...prev, név: v } : prev)}
        játékos={karakter.játékos} setJátékos={v => setKarakter(prev => prev ? { ...prev, játékos: v } : prev)}
        tsz={karakter.tsz} setTsz={v => setKarakter(prev => prev ? { ...prev, tsz: v } : prev)}
        kor={karakter.kor} setKor={v => setKarakter(prev => prev ? { ...prev, kor: v } : prev)}
        faj={karakter.hátterek.faj} setFaj={v => setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, faj: v } } : prev)}
        anyanyelv={karakter.anyanyelv} setAnyanyelv={setAnyanyelv}
      />;
    }
    case 'fortelyok': {
      const fegyverNevek = karakter.fegyverek.map(f => {
        const fd = data.fegyverek.find(d => d.Fegyver.toLowerCase() === f.alap.toLowerCase());
        return fd?.Alapnév || f.alap;
      });
      const nyelvtanulásSzint = karakter.képzettségek.find(k => k.név === 'Nyelvtanulás')?.szint ?? 0;
      return <FortelyokScreen data={data} gameMode={gameMode}
        fortélyok={fortélyok} setFortélyok={setFortélyok}
        tsz={karakter.tsz} fegyverNevek={fegyverNevek} nyelvtanulásSzint={nyelvtanulásSzint}
      />;
    }
    case 'misztikus': return <div className="screen"><h2>✨ Misztikus</h2></div>;
    case 'harcertekek': return <HarcertekekScreen data={data} karakter={karakter} setKarakter={setKarakter} />;
    case 'hatterek': return <div className="screen"><h2>🟡 Hátterek</h2></div>;
    default: return null;
  }
}

function NaploTab({ karakter, setKarakter }: { karakter: Karakter; setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ dátum: '', km: '', kaland: '', események: '' });

  function addEntry() {
    if (!form.dátum && !form.kaland) return;
    setKarakter(prev => prev ? { ...prev, napló: [...prev.napló, { ...form }] } : prev);
    setForm({ dátum: '', km: '', kaland: '', események: '' });
    setAdding(false);
  }

  function saveEdit() {
    if (editIdx === null) return;
    setKarakter(prev => prev ? { ...prev, napló: prev.napló.map((e, i) => i === editIdx ? { ...form } : e) } : prev);
    setEditIdx(null);
    setOpenIdx(null);
  }

  function removeEntry(idx: number) {
    setKarakter(prev => prev ? { ...prev, napló: prev.napló.filter((_, i) => i !== idx) } : prev);
    setOpenIdx(null);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="screen" style={{ padding: '12px', minHeight: '100%' }} onClick={e => { if (editIdx !== null) return; if ((e.target as HTMLElement).closest('[data-naplo-entry]')) return; setOpenIdx(null); }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>📅 Napló</h2>
        <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '6px 12px', color: 'var(--text)', fontSize: '14px' }} onClick={() => { setAdding(true); setForm({ dátum: today, km: '', kaland: '', események: '' }); }}>+ Új bejegyzés</button>
      </div>

      {karakter.napló.length === 0 && !adding && <p style={{ color: 'var(--text-dim)' }}>Nincs bejegyzés.</p>}

      {karakter.napló.map((entry, i) => (
        <div key={i} style={{ marginBottom: '4px' }} data-naplo-entry>
          <div
            style={{ background: 'var(--surface)', border: '1px solid #444', borderRadius: '4px', padding: '8px 10px', cursor: 'pointer', fontSize: '15px' }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            [{entry.dátum}] {entry.km && `${entry.km}: `}{entry.kaland}
          </div>
          {openIdx === i && editIdx !== i && (
            <div style={{ background: '#1a1a3a', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '8px 10px', fontSize: '14px' }}>
              {entry.események && <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{entry.események}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 10px', color: 'var(--text)', fontSize: '13px' }} onClick={() => { setEditIdx(i); setForm({ ...entry }); }}>Szerkeszt</button>
                <button style={{ background: 'var(--error)', border: 'none', borderRadius: '4px', padding: '4px 10px', color: '#fff', fontSize: '13px' }} onClick={() => removeEntry(i)}>Törlés</button>
              </div>
            </div>
          )}
          {editIdx === i && (
            <div style={{ background: '#1a1a3a', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '14px' }} />
                <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '13px' }} onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
              </div>
              <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
              <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
              <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))} rows={4} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px 14px', color: '#000', fontWeight: 'bold', fontSize: '14px' }} onClick={saveEdit}>Mentés</button>
                <button style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 14px', color: 'var(--text)', fontSize: '14px' }} onClick={() => setEditIdx(null)}>Mégse</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && (
        <div style={{ background: 'var(--surface)', border: '1px solid #555', borderRadius: '6px', padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '14px' }} />
            <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '13px' }} onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
          </div>
          <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
          <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
          <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))} rows={4} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px 14px', color: '#000', fontWeight: 'bold', fontSize: '14px' }} onClick={addEntry}>Mentés</button>
            <button style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 14px', color: 'var(--text)', fontSize: '14px' }} onClick={() => setAdding(false)}>Mégse</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
