import { useState, useEffect, useRef, useMemo, TouchEvent, useCallback, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { loadGameData } from './engine/data-loader';
import type { GameData } from './engine/data-loader';
import { AktivScreen } from './components/aktiv';
import { HarcScreen } from './components/harc';
import { TavharcScreen } from './components/tavharc';
import { TulajdonsagokScreen } from './components/tulajdonsagok';
import { FortelyokScreen } from './components/fortelyok';
import { HarcertekekScreen } from './components/harcertekek';
import { MisztikusScreen } from './components/misztikus';
import { HatterekScreen } from './components/hatterek';
import { AppOverlays } from './components/AppOverlays';
import type { OverlayState } from './components/AppOverlays';
import { evaluate, buildContext, buildArrayContext } from './engine/reactive';
import type { Karakter, Session, Fortely } from './engine/types';
import { DEFAULT_SESSION } from './engine/types';
import { describeKepChange } from './engine/undo-helpers';
import { lookupFegyver } from './engine/helpers';
import { validateKarakter, validateKarakterData } from './engine/validate';
import './App.css';
import { generateUid, generateIdLeíró, duplicateKarakter as dupKarakter, generateSaveFile, downloadFile, shareFile, loadKarakterFromFile } from './engine/file-ops';
import { encodeKarakterUrl, decodeKarakterFromHash } from './engine/url-share';

interface UndoEntry { timestamp: number; leírás: string; session: Session; karakter: Karakter; }

const ALL_TABS = [
  { id: 'aktiv', label: '✳️', editOnly: false },
  { id: 'harc', label: '🗡️', editOnly: false },
  { id: 'tavharc', label: '🏹', editOnly: false },
  { id: 'harcertekek', label: '🛡️', editOnly: false },
  { id: 'misztikus', label: '✨', editOnly: false },
  { id: 'tulajdonsagok', label: '🔵', editOnly: false },
  { id: 'fortelyok', label: '🟣', editOnly: false },
  { id: 'hatterek', label: '🟡', editOnly: false },
];

const INITIAL_OVERLAYS: OverlayState = {
  showMenu: false, showSzilánkPicker: false, showSlotList: false,
  slotDeleteTarget: null, showSavePopup: false, saveFile: null,
  loadError: '', showFullscreenHint: false, showNewConfirm: false,
  showUndo: false, undoSelected: null, overlayScreen: null,
  sharePopup: null, toast: null, importConfirm: null,
};

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
      const saved = localStorage.getItem('szilank_karakter');
      // Migráció: régi single-key → multi-slot
      if (saved && !localStorage.getItem('szilank_slots')) {
        try {
          const parsed = JSON.parse(saved);
          if (validateKarakter(parsed)) {
            const uid = parsed.uid || ((parsed as any).id) || generateUid();
            const migrated = { ...parsed, uid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } };
            localStorage.setItem(`szilank_char_${uid}`, JSON.stringify(migrated));
            localStorage.setItem('szilank_slots', JSON.stringify([{ uid, id_leíró: migrated.id_leíró, név: migrated.név, tsz: migrated.tsz, mentés_dátum: new Date().toISOString() }]));
            localStorage.setItem('szilank_active', uid);
            localStorage.removeItem('szilank_karakter');
            localStorage.removeItem('szilank_undo');
            setKarakter(migrated);
            setIsDirty(true);
            return;
          }
        } catch { /* fall through */ }
      }
      // Multi-slot betöltés
      const activeUid = localStorage.getItem('szilank_active');
      if (activeUid) {
        const charData = localStorage.getItem(`szilank_char_${activeUid}`);
        if (charData) {
          try {
            const parsed = JSON.parse(charData);
            if (validateKarakter(parsed)) {
              setKarakter({ ...parsed, uid: parsed.uid || activeUid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } });
              setIsDirty(true);
              return;
            }
          } catch { /* fall through */ }
        }
      }
      setKarakter({ ...d.emptyKarakter, uid: generateUid(), id_leíró: generateIdLeíró("", d.emptyKarakter.tsz) });
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


  // --- Undo Stack ---
  const UNDO_MAX = 6;
  const [undoStack, setUndoStack] = useState<UndoEntry[]>(() => {
    try {
      const activeUid = localStorage.getItem('szilank_active');
      if (activeUid) {
        const charData = localStorage.getItem(`szilank_char_${activeUid}`);
        if (charData) { const p = JSON.parse(charData); return p._undo || []; }
      }
      // Fallback: régi kulcs
      const s = localStorage.getItem('szilank_undo'); return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const karakterRef = useRef(karakter);
  karakterRef.current = karakter;

  const [testMode, setTestMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // --- Autosave localStorage (multi-slot) ---
  useEffect(() => {
    if (!karakter || testMode || !isDirty) return;
    // Üres/névtelen karakter nem mentődik (nincs értelme slot foglalásnak)
    if (!karakter.név && karakter.képzettségek.length === 0 && karakter.fortélyok.length === 0) return;
    const expectedLeíró = generateIdLeíró(karakter.név, karakter.tsz);
    if (karakter.id_leíró !== expectedLeíró) {
      setKarakter(prev => prev ? { ...prev, id_leíró: expectedLeíró } : prev);
      return;
    }
    const toSave = { ...karakter, _undo: undoStack } as Karakter & { _undo: unknown };
    try {
      localStorage.setItem(`szilank_char_${karakter.uid}`, JSON.stringify(toSave));
      localStorage.setItem('szilank_active', karakter.uid);
      let slots: { uid: string; id_leíró: string; név: string; tsz: number; mentés_dátum: string }[] = [];
      try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { slots = []; }
      const existing = slots.findIndex(s => s.uid === karakter.uid);
      const entry = { uid: karakter.uid, id_leíró: karakter.id_leíró, név: karakter.név, tsz: karakter.tsz, mentés_dátum: new Date().toISOString() };
      if (existing >= 0) slots[existing] = entry; else slots.unshift(entry);
      slots = slots.slice(0, 10);
      localStorage.setItem('szilank_slots', JSON.stringify(slots));
    } catch { /* quota exceeded — silent fail */ }
  }, [karakter, undoStack, isDirty, testMode]);

  function pushUndo(leírás: string) {
    const k = karakterRef.current;
    if (!k) return;
    if (testMode) setTestMode(false);
    if (!isDirty) setIsDirty(true);
    setUndoStack(prev => [
      { timestamp: Date.now(), leírás, session: structuredClone(k.session), karakter: structuredClone(k) },
      ...prev
    ].slice(0, UNDO_MAX));
  }

  function undoTo(index: number) {
    if (!karakter) return;
    const entry = undoStack[index];
    const restoredKarakter = { ...entry.karakter, jegyzetek: karakter.jegyzetek, napló: karakter.napló };
    setKarakter(restoredKarakter);
    setUndoStack(prev => prev.slice(index + 1));
    setOverlay('showUndo', false);
    setOverlay('undoSelected', null);
  }

  // --- Touch / swipe ---
  const touchStart = useRef<number>(0);
  const touchY = useRef<number>(0);
  const [overlays, setOverlays] = useState<OverlayState>(INITIAL_OVERLAYS);
  const setOverlay = useCallback(<K extends keyof OverlayState>(key: K, value: OverlayState[K]) => {
    setOverlays(prev => ({ ...prev, [key]: value }));
  }, []);
  const [versionHint, setVersionHint] = useState('');
  const versionHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTitle = useRef(0);
  const tabBarRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const anyOverlayOpen = overlays.showNewConfirm || overlays.showSlotList || overlays.showUndo || overlays.showMenu || !!overlays.loadError || !!overlays.overlayScreen || overlays.showFullscreenHint || overlays.showSzilánkPicker || !!overlays.sharePopup || !!overlays.slotDeleteTarget || overlays.showSavePopup || !!overlays.saveFile;

  useEffect(() => {
    if (!anyOverlayOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOverlays(prev => ({ ...INITIAL_OVERLAYS, toast: prev.toast, importConfirm: prev.importConfirm }));
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyOverlayOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); setOverlay('showSavePopup', true); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  // Toast auto-dismiss
  useEffect(() => {
    if (!overlays.toast) return;
    const t = setTimeout(() => setOverlay('toast', null), 2500);
    return () => clearTimeout(t);
  }, [overlays.toast]);

  // URL hash import (app mount)
  const hashImportDone = useRef(false);
  useEffect(() => {
    if (hashImportDone.current || !data) return;
    const hash = window.location.hash.slice(1);
    if (hash.length < 20) return;
    hashImportDone.current = true;
    const result = decodeKarakterFromHash(hash);
    if ('error' in result) {
      setOverlay('toast', { msg: result.error, type: 'error' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    const imported = result.karakter;
    let slots: { uid: string; név: string; tsz: number; mentés_dátum: string }[] = [];
    try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
    const match = slots.find(s => s.név === imported.név && s.tsz === imported.tsz);
    imported.uid = generateUid();
    imported.id_leíró = generateIdLeíró(imported.név, imported.tsz);
    if (match) {
      setOverlay('importConfirm', { karakter: imported, matchUid: match.uid });
    } else {
      importKarakter(imported, false);
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [data]);

  function importKarakter(k: Karakter, overwriteUid: string | false) {
    if (overwriteUid) {
      const final = { ...k, uid: overwriteUid, id_leíró: generateIdLeíró(k.név, k.tsz) };
      localStorage.setItem(`szilank_char_${overwriteUid}`, JSON.stringify(final));
      setKarakter(final);
    } else {
      setKarakter(k);
    }
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(true);
    setOverlay('toast', { msg: `Karakter importálva: ${k.név} (${k.tsz}sz)`, type: 'success' });
    setOverlay('importConfirm', null);
  }

  async function shareSlotUrl(slotUid: string) {
    const charData = localStorage.getItem(`szilank_char_${slotUid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData) as Karakter;
      const url = encodeKarakterUrl(parsed);
      let copied = false;
      try { await navigator.clipboard.writeText(url); copied = true; } catch { /* clipboard blocked */ }
      setOverlay('sharePopup', { név: parsed.név || 'Névtelen', copied, url });
    } catch { setOverlay('toast', { msg: 'Hiba az URL generálásakor.', type: 'error' }); }
  }

  // Taktika fok invalidáció: fortély törlés után extra fokok érvénytelenné válhatnak
  useEffect(() => {
    if (!karakter || !data) return;
    const session = karakter.session;
    let changed = false;
    const újTaktikák = session.aktív_taktikák.filter(at => {
      const def = data.taktikak.find(t => t.név === at.név);
      if (!def?.fokozatos || !def.fokok || at.fok == null) return true;
      const alapMax = def.fokok[def.fokok.length - 1].fok;
      if (at.fok <= alapMax) return true;
      if (!def.fortély_bővítés) { changed = true; return false; }
      const fortélyFok = karakter.fortélyok.find(f => f.név === def.fortély_bővítés!.fortély)?.fok ?? 0;
      const maxFok = alapMax + fortélyFok * def.fortély_bővítés.extra_fokok_per_fok;
      if (at.fok > maxFok) { changed = true; return false; }
      return true;
    });
    if (changed) setKarakter(prev => prev ? { ...prev, session: { ...prev.session, aktív_taktikák: újTaktikák } } : prev);
  }, [karakter?.fortélyok, data]);

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

  const indicatorInit = useRef(false);
  const activeTabBtnRef = useRef<HTMLButtonElement | null>(null);
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
  function duplicateKarakter() {
    if (!karakter) return;
    const dup = dupKarakter(karakter);
    setKarakter(dup);
    setUndoStack([]);
    setTestMode(false);
    setIsDirty(true);
    setTimeout(() => setOverlay('showSlotList', true), 100);
  }

  function handleGenerateSave(mode: 'single' | 'backup') {
    if (!karakter) return;
    setOverlay('saveFile', generateSaveFile(karakter, undoStack, mode));
    setOverlay('showSavePopup', false);
  }

  async function loadKarakter() {
    if (!data) return;
    const result = await loadKarakterFromFile(data);
    if ('error' in result) { setOverlay('loadError', result.error); return; }
    setKarakter(result.karakter);
    setUndoStack(result.undo);
    setTestMode(false);
    setIsDirty(true);
  }

  useEffect(() => {
    document.title = karakter?.becenév || 'Szilánk';
  }, [karakter?.becenév]);

  const kpBar = useMemo(() => {
    if (!data || !karakter) return null;
    const { tulajdonságok, képzettségek, fortélyok } = karakter;
    const spec = karakter.fortélyok_speciális;
    const tsz = karakter.tsz;
    const harcmodorÖsszeg = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])]
      .reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
    const alakzatharcSzint = képzettségek.find(k => k.név === 'Alakzatharc')?.szint ?? 0;
    const kpCtx = buildContext(tulajdonságok, tsz, data.konstansok, {
      spec_tartós_sérülés_fok: spec.tartós_sérülés_fok,
      HM_TÉ: karakter.HM_TÉ, HM_VÉ: karakter.HM_VÉ, CM: karakter.CM,
      harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: alakzatharcSzint,
      felszerelés_terhelés: 0, páncél_van: 0, páncél_végtagvédettség: 0,
      páncél_sisak: 0, páncél_idea: 0, páncél_rongálódás: 0, merevvért_fok: 0,
    });
    const fortelyKpMap = new Map(data.fortelySummaries.map(d => [d.név, d.ingyenes_perszint > 0 ? 0 : d.kp_perfok]));
    const harciFortelyNevek = new Set(data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név));
    const primerKepNevek = new Set(data.kepzettsegDefs.filter(d => d.primer).map(d => d.név));
    const harcmodorDef = data.kepzettsegDefs.find(d => d.név === 'Harcmodor');
    if (harcmodorDef?.többszörös) for (const a of harcmodorDef.többszörös) primerKepNevek.add(a);
    const távHarcmodorDef = data.kepzettsegDefs.find(d => d.név === 'Távolsági harcmodor');
    if (távHarcmodorDef?.többszörös) for (const a of távHarcmodorDef.többszörös) primerKepNevek.add(a);
    for (const k of képzettségek) {
      const colonIdx = k.név.indexOf(':');
      if (colonIdx > 0) { const base = k.név.slice(0, colonIdx).trim(); if (primerKepNevek.has(base)) primerKepNevek.add(k.név); }
    }
    const ingyenesFortelyok = data.fortelySummaries.filter(d => d.ingyenes_perszint > 0);
    const arrays = buildArrayContext(képzettségek, fortélyok, data.kepzettsegKp, fortelyKpMap, harciFortelyNevek, {
      tsz, ingyenesFortelyok, primerKepNevek,
      primerFortNevek: new Set(data.primerFortelyok),
      szabadFortelyNevek: new Set(data.fortelySummaries.filter(d => d.csoport === 'szabad').map(d => d.név)),
    });
    const kpComputed = evaluate(data.rules, kpCtx, arrays);
    const maradékKp = kpComputed.get('maradék_kp') ?? 0;
    const primerMaradt = kpComputed.get('primer_keret') ?? 0;
    return (
      <div className="kp-bar">
        <span className={maradékKp < 0 ? 'kp-section-neg' : 'kp-section-ok'}>Maradt KP: {maradékKp}</span>
        <span className={primerMaradt < 0 ? 'kp-section-neg' : 'kp-section-ok'}>Primer keret: {primerMaradt}</span>
      </div>
    );
  }, [data, karakter]);

  if (error) return <div className="error">Hiba: {error}</div>;
  if (!data || !karakter) return <div className="loading">Betöltés...</div>;

  const { tulajdonságok, képzettségek, fortélyok, session } = karakter;

  return (
    <div className="app" onContextMenu={e => e.preventDefault()}>
      <header className="header">
        <span className="title" style={testMode ? { color: '#ff9800' } : undefined} onClick={handleTitleTap}>Szilánk</span>
        <span className="header-szilank" onClick={() => setOverlay('showSzilánkPicker', true)}>{session.szilánk}</span>
        <div className="header-btns">
          <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'naplo')}>📅</button>
          <button className="gear-btn" onClick={() => setOverlay('overlayScreen', 'jegyzetek')}>✏️</button>
          <button className="gear-btn" style={{ padding: '4px 12px' }} onClick={() => setOverlay('showMenu', true)}>⚙️</button>
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
                <ScreenErrorBoundary>
                <TabContent
                  tab={tab.id} data={data} gameMode={gameMode} setActiveTab={setActiveTab}
                  tulajdonságok={tulajdonságok} setTulajdonságok={setTulajdonságok}
                  képzettségek={képzettségek} setKépzettségek={setKépzettségek}
                  fortélyok={fortélyok} setFortélyok={setFortélyok}
                  session={session} setSession={setSession}
                  karakter={karakter} setKarakter={setKarakter}
                  pushUndo={pushUndo}
                />
                </ScreenErrorBoundary>
              )}
            </div>
            );
          })}
        </div>
      </main>

      {versionHint && <div className="version-hint">{versionHint}</div>}

      {!gameMode && data && kpBar}

      <nav className="tab-bar" ref={tabBarRef} style={{ '--tab-count': TABS.length } as React.CSSProperties}>
        <div className="tab-indicator" ref={indicatorRef} />
        {[...TABS].reverse().map((tab, _i) => {
          const i = TABS.indexOf(tab);
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

      <AppOverlays
        state={overlays} setState={setOverlay}
        data={data} karakter={karakter} session={session}
        setSession={setSession} setKarakter={setKarakter}
        undoStack={undoStack} undoTo={undoTo}
        duplicateKarakter={duplicateKarakter}
        handleGenerateSave={handleGenerateSave}
        shareFile={shareFile} downloadFile={downloadFile}
        loadKarakter={loadKarakter} shareSlotUrl={shareSlotUrl}
        importKarakter={importKarakter}
        setUndoStack={setUndoStack} setTestMode={setTestMode} setIsDirty={setIsDirty}
      />

    </div>
  );
}

class ScreenErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Screen crash:', error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '20px', color: '#e53935', textAlign: 'center' }}>
        <p><strong>⚠️ Hiba a megjelenítésben</strong></p>
        <p style={{ fontSize: '13px', color: '#aaa' }}>{this.state.error}</p>
        <button style={{ marginTop: '10px', padding: '6px 12px' }} onClick={() => this.setState({ error: null })}>Újrapróbálás</button>
      </div>
    );
    return this.props.children;
  }
}

function TabContent({ tab, data, gameMode, setActiveTab, tulajdonságok, setTulajdonságok,
  képzettségek, setKépzettségek, fortélyok, setFortélyok, session, setSession,
  karakter, setKarakter, pushUndo }: {
  tab: string; data: GameData; gameMode: boolean; setActiveTab: (i: number) => void;
  tulajdonságok: any; setTulajdonságok: any;
  képzettségek: { név: string; szint: number }[]; setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  fortélyok: Fortely[]; setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  session: Session; setSession: React.Dispatch<React.SetStateAction<Session>>;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  pushUndo: (leírás: string) => void;
}) {
  switch (tab) {
    case 'aktiv': return <AktivScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} />;
    case 'harc': return <HarcScreen data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo} onNavigate={(id) => {
      const idx = ALL_TABS.findIndex(t => t.id === id);
      if (idx >= 0) setActiveTab(idx);
    }} />;
    case 'tavharc': return <TavharcScreen data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} gameMode={gameMode} />;
    case 'tulajdonsagok': {
      const setAnyanyelv = (v: string) => setKarakter(prev => {
        if (!prev) return prev;
        const közös = data.konstansok.közös_nyelv;
        const filtered = prev.fortélyok.filter(f => !(f.név === 'Nyelvismeret' && f.kiérdemelt));
        const ingyenesek: Fortely[] = [
          { név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: közös, kiérdemelt: true },
        ];
        if (v && v !== közös) {
          ingyenesek.push({ név: 'Nyelvismeret', fok: 1, spec_típus: 'nyelv', spec_elem: v, kiérdemelt: true });
        }
        return { ...prev, anyanyelv: v, fortélyok: [...ingyenesek, ...filtered] };
      });
      return <TulajdonsagokScreen data={data} gameMode={gameMode} karakter={karakter}
        tulajdonságok={tulajdonságok} setTulajdonságok={(v: any) => {
          const newVal = typeof v === 'function' ? v(tulajdonságok) : v;
          const tul = tulajdonságok as Record<string, number>;
          const changed = Object.keys(newVal).find(k => newVal[k] !== tul[k]);
          pushUndo(changed ? `${changed}: ${tul[changed!]} → ${newVal[changed!]}` : 'Tulajdonság módosítás');
          setTulajdonságok(v);
        }}
        képzettségek={képzettségek} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }}
        név={karakter.név} setNév={v => { pushUndo(`Név: ${karakter.név} → ${v}`); setKarakter(prev => prev ? { ...prev, név: v } : prev); }}
        becenév={karakter.becenév} setBecenév={v => { pushUndo(`Becenév: ${v}`); setKarakter(prev => prev ? { ...prev, becenév: v } : prev); }}
        játékos={karakter.játékos} setJátékos={v => { pushUndo(`Játékos: ${v}`); setKarakter(prev => prev ? { ...prev, játékos: v } : prev); }}
        tsz={karakter.tsz} setTsz={v => { pushUndo(`TSz: ${karakter.tsz} → ${v}`); setKarakter(prev => prev ? { ...prev, tsz: v } : prev); }}
        kor={karakter.kor} setKor={v => { pushUndo(`Kor: ${karakter.kor} → ${v}`); setKarakter(prev => prev ? { ...prev, kor: v } : prev); }}
        faj={karakter.hátterek.faj} setFaj={v => { pushUndo(`Faj: ${v}`); setKarakter(prev => prev ? { ...prev, hátterek: { ...prev.hátterek, faj: v } } : prev); }}
        anyanyelv={karakter.anyanyelv} setAnyanyelv={setAnyanyelv}
      />;
    }
    case 'fortelyok': {
      const fegyverNevek = karakter.fegyverek.map(f => {
        const fd = lookupFegyver(data.fegyverek, f.alap);
        return fd?.Alapnév || f.alap;
      });
      const nyelvtanulásSzint = karakter.képzettségek.find(k => k.név === 'Nyelvtanulás')?.szint ?? 0;
      return <FortelyokScreen data={data} gameMode={gameMode}
        fortélyok={fortélyok} setFortélyok={(v: any) => {
          const newVal: Fortely[] = typeof v === 'function' ? v(fortélyok) : v;
          let desc = '';
          if (newVal.length > fortélyok.length) {
            const added = newVal.find(n => !fortélyok.some(f => f.név === n.név && f.spec_elem === n.spec_elem));
            if (added && added.fok > 0) desc = `Fortély: ${added.név}${added.spec_elem ? ` (${added.spec_elem})` : ""} 0→${added.fok}`;
          } else if (newVal.length < fortélyok.length) {
            const removed = fortélyok.find(f => !newVal.some(n => n.név === f.név && n.spec_elem === f.spec_elem));
            if (removed) desc = `Fortély: ${removed.név}${removed.spec_elem ? ` (${removed.spec_elem})` : ""} ${removed.fok}→0❌`;
          }
          else {
            const changed = newVal.find((n, i) => n.fok !== fortélyok[i]?.fok);
            if (changed) {
              const old = fortélyok.find(f => f.név === changed.név && f.spec_elem === changed.spec_elem);
              if (old && old.fok !== changed.fok) desc = `Fortély: ${changed.név}${changed.spec_elem ? ` (${changed.spec_elem})` : ""} ${old.fok}→${changed.fok}`;
            }
          }
          if (desc) pushUndo(desc);
          setFortélyok(v);
        }}
        tsz={karakter.tsz} fegyverNevek={fegyverNevek} távfegyverNevek={karakter.távfegyverek.map(tf => tf.alap)} nyelvtanulásSzint={nyelvtanulásSzint}
        képzettségek={képzettségek}
      />;
    }
    case 'misztikus': return <MisztikusScreen data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }} fortélyok={fortélyok} setFortélyok={setFortélyok} gameMode={gameMode} />;
    case 'harcertekek': return <HarcertekekScreen data={data} karakter={karakter}
        setKarakter={(v: any) => { pushUndo('Harcértékek módosítás'); setKarakter(v); }}
        képzettségek={képzettségek} gameMode={gameMode} setKépzettségek={(v: any) => {
          const newVal: {név: string; szint: number}[] = typeof v === 'function' ? v(képzettségek) : v;
          const desc = describeKepChange(képzettségek, newVal);
          if (desc) pushUndo(desc);
          setKépzettségek(v);
        }} />;
    case 'hatterek': return <HatterekScreen data={data} karakter={karakter}
        setKarakter={setKarakter} pushUndo={pushUndo} gameMode={gameMode}
        onNavigate={tab => { const idx = ALL_TABS.findIndex(t => t.id === tab); if (idx >= 0) setActiveTab(idx); }} />;
    default: return null;
  }
}


export default App;
