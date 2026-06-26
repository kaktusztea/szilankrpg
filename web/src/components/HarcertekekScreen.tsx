import { useState, useEffect, useRef } from 'react';
import type { GameData } from '../engine/data-loader';
import type { Karakter, FegyverPeldany, PancelPeldany } from '../engine/types';
import { lookupFegyver } from '../engine/helpers';
import { HmSection, HarciKepzettsegekSection, FegyverekSection, PancelSection, PajzsSection, Popups } from './harcertekek';
import './HarcertekekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
}

export function HarcertekekScreen({ data, karakter, setKarakter, képzettségek, setKépzettségek, gameMode }: Props) {
  // --- Hint sáv ---
  const [hint, setHint] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showHint(msg: string, duration = 3000) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), duration);
  }

  // --- Popup state ---
  const [ideaTarget, setIdeaTarget] = useState<{ type: 'fegyver' | 'páncél'; idx: number } | null>(null);
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  const [anyagTarget, setAnyagTarget] = useState<number | null>(null);
  const [pancelPopup, setPancelPopup] = useState<string | null>(null);
  const [pajzsPopup, setPajzsPopup] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteKepzTarget, setDeleteKepzTarget] = useState<string | null>(null);
  const [kepzSzintTarget, setKepzSzintTarget] = useState<string | null>(null);

  const popupState = { ideaTarget, mfTarget, anyagTarget, pancelPopup, pajzsPopup, deleteTarget, deleteKepzTarget, kepzSzintTarget };
  const anyPopupOpen = ideaTarget || mfTarget !== null || anyagTarget !== null || pancelPopup || pajzsPopup || deleteTarget !== null || deleteKepzTarget || kepzSzintTarget;

  // --- Escape handler ---
  useEffect(() => {
    if (!anyPopupOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (kepzSzintTarget) {
          const kp = képzettségek.find(k => k.név === kepzSzintTarget);
          if (kp && kp.szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== kepzSzintTarget));
        }
        setIdeaTarget(null); setMfTarget(null); setAnyagTarget(null);
        setPancelPopup(null); setPajzsPopup(null); setDeleteTarget(null);
        setDeleteKepzTarget(null); setKepzSzintTarget(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyPopupOpen, kepzSzintTarget, képzettségek]);

  // --- Mutátor függvények ---
  function updateFegyver(idx: number, patch: Partial<FegyverPeldany>) {
    setKarakter(prev => {
      if (!prev) return prev;
      return { ...prev, fegyverek: prev.fegyverek.map((f, i) => i === idx ? { ...f, ...patch } : f) };
    });
  }

  function removeFegyver(idx: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.fegyverek[idx];
      const fegyverek = prev.fegyverek.filter((_, i) => i !== idx);
      const fDef = lookupFegyver(data.fegyverek, removed.alap);
      const displayName = fDef?.Alapnév || removed.alap;
      const fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === removed.alap)));
      const session = { ...prev.session };
      if (session.aktív_fegyver_index >= fegyverek.length) { session.aktív_fegyver_index = 0; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_bal_index >= fegyverek.length) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_index === session.aktív_fegyver_bal_index) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      return { ...prev, fegyverek, fortélyok, session };
    });
  }

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  function updatePajzs(patch: Partial<{ méret: string }>) {
    setKarakter(prev => prev ? { ...prev, pajzs: { ...prev.pajzs, ...patch } } : prev);
  }

  function setMfFok(fegyverAlap: string, fok: number) {
    const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
    const displayName = fDef?.Alapnév || fegyverAlap;
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fegyverAlap)));
      if (fok > 0) fortélyok = [{ név: 'Mesterfegyver', fok, spec_típus: 'fegyver', spec_elem: displayName }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }

  function setPajzsFok(fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Pajzshasználat');
      if (fok > 0) fortélyok = [{ név: 'Pajzshasználat', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }

  function setMerevvertFok(fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Merevvértviselet');
      if (fok > 0) fortélyok = [{ név: 'Merevvértviselet', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      return { ...prev, fortélyok };
    });
  }

  const merevvertFok = karakter.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const pajzsFok = karakter.fortélyok.find(f => f.név === 'Pajzshasználat')?.fok ?? 0;

  function closePopup(key: string) {
    const setters: Record<string, (v: any) => void> = {
      ideaTarget: setIdeaTarget, mfTarget: setMfTarget, anyagTarget: setAnyagTarget,
      pancelPopup: setPancelPopup, pajzsPopup: setPajzsPopup, deleteTarget: setDeleteTarget,
      deleteKepzTarget: setDeleteKepzTarget, kepzSzintTarget: setKepzSzintTarget,
    };
    setters[key]?.(null);
  }

  // --- Render ---
  return (
    <div className="screen harcertekek-screen" style={gameMode ? { pointerEvents: 'none' } : undefined}>
      <h2>🛡️ Harcértékek</h2>

      <HmSection data={data} karakter={karakter} setKarakter={setKarakter} gameMode={gameMode} />

      <HarciKepzettsegekSection
        data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={setKépzettségek}
        gameMode={gameMode} onDeleteKepz={setDeleteKepzTarget} onKepzSzint={setKepzSzintTarget}
      />

      <FegyverekSection
        data={data} karakter={karakter} setKarakter={setKarakter} gameMode={gameMode}
        onIdeaTarget={idx => setIdeaTarget({ type: 'fegyver', idx })}
        onMfTarget={setMfTarget} onAnyagTarget={setAnyagTarget} onDeleteTarget={setDeleteTarget}
      />

      <PancelSection
        data={data} karakter={karakter} setKarakter={setKarakter}
        merevvertFok={merevvertFok}
        onPopup={setPancelPopup}
        onIdeaTarget={() => setIdeaTarget({ type: 'páncél', idx: 0 })}
      />

      <PajzsSection
        data={data} karakter={karakter} pajzsFok={pajzsFok}
        onPajzsPopup={setPajzsPopup} showHint={showHint}
      />

      <Popups
        data={data} karakter={karakter} képzettségek={képzettségek} state={popupState}
        onClose={closePopup}
        updateFegyver={updateFegyver} updatePancel={updatePancel}
        setMfFok={setMfFok} setMerevvertFok={setMerevvertFok}
        setPajzsFok={setPajzsFok} updatePajzs={updatePajzs}
        removeFegyver={removeFegyver} setKépzettségek={setKépzettségek}
      />

      {hint && <div className="he-hint">{hint}</div>}
    </div>
  );
}
