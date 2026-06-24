import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../engine/types';
import { calcHatásPool } from './HatasPoolCalc';
import { fmtCode, fmtHatás } from './formatters';
import './AktivScreen.css';



interface Props {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
}

export function AktivScreen({ data, karakter, session, setSession, pushUndo }: Props) {
  const [showManőverPicker, setShowManőverPicker] = useState(false);
  const [showTaktikaPicker, setShowTaktikaPicker] = useState(false);
  const [taktikaFokválasztó, setTaktikaFokválasztó] = useState<string | null>(null);
  const [showHelyzetPicker, setShowHelyzetPicker] = useState(false);
  const [showStátuszPicker, setShowStátuszPicker] = useState(false);
  const [státuszFokválasztó, setStátuszFokválasztó] = useState<string | null>(null);
  const [érzékválasztó, setÉrzékválasztó] = useState<string | null>(null);
  const [narrativPopup, setNarrativPopup] = useState(false);
  const [narrativÉrték, setNarrativÉrték] = useState<number | undefined>(undefined);
  const [showFegyverfogás, setShowFegyverfogás] = useState(false);

  useEffect(() => {
    if (!showManőverPicker && !showTaktikaPicker && !showHelyzetPicker && !showStátuszPicker) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowManőverPicker(false); setShowTaktikaPicker(false); setTaktikaFokválasztó(null); setShowHelyzetPicker(false); setShowStátuszPicker(false); setStátuszFokválasztó(null); setÉrzékválasztó(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showManőverPicker, showTaktikaPicker, showHelyzetPicker, showStátuszPicker]);

  // Fegyver nevek
  const fegyverOpciók = [{ név: 'Puszta kéz', idx: -1 }, ...karakter.fegyverek.map((f, i) => {
    const fd = data.fegyverek.find(d => d.Fegyver.toLowerCase() === f.alap.toLowerCase());
    return { név: fd?.Alapnév || f.alap, idx: i };
  })];

  // Taktika kombó + megkötés validáció
  function isTaktikaAllowed(név: string): boolean {
    // Ha bármelyik aktív helyzet tiltja az összes taktikát
    for (const h of session.aktív_helyzetek) {
      const hDef = data.harciHelyzetek.find(d => d.név === h);
      if ((hDef as any)?.tiltja_taktikákat) return false;
    }

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
    pushUndo(`Taktika: ${név}`);
    const entry: AktívTaktika = { név, fok: def.fokozatos ? 1 : undefined };
    setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, entry] }));
  }

  function removeTaktika(idx: number) {
    pushUndo(`Taktika−: ${session.aktív_taktikák[idx]?.név}`);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.filter((_, i) => i !== idx) }));
  }

  function setTaktikaFok(idx: number, fok: number) {
    pushUndo(`Taktika: ${session.aktív_taktikák[idx]?.név} fok→${fok}`);
    setSession(s => ({ ...s, aktív_taktikák: s.aktív_taktikák.map((t, i) => i === idx ? { ...t, fok } : t) }));
  }


  const { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév } = calcHatásPool(data, karakter, session);
  return (
    <div className="screen aktiv-screen">
      <h2>❎ Aktív</h2>

      {/* Fegyverek + Fegyverfogás sor — felül */}
      <div className="aktiv-bottom-section">
        <div className="aktiv-fegyver-row">
          <div className="aktiv-field-btn">
            <span className="aktiv-field-label">Ügyesebb kéz</span>
            <select className="aktiv-field-select" value={session.aktív_fegyver_index} onChange={e => {
              const idx = parseInt(e.target.value);
              pushUndo(`Fegyver: ${idx === -1 ? 'Puszta kéz' : karakter.fegyverek[idx]?.alap ?? idx}`);
              setSession(s => {
                const puszta = idx === -1 || karakter.fegyverek[idx]?.alap.toLowerCase() === 'puszta kéz';
                if (puszta) {
                  return { ...s, aktív_fegyver_index: idx, fegyverfogás: 'egyfegyveres', kétkezes_harc: false, aktív_fegyver_bal_index: -1 };
                }
                return { ...s, aktív_fegyver_index: idx, kétkezes_harc: idx !== -1 && s.aktív_fegyver_bal_index !== -1 ? s.kétkezes_harc : false };
              });
            }}>
              {fegyverOpciók.filter(f => {
                if (f.idx === -1) return true;
                if (session.aktív_fegyver_bal_index === -1) return true;
                const balFp = karakter.fegyverek[session.aktív_fegyver_bal_index];
                if (!balFp) return true;
                const balDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === balFp.alap.toLowerCase());
                const fDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === karakter.fegyverek[f.idx]?.alap.toLowerCase());
                return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(balDef?.Pengehossz ?? '0') || 0) <= data.konstansok.kétkezes_harc_max_pengeméret;
              }).map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
            </select>
          </div>
          {session.fegyverfogás !== 'egyfegyveres' && (
          <div className="aktiv-field-btn">
            <span className="aktiv-field-label">Gyengébb kéz</span>
            {session.fegyverfogás === 'fegyver_pajzs' ? (
              <select className="aktiv-field-select" disabled><option>Pajzs</option></select>
            ) : session.fegyverfogás === 'fegyver_hárító' ? (() => {
              const háritók = karakter.fegyverek.map((fp, i) => ({ i, fp })).filter(({ fp }) => {
                const def = data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase());
                return def?.Hárító === '1';
              });
              const selected = háritók.find(h => h.i === session.aktív_fegyver_bal_index) || háritók[0];
              if (selected && session.aktív_fegyver_bal_index !== selected.i) {
                setSession(s => ({ ...s, aktív_fegyver_bal_index: selected.i }));
              }
              return háritók.length <= 1
                ? <select className="aktiv-field-select" disabled><option>{selected?.fp.alap ?? 'Hárítófegyver'}</option></select>
                : <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => setSession(s => ({ ...s, aktív_fegyver_bal_index: parseInt(e.target.value) }))}>
                    {háritók.map(h => <option key={h.i} value={h.i}>{h.fp.alap}</option>)}
                  </select>;
            })() : (
              <select className="aktiv-field-select" value={session.aktív_fegyver_bal_index} onChange={e => {
                const idx = parseInt(e.target.value);
                setSession(s => ({ ...s, aktív_fegyver_bal_index: idx }));
              }}>
                {fegyverOpciók.filter(f => {
                  if (f.idx === -1) return false;
                  if (karakter.fegyverek[f.idx]?.alap.toLowerCase() === 'puszta kéz') return false;
                  const fDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === karakter.fegyverek[f.idx]?.alap.toLowerCase());
                  if (fDef?.Hárító === '1') return false;
                  if (session.aktív_fegyver_index === -1) return true;
                  const jobbFp = karakter.fegyverek[session.aktív_fegyver_index];
                  if (!jobbFp) return true;
                  const jobbDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase());
                  return (parseFloat(fDef?.Pengehossz ?? '0') || 0) + (parseFloat(jobbDef?.Pengehossz ?? '0') || 0) <= data.konstansok.kétkezes_harc_max_pengeméret;
                }).map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
              </select>
            )}
          </div>
          )}
        </div>
        <div className="aktiv-fegyver-row">
          {(() => {
            const toggleForts = data.fortelySummaries.filter(d => d.session_toggle);
            return toggleForts.map(tf => {
              const has = karakter.fortélyok.some(f => f.név === tf.név && f.fok > 0);
              const key = tf.név;
              const active = (session as unknown as Record<string, unknown>)[key.toLowerCase().replace(/ /g, '_')] as boolean ?? false;
              return (
                <div key={key} className={`aktiv-field-btn aktiv-field-toggle ${active && has ? 'on' : ''} ${!has ? 'disabled' : ''}`}
                  onClick={() => { if (has) setSession(s => ({ ...s, [key.toLowerCase().replace(/ /g, '_')]: !active })); }}>
                  <span className="aktiv-field-label">{tf.név.length > 14 ? tf.név.replace('Harci ', 'H. ') : tf.név}</span>
                  <strong>{active && has ? 'Igen' : 'Nem'}</strong>
                </div>
              );
            });
          })()}
          {(() => {
            const opciók = data.konstansok.fegyverfogás_opciók as { id: string; név: string }[];
            const aktív = session.fegyverfogás || 'egyfegyveres';
            const aktívNév = opciók.find(o => o.id === aktív)?.név ?? 'Egyfegyveres';
            const jobbIdx = session.aktív_fegyver_index;
            const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
            const pusztaKéz = !jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz';
            const disabled = pusztaKéz;
            return (
              <div className={`aktiv-field-btn ${disabled ? 'disabled' : ''}`}
                onClick={() => { if (!disabled) setShowFegyverfogás(true); }}>
                <span className="aktiv-field-label">Fegyverfogás</span>
                <strong>{aktívNév}</strong>
              </div>
            );
          })()}
          <div className={`aktiv-field-btn aktiv-field-toggle ${session.aktív_páncél ? 'on' : ''}`}
            onClick={() => { pushUndo(`Páncél: ${!session.aktív_páncél ? "Igen" : "Nem"}`); setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél })); }}>
            <span className="aktiv-field-label">Páncél viselve</span>
            <strong>{session.aktív_páncél ? 'Igen' : 'Nem'}</strong>
          </div>
        </div>
      </div>

      {/* Hatás pool */}
      {(fortélyEmlékeztetők.length > 0 || alapesetekFiltered.length > 0) && (
        <div className="aktiv-hatas-pool">
          {fortélyEmlékeztetők.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Fortély bónuszok</span>
              <div className="hatas-pool-items">
                {fortélyEmlékeztetők.map((fe, i) => (
                  <span key={i} className="hatas-pool-item"><strong className="fortely-nev">{fe.név} ({fe.fok}):</strong> {fmtCode(fe.hatás)}</span>
                ))}
              </div>
            </div>
          )}
          {alapesetekFiltered.length > 0 && (
            <details className="hatas-pool-section">
              <summary className="hatas-pool-title" style={{ cursor: 'pointer' }}>Alapesetek ({alapesetekFiltered.length}) ▾</summary>
              <div className="hatas-pool-items">
                {alapesetekFiltered.map((ae, i) => (
                  <span key={i} className="hatas-pool-item"><strong>{ae.fortély_név}:</strong> {fmtCode(ae.hatástext.join(' '))}</span>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Taktikák */}
      <div className="aktiv-section" style={{ fontSize: '13px' }}>
        <span className="aktiv-label">Taktikák <button className="aktiv-add-btn" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '13px' }} disabled={data.taktikak.every(t => session.aktív_taktikák.some(a => a.név === t.név) || !isTaktikaAllowed(t.név))} onClick={() => setShowTaktikaPicker(true)}>+</button></span>
        {session.aktív_taktikák.map((t, i) => {
          const def = data.taktikak.find(d => d.név === t.név);
          const mods: string[] = [];
          if (def?.fokozatos && def.fokok && t.fok != null) {
            const fokDef = def.fokok.find(fk => fk.fok === t.fok);
            if (fokDef) { for (const [k, v] of Object.entries(fokDef)) { if (k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`); } }
          } else if (def?.módosítók) {
            for (const [k, v] of Object.entries(def.módosítók)) { if (typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`); }
          }
          return (
            <div key={i} className="kep-row" style={{ cursor: def?.fokozatos ? 'pointer' : undefined }} onClick={() => { if (def?.fokozatos) { setTaktikaFokválasztó(t.név); setShowTaktikaPicker(true); } }}>
              <span style={{ flex: 1 }}>
                <strong style={{ color: '#90caf9' }}>{t.név}{t.fok != null ? ` (${t.fok})` : ''}:</strong>
                {mods.length > 0 && <span style={{ color: '#66bb6a' }}> {mods.join(', ')} ✔</span>}
                {def?.megjegyzés && <span style={{ opacity: 0.7 }}> • {def.megjegyzés}</span>}
              </span>
              <button className="fort-delete" onClick={e => { e.stopPropagation(); removeTaktika(i); }}>✕</button>
            </div>
          );
        })}
        {taktikaHatásPerElem.map((t, i) => (
          <div key={`th${i}`} className="kep-row" style={{ paddingLeft: '8px', fontSize: '12px', opacity: 0.85 }}>
            <span style={{ flex: 1 }}><strong style={{ color: '#90caf9' }}>{t.név}:</strong> {t.hatások.map((h: any, j) => { const txt = fmtHatás({ operátor: h.hatás ?? h.operátor, cél: h.cél, érték: h.érték, megjegyzés: h.megjegyzés }, eseményNév); return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null; })}</span>
          </div>
        ))}
      </div>

      {showTaktikaPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowTaktikaPicker(false); setTaktikaFokválasztó(null); } }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>{taktikaFokválasztó ? `${taktikaFokválasztó} — fok választó` : 'Taktika választó'}</label>
            </div>
            <div className="aktiv-picker-list">
              {!taktikaFokválasztó && data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név)).sort((a, b) => {
                const pinned = (data.konstansok as any).pinned_taktikák;
                const aPin = pinned.indexOf(a.név);
                const bPin = pinned.indexOf(b.név);
                if (aPin >= 0 && bPin >= 0) return aPin - bPin;
                if (aPin >= 0) return -1;
                if (bPin >= 0) return 1;
                return a.név.localeCompare(b.név, 'hu');
              }).map(t => (
                <div key={t.név} className="aktiv-picker-item" onClick={() => {
                  if (t.fokozatos) {
                    setTaktikaFokválasztó(t.név);
                  } else {
                    addTaktika(t.név);
                    setShowTaktikaPicker(false);
                  }
                }}>
                  <span className="aktiv-picker-item-name">{t.név}{t.fokozatos ? ` 📶` : ''}</span>
                  <span className="aktiv-picker-item-details">
                    {t.fokozatos && t.fokok ? t.fokok.map(f => `${f.fok}: ${Object.entries(f).filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0).map(([k, v]) => `${k}:${v}`).join(', ')}`).join(' | ') : t.módosítók ? Object.entries(t.módosítók).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ') : ''}
                  </span>
                  {t.megjegyzés && <span className="aktiv-picker-item-hatas">{t.megjegyzés}</span>}
                </div>
              ))}
              {taktikaFokválasztó && (() => {
                const def = data.taktikak.find(t => t.név === taktikaFokválasztó);
                if (!def?.fokok) return null;
                const existing = session.aktív_taktikák.findIndex(a => a.név === taktikaFokválasztó);
                return def.fokok.map(f => (
                  <div key={f.fok} className={`aktiv-picker-item ${existing >= 0 && session.aktív_taktikák[existing].fok === f.fok ? 'active' : ''}`} onClick={() => {
                    if (existing >= 0) {
                      setTaktikaFok(existing, f.fok);
                    } else {
                      setSession(s => ({ ...s, aktív_taktikák: [...s.aktív_taktikák, { név: taktikaFokválasztó!, fok: f.fok }] }));
                    }
                    setShowTaktikaPicker(false);
                    setTaktikaFokválasztó(null);
                  }}>
                    <span className="aktiv-picker-item-name">{f.fok}. fok</span>
                    <span className="aktiv-picker-item-details">{Object.entries(f).filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0).map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ')}</span>
                    {f.hatások && f.hatások.length > 0 && <span className="aktiv-picker-item-hatas">{f.hatások.map(h => h.megjegyzés || `${h.operátor} ${h.érték ?? ''} ${h.cél}`).join(', ')}</span>}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Harci helyzetek */}
      <div className="aktiv-section" style={{ borderBottom: 'none', fontSize: '13px' }}>
        <span className="aktiv-label">Harci helyzetek <button className="aktiv-add-btn" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '13px' }} disabled={data.harciHelyzetek.every(h => {
          if ((h as any).rejtett) return true;
          if (session.aktív_helyzetek.includes(h.név)) return true;
          for (const ah of session.aktív_helyzetek) {
            const ahDef = data.harciHelyzetek.find(d => d.név === ah);
            if ((ahDef as any)?.kizár_helyzetek?.includes((h as any).id)) return true;
          }
          return false;
        })} onClick={() => setShowHelyzetPicker(true)}>+</button></span>
        {session.aktív_helyzetek.map((h, i) => {
          const def = data.harciHelyzetek.find(d => d.név === h);
          if (!def) return null;
          const kötöttFortélyok = helyzetFortélyok.get(h) || [];
          const hId = (def as any).feltétel_kulcs?.split(':')[1] || '';
          let alapText = '';
          for (const fd of (data.fortelySummaries as any[])) {
            const f0 = fd.fokok?.find((f: any) => f.fok === 0);
            if (!f0?.hatás?.length) continue;
            const hasFelt = f0.módosítók?.some((m: any) => m.feltétel === `harci_helyzet:${hId}`) || f0.hatás?.join(' ').toLowerCase().includes(h.toLowerCase());
            if (hasFelt) { alapText = f0.hatás.join(' '); break; }
          }
          const infóText = (def.infó || '') + (alapText ? ` Alapeset: ${alapText}` : '');
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="kep-row">
                <span style={{ flex: 1 }}>
                  <strong style={{ color: '#ff9800' }}>{h}:</strong> {fmtCode(infóText)}
                </span>
                <button className="fort-delete" onClick={e => { e.stopPropagation(); pushUndo(`Helyzet−: ${h}`); setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) })); }}>✕</button>
              </div>
              {kötöttFortélyok.map((kf, j) => (
                <div key={j} className="kep-row" style={{ paddingLeft: '12px', color: kf.aktív ? '#66bb6a' : '#888' }}>
                  → {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showHelyzetPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowHelyzetPicker(false); }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>Harci helyzet választó</label>
            </div>
            <div className="aktiv-picker-list">
              {(() => {
                const filtered = data.harciHelyzetek.filter(h => {
                  if ((h as any).rejtett) return false;
                  if (session.aktív_helyzetek.includes(h.név)) return false;
                  for (const ah of session.aktív_helyzetek) {
                    const ahDef = data.harciHelyzetek.find(d => d.név === ah);
                    if ((ahDef as any)?.kizár_helyzetek?.includes((h as any).id)) return false;
                  }
                  return true;
                });
                const groups: { label: string; color: string; items: typeof filtered }[] = [
                  { label: 'Pozitív helyzet', color: '#4caf50', items: filtered.filter(h => (h as any).csoport === 'pozitív') },
                  { label: 'Semleges helyzet', color: '#ff9800', items: filtered.filter(h => (h as any).csoport === 'semleges') },
                  { label: 'Negatív helyzet', color: '#f44336', items: filtered.filter(h => (h as any).csoport === 'negatív') },
                ];
                const renderCard = (h: typeof data.harciHelyzetek[0]) => (
                <div key={h.név} className="aktiv-picker-item" onClick={() => {
                  pushUndo(`Helyzet: ${h.név}`);
                  const hDef = data.harciHelyzetek.find(d => d.név === h.név);
                  setSession(s => {
                    let helyzetek = [...s.aktív_helyzetek, h.név];
                    let taktikák = s.aktív_taktikák;
                    const kizár = (hDef as any)?.kizár_helyzetek ?? [];
                    if (kizár.length) {
                      const kizártNevek = kizár.map((kid: string) => data.harciHelyzetek.find(d => (d as any).id === kid)?.név).filter(Boolean);
                      helyzetek = helyzetek.filter(hh => !kizártNevek.includes(hh));
                    }
                    if ((hDef as any)?.tiltja_taktikákat) taktikák = [];
                    return { ...s, aktív_helyzetek: helyzetek, aktív_taktikák: taktikák };
                  });
                  setShowHelyzetPicker(false);
                }}>
                  <span className="aktiv-picker-item-name">{h.név}</span>
                  <span className="aktiv-picker-item-hatas">{fmtCode(h.infó)}</span>
                </div>);
                return (<>
                  {groups.flatMap(g => g.items.length > 0 ? [
                    <div key={g.label} className="aktiv-picker-group-label" style={{ color: g.color }}>{g.label}</div>,
                    ...g.items.sort((a, b) => a.név.localeCompare(b.név, 'hu')).map(renderCard)
                  ] : [])}
                </>);
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Manőver */}
      <div className="aktiv-section">
        <span className="aktiv-label">Manőver <button className="aktiv-add-btn" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '13px', visibility: session.aktív_manőver ? 'hidden' : undefined }} onClick={() => setShowManőverPicker(true)}>+</button></span>
        {session.aktív_manőver && (() => {
          const m = data.manoverek.find(d => d.név === session.aktív_manőver);
          if (!m) return null;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="aktiv-field-btn">
                <strong style={{ color: 'var(--success)', fontSize: '14px' }}>{session.aktív_manőver}</strong>
                <span className="taktika-chip-mods">Nehézség: {m.nehézség} • {m.fázisok}</span>
                <span className="taktika-chip-mods">{m.hatás}</span>
              </div>
              <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_manőver: '' }))}>✕</button>
            </div>
          );
        })()}
        {manőverBónuszok.map((mb, i) => (
          <div key={`mb${i}`} className="kep-row" style={{ paddingLeft: '8px', fontSize: '12px', opacity: 0.85 }}>
            <span style={{ flex: 1, color: '#66bb6a' }}>{data.manoverek.find(m => m.id === mb.manőver)?.név ?? mb.manőver.replace(/_/g, ' ')}: +{mb.érték} ({mb.név})</span>
          </div>
        ))}
      </div>

      {showManőverPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setShowManőverPicker(false); }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>Manőver választó</label>
            </div>
            <div className="aktiv-picker-list">
              {['általános', 'belharcos'].map(tipus => {
                const items = data.manoverek.filter(m => m.típus === tipus);
                if (items.length === 0) return null;
                return (
                  <div key={tipus}>
                    <div className="aktiv-picker-category">{tipus === 'általános' ? 'Általános' : 'Belharci'}</div>
                    {items.map(m => (
                      <div key={m.név} className={`aktiv-picker-item ${session.aktív_manőver === m.név ? 'active' : ''}`} onClick={() => { setSession(s => ({ ...s, aktív_manőver: m.név })); setShowManőverPicker(false); }}>
                        <span className="aktiv-picker-item-name">{m.név}</span>
                        <span className="aktiv-picker-item-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                        <span className="aktiv-picker-item-hatas">{m.hatás}</span>
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
      <div className="aktiv-section" style={{ marginTop: '16px', borderTop: '1px solid #333', borderBottom: 'none', paddingTop: '16px', fontSize: '13px' }}>
        <span className="aktiv-label">Státuszok <button className="aktiv-add-btn" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '13px' }} disabled={data.statuszok.every(s => s.többszörös || session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))} onClick={() => setShowStátuszPicker(true)}>+</button></span>
        {session.aktív_státuszok.map((st, i) => {
          const match = st.match(/^(.+) \((\d+)\)$/);
          const stNév = match?.[1] ?? st;
          const stFok = match ? parseInt(match[2]) : 1;
          const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
          const def = data.statuszok.find(s => s.név === baseName);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === stFok)?.alcím;
          const locked = baseName === 'Sérült';
          const perElem = státuszPerElem.find(s => s.név === stNév || s.név === `${stNév} (${stFok})`);
          return (
            <div key={i} className="kep-row" style={{ cursor: !locked && maxFok > 1 ? 'pointer' : undefined }} onClick={() => {
              if (locked || maxFok <= 1) return;
              const újFok = (stFok % maxFok) + 1;
              setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? `${stNév} (${újFok})` : v) }));
            }}>
              <span style={{ flex: 1 }}>
                <strong style={{ color: '#cd7c6f' }}>{stNév} ({stFok}){alcím ? ` - ${alcím}` : ''}:</strong>
                {perElem && perElem.hatások.length > 0 && <span> {perElem.hatások.map((h, j) => { const txt = fmtHatás(h, eseményNév); return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null; })}</span>}
              </span>
              {!locked && <button className="fort-delete" onClick={e => { e.stopPropagation(); pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`); setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) })); }}>✕</button>}
            </div>
          );
        })}
      </div>

      {showStátuszPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowStátuszPicker(false); setStátuszFokválasztó(null); } }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>{státuszFokválasztó ? `${státuszFokválasztó} — fok választó` : 'Státusz választó'}</label>
            </div>
            <div className="aktiv-picker-list">
              {!státuszFokválasztó && !érzékválasztó && ['fizikai', 'szellemi', 'mágikus']
                .map(kat => {
                  const items = data.statuszok
                    .filter(s => s.kategória === kat && (s.többszörös || !session.aktív_státuszok.some(st => st.startsWith(s.név + ' ('))))
                    .sort((a, b) => a.név.localeCompare(b.név, 'hu'));
                  if (items.length === 0) return null;
                  return (
                    <div key={kat}>
                      <div className="aktiv-picker-category">{kat.charAt(0).toUpperCase() + kat.slice(1)}</div>
                      {items.map(s => {
                        const isAuto = s.név === 'Sérült';
                        return (
                        <div key={s.név} className={`aktiv-picker-item${isAuto ? ' aktiv-picker-disabled' : ''}`} onClick={() => {
                          if (isAuto) return;
                          if (s.többszörös && s.alkategóriák?.length) {
                            setÉrzékválasztó(s.név);
                          } else if (s.fokok.length === 1) {
                            pushUndo(`Státusz: ${s.név} (1)`); setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${s.név} (1)`] }));
                            setShowStátuszPicker(false);
                          } else {
                            setStátuszFokválasztó(s.név);
                          }
                        }}>
                          <span className="aktiv-picker-item-name">{isAuto ? 'Sérült (auto)' : s.név}</span>
                          <span className="aktiv-picker-item-details">{s.fokok.map(f => `${f.fok}. ${f.alcím}`).join(' • ')}</span>
                        </div>
                        );
                      })}
                    </div>
                  );
                })
              }
              {érzékválasztó && !státuszFokválasztó && (() => {
                const def = data.statuszok.find(s => s.név === érzékválasztó);
                const alkategóriák = def?.alkategóriák ?? [];
                return (
                <div>
                  <div className="aktiv-picker-category">Alkategória kiválasztása</div>
                  {alkategóriák.map(é => (
                    <div key={é} className="aktiv-picker-item" onClick={() => { setStátuszFokválasztó(`${érzékválasztó}: ${é}`); setÉrzékválasztó(null); }}>
                      <span className="aktiv-picker-item-name">{é}</span>
                    </div>
                  ))}
                </div>
                );
              })()}
              {státuszFokválasztó && (() => {
                const baseName = státuszFokválasztó.includes(': ') ? státuszFokválasztó.split(': ')[0] : státuszFokválasztó;
                const def = data.statuszok.find(s => s.név === baseName);
                if (!def) return null;
                return def.fokok.map(f => (
                  <div key={f.fok} className="aktiv-picker-item" onClick={() => {
                    setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${státuszFokválasztó} (${f.fok})`] }));
                    setShowStátuszPicker(false);
                    setStátuszFokválasztó(null);
                  }}>
                    <span className="aktiv-picker-item-name">{f.alcím} ({f.fok})</span>
                    <span className="aktiv-picker-item-hatas">{f.hatások.slice(0, 4).map(h => {
                      if (typeof h === 'string') return h;
                      const célNév = data.esemenyek.find(e => e.id === h.cél)?.név ?? h.cél;
                      if (h.operátor === 'hátrány') return `Hátrány${h.érték} ${célNév}`;
                      if (h.operátor === 'előny') return `Előny+${h.érték} ${célNév}`;
                      if (h.operátor === 'letilt') return `❌ ${célNév}`;
                      if (h.operátor === 'max_limit') return `Max ${h.érték} ${célNév}`;
                      if (h.operátor === 'arányos') return `${célNév} ×${h.érték}`;
                      if (h.operátor === 'szöveges') return h.megjegyzés || célNév;
                      return `${célNév}: ${h.operátor}`;
                    }).join('; ')}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Narratív módosítók */}
      <div className="aktiv-section" style={{ fontSize: '13px' }}>
        <span className="aktiv-label">Narratív módosítók <button className="aktiv-add-btn" style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '13px' }} onClick={() => { setNarrativÉrték(undefined); setNarrativPopup(true); }}>+</button></span>
        {session.narratív_módosítók.map((nm, i) => (
          <div key={i} className="kep-row">
            <span style={{ flex: 1 }}>
              <strong style={{ color: (nm.érték ?? 0) > 0 ? '#66bb6a' : '#e53935' }}>{nm.szöveg}:</strong>
              <span> {nm.érték != null ? (nm.érték > 0 ? `Előny+${nm.érték}` : `Hátrány${nm.érték}`) : ''}</span>
            </span>
            <button className="fort-delete" onClick={e => { e.stopPropagation(); pushUndo(`Narratív−: ${nm.szöveg}`); setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) })); }}>✕</button>
          </div>
        ))}
      </div>
      {narrativPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if (e.target === e.currentTarget) setNarrativPopup(false); }}>
          <div className="kep-prompt" style={{ gap: '12px', minWidth: '260px' }}>
            <label style={{ fontWeight: 'bold' }}>Narratív módosító</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[{ v: -2, l: 'Hátrány-2' }, { v: -1, l: 'Hátrány-1' }, { v: 1, l: 'Előny+1' }, { v: 2, l: 'Előny+2' }].map(b => {
                const sel = narrativÉrték === b.v;
                const color = b.v > 0 ? '#4caf50' : 'var(--accent)';
                return (
                  <button key={b.v} onClick={() => setNarrativÉrték(b.v)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: `2px solid ${sel ? color : 'rgba(255,255,255,0.3)'}`, background: sel ? color : 'var(--surface)', color: sel ? '#fff' : 'var(--text)', fontWeight: 'bold', cursor: 'pointer' }}>
                    {b.l}
                  </button>
                );
              })}
            </div>
            <input className="narrativ-input" placeholder="Leírás..." id="narrativ-popup-text" maxLength={40} style={{ width: '100%' }} onKeyDown={e => { if (e.key === 'Enter' && narrativÉrték !== undefined) { const textEl = e.target as HTMLInputElement; const szöveg = textEl.value.trim(); if (!szöveg) return; setSession(s => ({ ...s, narratív_módosítók: [...s.narratív_módosítók, { szöveg, érték: narrativÉrték }] })); setNarrativPopup(false); setNarrativÉrték(undefined); } }} />
            <button className="narrativ-add-btn" style={{ alignSelf: 'center', padding: '8px 24px' }} disabled={narrativÉrték === undefined} onClick={() => {
              const textEl = document.getElementById('narrativ-popup-text') as HTMLInputElement;
              const szöveg = textEl.value.trim();
              if (!szöveg) return;
              pushUndo(`Narratív: ${szöveg}`); setSession(s => ({ ...s, narratív_módosítók: [...s.narratív_módosítók, { szöveg, érték: narrativÉrték }] }));
              setNarrativPopup(false);
              setNarrativÉrték(undefined);
            }}>OK</button>
          </div>
        </div>,
        document.body
      )}

      {showFegyverfogás && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if (e.target === e.currentTarget) setShowFegyverfogás(false); }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>Fegyverfogás</label>
            </div>
            <div className="aktiv-picker-list">
              {(data.konstansok.fegyverfogás_opciók as { id: string; név: string }[]).map(opt => {
                const jobbIdx = session.aktív_fegyver_index;
                const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
                const jobbDef = jobbFp ? data.fegyverek.find(f => f.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase()) : null;
                const kétkezes_fegyver = jobbDef?.['Forgatás módja'] === 'kétkezes';
                let disabled = false;
                if (opt.id === 'fegyver_pajzs' && !karakter.pajzs?.méret) disabled = true;
                if (opt.id === 'fegyver_hárító') {
                  const hasHáritó = karakter.fegyverek.some(fp => {
                    const def = data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase());
                    return def?.['Hárító'] === '1';
                  });
                  const hasFortély = karakter.fortélyok.some(f => f.név === 'Hárítófegyver használat' && f.fok > 0);
                  if (!hasHáritó || !hasFortély) disabled = true;
                }
                if (opt.id === 'kétkezes') {
                  if (kétkezes_fegyver) disabled = true;
                  if (karakter.fegyverek.length < 2) disabled = true;
                  // Puszta kéz nem használható kétkezes harcban
                  const jobbPuszta = !jobbFp || jobbFp.alap.toLowerCase() === 'puszta kéz';
                  if (jobbPuszta) disabled = true;
                  // Nem lehet hárítófegyverrel kétkezes harcot végezni
                  const nemHáritóFegyverek = karakter.fegyverek.filter((fp, i) => {
                    if (i === jobbIdx) return false;
                    const def = data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase());
                    return def?.Hárító !== '1';
                  });
                  if (nemHáritóFegyverek.length === 0) disabled = true;
                }
                if (kétkezes_fegyver && opt.id !== 'egyfegyveres') disabled = true;
                const active = session.fegyverfogás === opt.id;
                return (
                  <div key={opt.id} className={`aktiv-picker-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`}
                    style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : active ? { borderColor: 'var(--accent)' } : undefined}
                    onClick={() => {
                      if (disabled) return;
                      pushUndo(`Fogás: ${opt.név}`);
                      const patch: Partial<typeof session> = { fegyverfogás: opt.id as typeof session.fegyverfogás };
                      if (opt.id === 'egyfegyveres') { patch.kétkezes_harc = false; patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1; }
                      if (opt.id === 'fegyver_pajzs') { patch.kétkezes_harc = false; patch.aktív_pajzs = true; patch.aktív_fegyver_bal_index = -1; }
                      if (opt.id === 'fegyver_hárító') { patch.kétkezes_harc = false; patch.aktív_pajzs = false; patch.aktív_fegyver_bal_index = -1; }
                      if (opt.id === 'kétkezes') {
                        patch.kétkezes_harc = true; patch.aktív_pajzs = false;
                        // Ha nincs bal kéz fegyver, legkisebb pengéjűt választjuk
                        if (session.aktív_fegyver_bal_index === -1) {
                          const eligible = karakter.fegyverek.map((fp, i) => ({ i, penge: parseFloat(data.fegyverek.find(d => d.Fegyver.toLowerCase() === fp.alap.toLowerCase())?.Pengehossz ?? '99') || 99 }))
                            .filter(e => e.i !== session.aktív_fegyver_index)
                            .sort((a, b) => a.penge - b.penge);
                          if (eligible.length > 0) patch.aktív_fegyver_bal_index = eligible[0].i;
                        }
                      }
                      setSession(s => ({ ...s, ...patch }));
                      setShowFegyverfogás(false);
                    }}>
                    <span className="aktiv-picker-item-name">{opt.név}</span>
                    {disabled && opt.id === 'fegyver_hárító' && <span style={{ fontSize: '11px', color: '#888' }}>Vegyél fel legalább 1 hárítófegyvert és a Hárítófegyver használat fortélyt.</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
