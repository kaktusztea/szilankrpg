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
  const [showHelyzetPicker, setShowHelyzetPicker] = useState(false);

  useEffect(() => {
    if (!showManőverPicker && !showTaktikaPicker && !showHelyzetPicker) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowManőverPicker(false); setShowTaktikaPicker(false); setShowHelyzetPicker(false); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showManőverPicker, showTaktikaPicker, showHelyzetPicker]);

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

  // 2. Státusz + Harci helyzet hatások kumulálása
  const státuszHatások: { cél: string; hatás: string; érték?: number; megjegyzés?: string }[] = [];
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
  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def || def.csoport !== 'harci') continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef) continue;
    const hasMods = fokDef.módosítók && Array.isArray(fokDef.módosítók) && fokDef.módosítók.length > 0;
    if (!hasMods && fokDef.hatás && fokDef.hatás.length > 0) {
      fortélyEmlékeztetők.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' ') });
    }
  }

  return (
    <div className="screen aktiv-screen">
      <h2>❎ Aktív</h2>

      {/* Hatás pool */}
      {(hasTaktikaMods || hasHatásPool || fortélyEmlékeztetők.length > 0 || session.narratív_módosítók.length > 0) && (
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
          return (
            <div key={i} className="aktiv-chip">
              <span>{t.név}{t.fok != null ? ` (${t.fok})` : ''}</span>
              {def?.fokozatos && t.fok != null && (
                <select className="aktiv-fok-select" value={t.fok} onChange={e => setTaktikaFok(i, parseInt(e.target.value))}>
                  {def.fokok!.map(f => <option key={f.fok} value={f.fok}>{f.fok}</option>)}
                </select>
              )}
              <button className="aktiv-chip-x" onClick={() => removeTaktika(i)}>✕</button>
            </div>
          );
        })}
        <button className="aktiv-add-btn" onClick={() => setShowTaktikaPicker(true)}>+ Taktika...</button>
      </div>

      {showTaktikaPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowTaktikaPicker(false); }}>
          <div className="manover-picker">
            <div className="manover-picker-header">
              <label>Taktika választó</label>
              <button className="aktiv-chip-x" onClick={() => setShowTaktikaPicker(false)}>✕</button>
            </div>
            <div className="manover-picker-list">
              {data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név)).sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(t => (
                <div key={t.név} className="manover-card" onClick={() => { addTaktika(t.név); setShowTaktikaPicker(false); }}>
                  <span className="manover-card-name">{t.név}{t.fokozatos ? ` 📶` : ''}</span>
                  <span className="manover-card-details">
                    {t.fokozatos && t.fokok ? t.fokok.map(f => `${f.fok}: ${Object.entries(f).filter(([k, v]) => k !== 'fok' && v !== 0).map(([k, v]) => `${k}:${v}`).join(', ')}`).join(' | ') : t.módosítók ? Object.entries(t.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ') : ''}
                  </span>
                  {t.megjegyzés && <span className="manover-card-hatas">{t.megjegyzés}</span>}
                </div>
              ))}
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

      {/* Szituációk */}
      <div className="aktiv-section">
        <span className="aktiv-label">Szituációk</span>
        {session.aktív_szituációk.map((s2, i) => (
          <div key={i} className="aktiv-chip">
            <span>{s2}</span>
            <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_szituációk: s.aktív_szituációk.filter((_, j) => j !== i) }))}>✕</button>
          </div>
        ))}
        <select className="aktiv-select" value="" onChange={e => { if (e.target.value) setSession(s => ({ ...s, aktív_szituációk: [...s.aktív_szituációk, e.target.value] })); }}>
          <option value="">+ Szituáció...</option>
          {data.szituaciok.filter(s2 => !session.aktív_szituációk.includes(s2.név)).sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(s2 => (
            <option key={s2.név} value={s2.név}>{s2.név}</option>
          ))}
        </select>
      </div>

      {/* Manőver */}
      <div className="aktiv-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="aktiv-field-btn" style={{ flex: 1 }} onClick={() => setShowManőverPicker(true)}>
            <span className="aktiv-field-label">Manőver</span>
            <strong style={{ color: session.aktív_manőver ? 'var(--success)' : 'var(--text-dim)', fontSize: '14px' }}>{session.aktív_manőver || '— nincs —'}</strong>
          </div>
          {session.aktív_manőver && <button className="aktiv-chip-x" style={{ marginLeft: '6px' }} onClick={() => setSession(s => ({ ...s, aktív_manőver: '' }))}>✕</button>}
        </div>
        {session.aktív_manőver && (() => {
          const m = data.manoverek.find(d => d.név === session.aktív_manőver);
          if (!m) return null;
          return (
            <div className="manover-info">
              <span>Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
              <span>{m.hatás}</span>
            </div>
          );
        })()}
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
        <select className="aktiv-select" value="" onChange={e => { if (e.target.value) setSession(s => ({ ...s, aktív_státuszok: [...s.aktív_státuszok, e.target.value] })); }}>
          <option value="">+ Státusz...</option>
          {data.statuszok.flatMap(s => s.fokok.map(f => ({ label: `${s.név} (${f.fok}) - ${f.alcím}`, value: `${s.név} (${f.fok})`, név: s.név }))).filter(o => !session.aktív_státuszok.includes(o.value) && !session.aktív_státuszok.some(st => st.startsWith(o.név + ' ('))).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

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
              {fegyverOpciók.map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
            </select>
          </div>
          <div className="aktiv-field-btn">
            <span className="aktiv-field-label">Bal</span>
            <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => {
              const idx = parseInt(e.target.value);
              setSession(s => ({ ...s, aktív_fegyver_bal_index: idx, kétkezes_harc: idx !== -1 && s.aktív_fegyver_index >= 0 }));
            }}>
              {fegyverOpciók.map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
            </select>
          </div>
          {(() => {
            const enabled = session.aktív_fegyver_index !== -1 && session.aktív_fegyver_bal_index !== -1;
            return (
              <div className={`aktiv-field-btn aktiv-field-toggle ${session.kétkezes_harc && enabled ? 'on' : ''} ${!enabled ? 'disabled' : ''}`}
                onClick={() => { if (enabled) setSession(s => ({ ...s, kétkezes_harc: !s.kétkezes_harc })); }}>
                <span className="aktiv-field-label">2 kezes</span>
                <strong>{session.kétkezes_harc && enabled ? 'Igen' : 'Nem'}</strong>
              </div>
            );
          })()}
        </div>
        <div className="aktiv-fegyver-row">
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
