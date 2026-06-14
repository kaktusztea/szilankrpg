import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../engine/types';
import './AktivScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
}

export function AktivScreen({ data, karakter, session, setSession }: Props) {
  const [showManőverPicker, setShowManőverPicker] = useState(false);
  const [showTaktikaPicker, setShowTaktikaPicker] = useState(false);
  const [taktikaFokválasztó, setTaktikaFokválasztó] = useState<string | null>(null);
  const [showHelyzetPicker, setShowHelyzetPicker] = useState(false);
  const [showSzituácioPicker, setShowSzituácioPicker] = useState(false);
  const [showStátuszPicker, setShowStátuszPicker] = useState(false);
  const [státuszFokválasztó, setStátuszFokválasztó] = useState<string | null>(null);

  useEffect(() => {
    if (!showManőverPicker && !showTaktikaPicker && !showHelyzetPicker && !showSzituácioPicker && !showStátuszPicker) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowManőverPicker(false); setShowTaktikaPicker(false); setTaktikaFokválasztó(null); setShowHelyzetPicker(false); setShowSzituácioPicker(false); setShowStátuszPicker(false); setStátuszFokválasztó(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showManőverPicker, showTaktikaPicker, showHelyzetPicker, showSzituácioPicker, showStátuszPicker]);

  // Fegyver nevek
  const fegyverOpciók = [{ név: 'Puszta kéz', idx: -1 }, ...karakter.fegyverek.map((f, i) => {
    const fd = data.fegyverek.find(d => d.Fegyver.toLowerCase() === f.alap.toLowerCase());
    return { név: fd?.Alapnév || f.alap, idx: i };
  })];

  // Taktika kombó + megkötés validáció
  function isTaktikaAllowed(név: string): boolean {
    const def = data.taktikak.find(t => t.név === név);
    if (!def) return false;

    // Megkötések ellenőrzése
    if (def.megkötések) {
      for (const mk of def.megkötések) {
        if (mk.típus === 'harci_helyzet' && mk.mód === 'tiltott') {
          if (session.aktív_helyzetek.includes(mk.érték as string)) return false;
        }
        if (mk.típus === 'harcmodor' && mk.mód === 'tiltott') {
          const aktívFegyverIdx = session.aktív_fegyver_index;
          if (aktívFegyverIdx >= 0) {
            const fp = karakter.fegyverek[aktívFegyverIdx];
            if (fp) {
              const fd = data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase());
              if (fd && data.konstansok.fegyver_kategória_harcmodor[fd.Kategória] === mk.érték) return false;
            }
          }
        }
        if (mk.típus === 'támadások' && mk.mód === 'min') {
          // Aktív fegyver támadásszáma ellenőrzés
          const aktívFegyverIdx = session.aktív_fegyver_index;
          const fp = aktívFegyverIdx >= 0 ? karakter.fegyverek[aktívFegyverIdx] : null;
          const fd = fp ? data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase()) : null;
          const sebesség = fd ? parseInt(fd.Sebesség) || 6 : 6;
          const harcmodorNév = fd ? (data.konstansok.fegyver_kategória_harcmodor[fd.Kategória] ?? 'Közelharc') : 'Közelharc';
          const harcmodorSzint = karakter.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
          const harckeret = harcmodorSzint * 2;
          const támadások = 1 + Math.floor(harckeret / sebesség);
          if (támadások < (mk.érték as number)) return false;
        }
      }
    }

    // Kombó validáció
    if (session.aktív_taktikák.length === 0) return true;
    for (const aktív of session.aktív_taktikák) {
      const aktívDef = data.taktikak.find(t => t.név === aktív.név);
      if (!aktívDef) continue;
      if (aktívDef.kombó_mód === 'whitelist' && !aktívDef.kombó_lista.includes(név)) return false;
      if (aktívDef.kombó_mód === 'blacklist' && aktívDef.kombó_lista.includes(név)) return false;
    }
    if (def.kombó_mód === 'whitelist' && def.kombó_lista.length === 0 && session.aktív_taktikák.length > 0) return false;
    if (def.kombó_mód === 'whitelist') {
      for (const aktív of session.aktív_taktikák) {
        if (!def.kombó_lista.includes(aktív.név)) return false;
      }
    }
    if (def.kombó_mód === 'blacklist') {
      for (const aktív of session.aktív_taktikák) {
        if (def.kombó_lista.includes(aktív.név)) return false;
      }
    }
    return true;
  }

  function addTaktika(név: string) {
    const def = data.taktikak.find(t => t.név === név);
    if (!def) return;
    const entry: AktívTaktika = { név, fok: def.fokozatos ? 1 : undefined };
    setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, entry] }));
  }

  function removeTaktika(idx: number) {
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.filter((_, i) => i !== idx) }));
  }

  function setTaktikaFok(idx: number, fok: number) {
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.map((t, i) => i === idx ? { ...t, fok } : t) }));
  }

  // --- Hatás pool kalkuláció ---
  // 1. Taktika harcérték módosítók
  const taktikaMods: Record<string, number> = {};
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef) {
        for (const [k, v] of Object.entries(fokDef)) {
          if (k !== 'fok' && typeof v === 'number') taktikaMods[k] = (taktikaMods[k] ?? 0) + v;
        }
      }
    } else if (def.módosítók) {
      for (const [k, v] of Object.entries(def.módosítók)) {
        if (typeof v === 'number') taktikaMods[k] = (taktikaMods[k] ?? 0) + v;
      }
    }
  }

  // 2. Státusz + Harci helyzet + Taktika hatások kumulálása
  const státuszHatások: { cél: string; hatás: string; érték?: number; megjegyzés?: string }[] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef?.hatások) for (const h of fokDef.hatások) státuszHatások.push(h);
    }
  }
  for (const st of session.aktív_státuszok) {
    const match = st.match(/^(.+) \((\d+)\)$/);
    if (!match) continue;
    const def = data.statuszok.find(s => s.név === match[1]);
    const fokDef = def?.fokok.find(f => f.fok === parseInt(match[2]));
    if (fokDef) {
      for (const h of fokDef.hatások) {
        státuszHatások.push(h);
      }
    }
  }
  for (const h of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === h);
    if (def?.hatások) {
      for (const hat of def.hatások) {
        státuszHatások.push(hat);
      }
    }
  }
  // Csoportosítás cél szerint
  const hatásPool = new Map<string, { előnyHátrány: number; letilt: boolean; maxLimit?: number; szorzó: number; enyhít: number; szövegesek: string[] }>();
  for (const h of státuszHatások) {
    if (!hatásPool.has(h.cél)) hatásPool.set(h.cél, { előnyHátrány: 0, letilt: false, szorzó: 1, enyhít: 0, szövegesek: [] });
    const entry = hatásPool.get(h.cél)!;
    if (h.hatás === 'előny' || h.hatás === 'hátrány') entry.előnyHátrány = Math.max(-2, Math.min(2, entry.előnyHátrány + (h.érték ?? 0)));
    else if (h.hatás === 'letilt') entry.letilt = true;
    else if (h.hatás === 'max_limit') entry.maxLimit = entry.maxLimit != null ? Math.min(entry.maxLimit, h.érték ?? 99) : h.érték;
    else if (h.hatás === 'arányos' || h.hatás === 'duplázás') entry.szorzó *= (h.érték ?? 1);
    else if (h.hatás === 'enyhít') entry.enyhít += (h.érték ?? 0);
    else if (h.hatás === 'szöveges') entry.szövegesek.push(h.megjegyzés ?? '');
  }

  // Fortély enyhítések alkalmazása a Hatás poolra
  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.mód === 'enyhít' && mod.cél) {
        if (!hatásPool.has(mod.cél)) hatásPool.set(mod.cél, { előnyHátrány: 0, letilt: false, szorzó: 1, enyhít: 0, szövegesek: [] });
        hatásPool.get(mod.cél)!.enyhít += (mod.érték ?? 0);
      }
    }
  }

  // Enyhítés alkalmazása: letilt → hátrány-2, hátrány fokozat csökkentés
  for (const [, entry] of hatásPool) {
    if (entry.enyhít > 0 && (entry.letilt || entry.előnyHátrány < 0)) {
      let fokozat = entry.letilt ? 3 : Math.abs(entry.előnyHátrány); // letilt = 3. fok
      fokozat = Math.max(0, fokozat - entry.enyhít);
      entry.letilt = fokozat >= 3;
      entry.előnyHátrány = fokozat >= 3 ? 0 : -Math.min(2, fokozat);
      if (fokozat === 0) { entry.letilt = false; entry.előnyHátrány = 0; }
    }
  }

  const eseményNév = (id: string) => data.esemenyek.find(e => e.id === id)?.név ?? id;
  const hasTaktikaMods = Object.values(taktikaMods).some(v => v !== 0);
  const hasHatásPool = hatásPool.size > 0;

  // Fortély emlékeztetők: harci fortélyok amelyeknek van hatástext de nincs gépi módosító
  const fortélyEmlékeztetők: { név: string; fok: number; hatás: string }[] = [];
  const manőverBónuszok: { név: string; manőver: string; érték: number }[] = [];
  const előnyHátrányMods: { név: string; cél: string; mód: string; érték: number }[] = [];

  // Aktív feltételek (§16 feltételes módosítókhoz)
  const aktívFeltételek = new Set<string>();
  for (const at of session.aktív_taktikák) { const def = data.taktikak.find(t => t.név === at.név); if (def) aktívFeltételek.add(def.feltétel_kulcs); }
  for (const h of session.aktív_helyzetek) { const def = data.harciHelyzetek.find(d => d.név === h); if (def) aktívFeltételek.add(def.feltétel_kulcs); }
  for (const sz of session.aktív_szituációk) { const def = data.szituaciok.find(d => d.név === sz); if (def) aktívFeltételek.add(def.feltétel_kulcs); }

  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def || def.csoport !== 'harci') continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef) continue;
    const hasMods = fokDef.módosítók && Array.isArray(fokDef.módosítók) && fokDef.módosítók.length > 0;
    if (hasMods) {
      for (const mod of fokDef.módosítók) {
        if (mod.feltétel && mod.feltétel !== '' && !aktívFeltételek.has(mod.feltétel)) continue;
        if (typeof mod.cél === 'string' && mod.cél.startsWith('manőver:')) {
          manőverBónuszok.push({ név: kf.név, manőver: mod.cél.slice(8), érték: mod.érték });
        }
        if (mod.mód === 'előny' || mod.mód === 'hátrány') {
          előnyHátrányMods.push({ név: kf.név, cél: mod.cél, mód: mod.mód, érték: mod.érték });
        }
      }
    }
    if (!hasMods && fokDef.hatás && fokDef.hatás.length > 0) {
      fortélyEmlékeztetők.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' ') });
    }
  }

  return (
    <div className="screen aktiv-screen">
      <h2>❎ Aktív</h2>

      {/* Hatás pool */}
      {(hasTaktikaMods || hasHatásPool || fortélyEmlékeztetők.length > 0 || manőverBónuszok.length > 0 || előnyHátrányMods.length > 0 || session.narratív_módosítók.length > 0) && (
        <div className="aktiv-hatas-pool">
          {hasTaktikaMods && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Harcérték módosítók</span>
              <div className="hatas-pool-items">
                {Object.entries(taktikaMods).filter(([, v]) => v !== 0).map(([k, v]) => (
                  <span key={k} className={`hatas-pool-item ${v > 0 ? 'positive' : 'negative'}`}>{k}: {v > 0 ? '+' : ''}{v}</span>
                ))}
              </div>
            </div>
          )}
          {hasHatásPool && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Aktív Hatások</span>
              <div className="hatas-pool-items">
                {[...hatásPool.entries()].map(([cél, entry]) => {
                  const parts: string[] = [];
                  if (entry.letilt) parts.push('❌ Letiltva');
                  if (entry.előnyHátrány !== 0) parts.push(entry.előnyHátrány > 0 ? `Előny+${entry.előnyHátrány}` : `Hátrány${entry.előnyHátrány}`);
                  if (entry.szorzó !== 1) parts.push(`×${entry.szorzó}`);
                  if (entry.maxLimit != null) parts.push(`max: ${entry.maxLimit}`);
                  if (entry.enyhít > 0) parts.push(`⬆${entry.enyhít} enyhítés`);
                  for (const sz of entry.szövegesek) { if (sz) parts.push(sz); }
                  if (parts.length === 0) return null;
                  return <span key={cél} className={`hatas-pool-item ${entry.letilt ? 'negative' : entry.előnyHátrány < 0 ? 'negative' : entry.előnyHátrány > 0 ? 'positive' : ''}`}>{eseményNév(cél)}: {parts.join(', ')}</span>;
                })}
              </div>
            </div>
          )}
          {manőverBónuszok.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Manőver bónuszok</span>
              <div className="hatas-pool-items">
                {manőverBónuszok.map((mb, i) => (
                  <span key={i} className="hatas-pool-item positive">{data.manoverek.find(m => m.id === mb.manőver)?.név ?? mb.manőver.replace(/_/g, ' ')}: +{mb.érték} ({mb.név})</span>
                ))}
              </div>
            </div>
          )}
          {előnyHátrányMods.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Előny / Hátrány</span>
              <div className="hatas-pool-items">
                {előnyHátrányMods.map((eh, i) => (
                  <span key={i} className={`hatas-pool-item ${eh.mód === 'előny' ? 'positive' : 'negative'}`}>{eh.mód === 'előny' ? 'Előny' : 'Hátrány'}+{eh.érték} {eh.cél.replace(/_/g, ' ')} ({eh.név})</span>
                ))}
              </div>
            </div>
          )}
          {fortélyEmlékeztetők.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Fortély emlékeztetők</span>
              <div className="hatas-pool-items">
                {fortélyEmlékeztetők.map((fe, i) => (
                  <span key={i} className="hatas-pool-item"><strong className="fortely-nev">{fe.név} ({fe.fok}):</strong> {fe.hatás}</span>
                ))}
              </div>
            </div>
          )}
          {session.narratív_módosítók.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Narratív módosítók</span>
              <div className="hatas-pool-items">
                {session.narratív_módosítók.map((nm, i) => (
                  <span key={i} className={`hatas-pool-item ${(nm.érték ?? 0) > 0 ? 'positive' : (nm.érték ?? 0) < 0 ? 'negative' : ''}`}>
                    {nm.szöveg}{nm.érték != null ? ` (${nm.érték > 0 ? 'Előny+' : 'Hátrány'}${nm.érték > 0 ? nm.érték : nm.érték})` : ''}
                    <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) }))}>✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Taktikák */}
      <div className="aktiv-section">
        <span className="aktiv-label">Taktikák</span>
        {session.aktív_taktikák.map((t, i) => {
          const def = data.taktikak.find(d => d.név === t.név);
          let modStr = '';
          if (def?.fokozatos && def.fokok && t.fok != null) {
            const f = def.fokok.find(fk => fk.fok === t.fok);
            if (f) modStr = Object.entries(f).filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0).map(([k, v]) => `${k}:${(v as number) > 0 ? '+' : ''}${v}`).join(' ');
          } else if (def?.módosítók) {
            modStr = Object.entries(def.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}:${(v as number) > 0 ? '+' : ''}${v}`).join(' ');
          }
          return (
            <div key={i} className="aktiv-chip taktika-chip">
              <div style={{ display: 'flex', flexDirection: 'column' }} onClick={() => { if (def?.fokozatos) { setTaktikaFokválasztó(t.név); setShowTaktikaPicker(true); } }}>
                <span className="taktika-chip-name" style={def?.fokozatos ? { cursor: 'pointer' } : undefined}>{t.név}{t.fok != null ? ` (${t.fok})` : ''}</span>
                {modStr && <span className="taktika-chip-mods">{modStr}</span>}
              </div>
              <button className="aktiv-chip-x" onClick={() => removeTaktika(i)}>✕</button>
            </div>
          );
        })}
        <button className="aktiv-add-btn" onClick={() => setShowTaktikaPicker(true)}>+ Taktika...</button>
      </div>

      {showTaktikaPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowTaktikaPicker(false); setTaktikaFokválasztó(null); } }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>{taktikaFokválasztó ? `${taktikaFokválasztó} — fok választó` : 'Taktika választó'}</label>
              <button className="aktiv-chip-x" onClick={() => { setShowTaktikaPicker(false); setTaktikaFokválasztó(null); }}>✕</button>
            </div>
            <div className="manover-picker-list">
              {!taktikaFokválasztó && data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név)).sort((a, b) => {
                const pinned = ['Támadó', 'Védő', 'Teljes Védekezés'];
                const aPin = pinned.indexOf(a.név);
                const bPin = pinned.indexOf(b.név);
                if (aPin >= 0 && bPin >= 0) return aPin - bPin;
                if (aPin >= 0) return -1;
                if (bPin >= 0) return 1;
                return a.név.localeCompare(b.név, 'hu');
              }).map(t => (
                <div key={t.név} className="manover-card" onClick={() => {
                  if (t.fokozatos) {
                    setTaktikaFokválasztó(t.név);
                  } else {
                    addTaktika(t.név);
                    setShowTaktikaPicker(false);
                  }
                }}>
                  <span className="manover-card-name">{t.név}{t.fokozatos ? ` 📶` : ''}</span>
                  <span className="manover-card-details">
                    {t.fokozatos && t.fokok ? t.fokok.map(f => `${f.fok}: ${Object.entries(f).filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0).map(([k, v]) => `${k}:${v}`).join(', ')}`).join(' | ') : t.módosítók ? Object.entries(t.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ') : ''}
                  </span>
                  {t.megjegyzés && <span className="manover-card-hatas">{t.megjegyzés}</span>}
                </div>
              ))}
              {taktikaFokválasztó && (() => {
                const def = data.taktikak.find(t => t.név === taktikaFokválasztó);
                if (!def?.fokok) return null;
                const existing = session.aktív_taktikák.findIndex(a => a.név === taktikaFokválasztó);
                return def.fokok.map(f => (
                  <div key={f.fok} className={`manover-card ${existing >= 0 && session.aktív_taktikák[existing].fok === f.fok ? 'active' : ''}`} onClick={() => {
                    if (existing >= 0) {
                      setTaktikaFok(existing, f.fok);
                    } else {
                      setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, { név: taktikaFokválasztó!, fok: f.fok }] }));
                    }
                    setShowTaktikaPicker(false);
                    setTaktikaFokválasztó(null);
                  }}>
                    <span className="manover-card-name">{f.fok}. fok</span>
                    <span className="manover-card-details">{Object.entries(f).filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ')}</span>
                    {f.hatások && f.hatások.length > 0 && <span className="manover-card-hatas">{f.hatások.map(h => h.megjegyzés || `${h.hatás} ${h.érték ?? ''} ${h.cél}`).join(', ')}</span>}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Manőver */}
      <div className="aktiv-section" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="aktiv-field-btn" onClick={() => setShowManőverPicker(true)}>
          <span className="aktiv-field-label">Manőver</span>
          <strong style={{ color: session.aktív_manőver ? 'var(--success)' : 'var(--text-dim)', fontSize: '14px' }}>{session.aktív_manőver || '— nincs —'}</strong>
          {session.aktív_manőver && (() => {
            const m = data.manoverek.find(d => d.név === session.aktív_manőver);
            if (!m) return null;
            return (<>
              <span className="taktika-chip-mods">Nehézség: {m.nehézség} • {m.fázisok}</span>
              <span className="taktika-chip-mods">{m.hatás}</span>
            </>);
          })()}
        </div>
        {session.aktív_manőver && <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_manőver: '' }))}>✕</button>}
      </div>

      {showManőverPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowManőverPicker(false); }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>Manőver választó</label>
              <button className="aktiv-chip-x" onClick={() => setShowManőverPicker(false)}>✕</button>
            </div>
            <div className="manover-picker-list">
              {['általános', 'belharcos'].map(tipus => {
                const items = data.manoverek.filter(m => m.típus === tipus);
                if (items.length === 0) return null;
                return (
                  <div key={tipus}>
                    <div className="manover-category-label">{tipus === 'általános' ? 'Általános' : 'Belharci'}</div>
                    {items.map(m => (
                      <div key={m.név} className={`manover-card ${session.aktív_manőver === m.név ? 'active' : ''}`} onClick={() => { setSession(s => ({ ...s, aktív_manőver: m.név })); setShowManőverPicker(false); }}>
                        <span className="manover-card-name">{m.név}</span>
                        <span className="manover-card-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                        <span className="manover-card-hatas">{m.hatás}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Harci helyzetek */}
      <div className="aktiv-section">
        <span className="aktiv-label">Harci helyzetek</span>
        {session.aktív_helyzetek.map((h, i) => (
          <div key={i} className="aktiv-chip">
            <span>{h}</span>
            <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }))}>✕</button>
          </div>
        ))}
        <button className="aktiv-add-btn" onClick={() => setShowHelyzetPicker(true)}>+ Helyzet...</button>
      </div>

      {showHelyzetPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowHelyzetPicker(false); }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>Harci helyzet választó</label>
              <button className="aktiv-chip-x" onClick={() => setShowHelyzetPicker(false)}>✕</button>
            </div>
            <div className="manover-picker-list">
              {data.harciHelyzetek.filter(h => !session.aktív_helyzetek.includes(h.név)).sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(h => (
                <div key={h.név} className="manover-card" onClick={() => { setSession(s => ({ ...s, aktív_helyzetek: [...s.aktív_helyzetek, h.név] })); setShowHelyzetPicker(false); }}>
                  <span className="manover-card-name">{h.név}</span>
                  <span className="manover-card-hatas">{h.infó}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Státuszok */}
      <div className="aktiv-section">
        <span className="aktiv-label">Státuszok</span>
        {session.aktív_státuszok.map((st, i) => {
          const match = st.match(/^(.+) \((\d+)\)$/);
          const stNév = match?.[1] ?? st;
          const stFok = match ? parseInt(match[2]) : 1;
          const def = data.statuszok.find(s => s.név === stNév);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === stFok)?.alcím;
          return (
            <div key={i} className="aktiv-chip">
              <span onClick={() => {
                if (maxFok <= 1) return;
                const újFok = (stFok % maxFok) + 1;
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? `${stNév} (${újFok})` : v) }));
              }} style={maxFok > 1 ? { cursor: 'pointer' } : undefined}>{stNév} ({stFok}){alcím ? ` - ${alcím}` : ''}</span>
              <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) }))}>✕</button>
            </div>
          );
        })}
        <button className="aktiv-add-btn" onClick={() => setShowStátuszPicker(true)}>+ Státusz...</button>
      </div>

      {showStátuszPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowStátuszPicker(false); setStátuszFokválasztó(null); } }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>{státuszFokválasztó ? `${státuszFokválasztó} — fok választó` : 'Státusz választó'}</label>
              <button className="aktiv-chip-x" onClick={() => { setShowStátuszPicker(false); setStátuszFokválasztó(null); }}>✕</button>
            </div>
            <div className="manover-picker-list">
              {!státuszFokválasztó && ['fizikai', 'szellemi', 'mágikus']
                .map(kat => {
                  const items = data.statuszok
                    .filter(s => s.kategória === kat && !session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))
                    .sort((a, b) => a.név.localeCompare(b.név, 'hu'));
                  if (items.length === 0) return null;
                  return (
                    <div key={kat}>
                      <div className="manover-category-label">{kat.charAt(0).toUpperCase() + kat.slice(1)}</div>
                      {items.map(s => (
                        <div key={s.név} className="manover-card" onClick={() => {
                          if (s.fokok.length === 1) {
                            setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${s.név} (1)`] }));
                            setShowStátuszPicker(false);
                          } else {
                            setStátuszFokválasztó(s.név);
                          }
                        }}>
                          <span className="manover-card-name">{s.név}</span>
                          <span className="manover-card-details">{s.fokok.map(f => `${f.fok}. ${f.alcím}`).join(' • ')}</span>
                        </div>
                      ))}
                    </div>
                  );
                })
              }
              {státuszFokválasztó && (() => {
                const def = data.statuszok.find(s => s.név === státuszFokválasztó);
                if (!def) return null;
                return def.fokok.map(f => (
                  <div key={f.fok} className="manover-card" onClick={() => {
                    setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${státuszFokválasztó} (${f.fok})`] }));
                    setShowStátuszPicker(false);
                    setStátuszFokválasztó(null);
                  }}>
                    <span className="manover-card-name">{f.alcím} ({f.fok})</span>
                    <span className="manover-card-hatas">{f.hatások.slice(0, 4).map(h => {
                      if (typeof h === 'string') return h;
                      const célNév = data.esemenyek.find(e => e.id === h.cél)?.név ?? h.cél;
                      if (h.hatás === 'hátrány') return `Hátrány${h.érték} ${célNév}`;
                      if (h.hatás === 'előny') return `Előny+${h.érték} ${célNév}`;
                      if (h.hatás === 'letilt') return `❌ ${célNév}`;
                      if (h.hatás === 'max_limit') return `Max ${h.érték} ${célNév}`;
                      if (h.hatás === 'arányos') return `${célNév} ×${h.érték}`;
                      if (h.hatás === 'szöveges') return h.megjegyzés || célNév;
                      return `${célNév}: ${h.hatás}`;
                    }).join('; ')}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Szituációk */}
      <div className="aktiv-section">
        <span className="aktiv-label">Szituációk</span>
        {session.aktív_szituációk.map((s2, i) => (
          <div key={i} className="aktiv-chip">
            <span>{s2}</span>
            <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_szituációk: s.aktív_szituációk.filter((_, j) => j !== i) }))}>✕</button>
          </div>
        ))}
        <button className="aktiv-add-btn" onClick={() => setShowSzituácioPicker(true)}>+ Szituáció...</button>
      </div>

      {showSzituácioPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowSzituácioPicker(false); }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>Szituáció választó</label>
              <button className="aktiv-chip-x" onClick={() => setShowSzituácioPicker(false)}>✕</button>
            </div>
            <div className="manover-picker-list">
              {data.szituaciok.filter(s2 => !session.aktív_szituációk.includes(s2.név)).sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(s2 => (
                <div key={s2.név} className="manover-card" onClick={() => { setSession(s => ({ ...s, aktív_szituációk: [...s.aktív_szituációk, s2.név] })); setShowSzituácioPicker(false); }}>
                  <span className="manover-card-name">{s2.név}</span>
                  <span className="manover-card-hatas">{s2.infó}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Narratív módosítók */}
      <div className="aktiv-section">
        <span className="aktiv-label">Narratív módosítók</span>
        <div className="narrativ-add-row">
          <input className="narrativ-input" placeholder="Leírás..." id="narrativ-text" maxLength={40} />
          <select className="narrativ-select" id="narrativ-ertek">
            <option value="">—</option>
            <option value="2">Előny+2</option>
            <option value="1">Előny+1</option>
            <option value="-1">Hátrány-1</option>
            <option value="-2">Hátrány-2</option>
          </select>
          <button className="narrativ-add-btn" onClick={() => {
            const textEl = document.getElementById('narrativ-text') as HTMLInputElement;
            const valEl = document.getElementById('narrativ-ertek') as HTMLSelectElement;
            const szöveg = textEl.value.trim();
            if (!szöveg) return;
            const érték = valEl.value ? parseInt(valEl.value) : undefined;
            setSession(s => ({ ...s, narratív_módosítók: [...s.narratív_módosítók, { szöveg, érték }] }));
            textEl.value = '';
            valEl.value = '';
          }}>+</button>
        </div>
      </div>

      {/* Fegyverek sor — alul */}
      <div className="aktiv-bottom-section">
        <div className="aktiv-fegyver-row">
          <div className="aktiv-field-btn">
            <span className="aktiv-field-label">Jobb</span>
            <select className="aktiv-field-select" value={session.aktív_fegyver_index} onChange={e => {
              const idx = parseInt(e.target.value);
              setSession(s => ({ ...s, aktív_fegyver_index: idx, kétkezes_harc: idx !== -1 && s.aktív_fegyver_bal_index !== -1 ? s.kétkezes_harc : false }));
            }}>
              {fegyverOpciók.filter(f => {
                if (f.idx === -1) return true;
                if (session.aktív_fegyver_bal_index === -1) return true;
                const balFp = karakter.fegyverek[session.aktív_fegyver_bal_index];
                if (!balFp) return true;
                const balDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === balFp.alap.toLowerCase());
                const fDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === karakter.fegyverek[f.idx]?.alap.toLowerCase());
                return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(balDef?.Pengehossz ?? '0') || 0) <= 2.0;
              }).map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
            </select>
          </div>
          <div className="aktiv-field-btn">
            <span className="aktiv-field-label">Bal</span>
            <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => {
              const idx = parseInt(e.target.value);
              setSession(s => ({ ...s, aktív_fegyver_bal_index: idx, kétkezes_harc: idx === -1 ? false : s.kétkezes_harc }));
            }}>
              {fegyverOpciók.filter(f => {
                if (f.idx === -1) return true;
                if (session.aktív_fegyver_index === -1) return true;
                const jobbFp = karakter.fegyverek[session.aktív_fegyver_index];
                if (!jobbFp) return true;
                const jobbDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase());
                const fDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === karakter.fegyverek[f.idx]?.alap.toLowerCase());
                return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(jobbDef?.Pengehossz ?? '0') || 0) <= 2.0;
              }).map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
            </select>
          </div>
        </div>
        <div className="aktiv-fegyver-row">
          {(() => {
            const hasBoth = session.aktív_fegyver_index !== -1 && session.aktív_fegyver_bal_index !== -1;
            let overLimit = false;
            if (hasBoth) {
              const jFp = karakter.fegyverek[session.aktív_fegyver_index];
              const bFp = karakter.fegyverek[session.aktív_fegyver_bal_index];
              if (jFp && bFp) {
                const jDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === jFp.alap.toLowerCase());
                const bDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === bFp.alap.toLowerCase());
                const sum = (parseFloat(jDef?.Pengehossz ?? '0') || 0) + (parseFloat(bDef?.Pengehossz ?? '0') || 0);
                overLimit = sum > 2.0;
              }
            }
            const enabled = hasBoth && !overLimit;
            if (overLimit && session.kétkezes_harc) setSession(s => ({ ...s, kétkezes_harc: false }));
            return (
              <div className={`aktiv-field-btn aktiv-field-toggle ${session.kétkezes_harc && enabled ? 'on' : ''} ${!enabled ? 'disabled' : ''}`}
                onClick={() => { if (enabled) setSession(s => ({ ...s, kétkezes_harc: !s.kétkezes_harc })); }}>
                <span className="aktiv-field-label">2 kezes harc</span>
                <strong style={overLimit ? { color: 'var(--error)' } : undefined}>{session.kétkezes_harc && enabled ? 'Igen' : 'Nem'}</strong>
              </div>
            );
          })()}
          <div className={`aktiv-field-btn aktiv-field-toggle ${session.aktív_pajzs ? 'on' : ''}`}
            onClick={() => setSession(s => ({ ...s, aktív_pajzs: !s.aktív_pajzs }))}>
            <span className="aktiv-field-label">Pajzs kézben</span>
            <strong>{session.aktív_pajzs ? 'Igen' : 'Nem'}</strong>
          </div>
          <div className={`aktiv-field-btn aktiv-field-toggle ${session.aktív_páncél ? 'on' : ''}`}
            onClick={() => setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél }))}>
            <span className="aktiv-field-label">Páncél viselve</span>
            <strong>{session.aktív_páncél ? 'Igen' : 'Nem'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
