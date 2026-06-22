import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, AktívTaktika } from '../engine/types';
import { evaluateAlapesetek } from '../engine/alapeset';
import './AktivScreen.css';

function fmtCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} style={{ fontFamily: 'monospace', background: '#333', padding: '0 3px', borderRadius: '2px' }}>{p.slice(1, -1)}</code>
    : p
  );
}

function fmtHatás(h: { operátor: string; cél: string; érték?: number; megjegyzés?: string }, eseményNév: (id: string) => string): string | null {
  if (h.operátor === 'szöveges') return h.megjegyzés || null;
  if (h.operátor === 'letilt') return `❌ Letiltva: ${eseményNév(h.cél)}`;
  if (h.operátor === 'előny' || h.operátor === 'hátrány') return `${h.operátor === 'előny' ? 'Előny' : 'Hátrány'}${(h.érték ?? 0) > 0 ? '+' : ''}${h.érték ?? 0}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'duplázás' || h.operátor === 'arányos') return `×${h.érték ?? 1}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'max_limit') return `max ${h.érték}: ${eseményNév(h.cél)}`;
  if (h.operátor === 'enyhít') return `Enyhítés+${h.érték}: ${eseményNév(h.cél)}`;
  return null;
}

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

  // --- Hatás pool kalkuláció ---
  // 1. Taktika harcérték módosítók
  const taktikaMods: Record<string, number> = {};
  const taktikaMegjegyzések: string[] = [];
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
    if (def.megjegyzés) taktikaMegjegyzések.push(`${def.név}: ${def.megjegyzés}`);
  }

  // 2. Státusz + Harci helyzet + Taktika hatások kumulálása
  // Harci helyzetek hatásai saját al-boxban jelennek meg (nem a státuszHatások pool-ban)
  // Státusz hatások per-státusz (nem aggregált)
  const státuszPerElem: { név: string; alcím?: string; hatások: { cél: string; operátor: string; érték?: number; megjegyzés?: string }[] }[] = [];
  for (const st of session.aktív_státuszok) {
    const match = st.match(/^(.+) \((\d+)\)$/);
    if (!match) continue;
    const stNév = match[1];
    const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
    const subName = stNév.includes(': ') ? stNév.split(': ')[1] : '';
    const def = data.statuszok.find(s => s.név === baseName);
    const fokDef = def?.fokok.find(f => f.fok === parseInt(match[2]));
    if (fokDef) {
      const hatások = fokDef.hatások.map(h => subName ? { ...h, cél: `${h.cél} (${subName.toLowerCase()})` } : h);
      státuszPerElem.push({ név: st, alcím: (fokDef as any).alcím, hatások });
    }
  }
  // Taktika hatások per-taktika (operátor-alapúak, pl. duplázás)
  const taktikaHatásPerElem: { név: string; hatások: { cél: string; operátor: string; érték?: number; megjegyzés?: string }[] }[] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef?.hatások?.length) taktikaHatásPerElem.push({ név: `${def.név} (${at.fok})`, hatások: fokDef.hatások });
    }
  }
  const hasHatásPool = státuszPerElem.length > 0 || taktikaHatásPerElem.length > 0;

  const eseményNév = (id: string) => {
    const m = id.match(/^(.+?)( \(.+\))$/);
    if (m) { const base = data.esemenyek.find(e => e.id === m[1])?.név ?? m[1]; return base + m[2]; }
    return data.esemenyek.find(e => e.id === id)?.név ?? id;
  };

  // Fortély emlékeztetők: harci fortélyok amelyeknek van hatástext de nincs gépi módosító
  const fortélyEmlékeztetők: { név: string; fok: number; hatás: string }[] = [];
  const helyzetFortélyok = new Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>();
  const manőverBónuszok: { név: string; manőver: string; érték: number }[] = [];
  const előnyHátrányMods: { név: string; cél: string; mód: string; érték: number }[] = [];

  // Aktív feltételek (§16 feltételes módosítókhoz)
  const aktívFeltételek = new Set<string>();
  aktívFeltételek.add(`fegyverfogás:${session.fegyverfogás}`);
  for (const at of session.aktív_taktikák) { const def = data.taktikak.find(t => t.név === at.név); if (def) aktívFeltételek.add(def.feltétel_kulcs); }
  for (const h of session.aktív_helyzetek) { const def = data.harciHelyzetek.find(d => d.név === h); if (def) aktívFeltételek.add(def.feltétel_kulcs); }

  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def || def.csoport !== 'harci') continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef) continue;
    const hasMods = fokDef.módosítók && Array.isArray(fokDef.módosítók) && fokDef.módosítók.length > 0;
    let helyzetKötés = '';
    if (hasMods) {
      for (const mod of fokDef.módosítók) {
        if (mod.feltétel && mod.feltétel !== '' && !aktívFeltételek.has(mod.feltétel)) continue;
        if (typeof mod.cél === 'string' && mod.cél.startsWith('manőver:')) {
          manőverBónuszok.push({ név: kf.név, manőver: mod.cél.slice(8), érték: mod.érték });
        }
        if (mod.mód === 'előny' || mod.mód === 'hátrány') {
          előnyHátrányMods.push({ név: kf.név, cél: mod.cél, mód: mod.mód, érték: mod.érték });
        }
        if (mod.feltétel && mod.feltétel.startsWith('harci_helyzet:')) {
          helyzetKötés = mod.feltétel.slice(14);
        }
      }
    }
    if (helyzetKötés && def.emlékeztető && fokDef.hatás?.length) {
      const hNév = data.harciHelyzetek.find(d => d.feltétel_kulcs === `harci_helyzet:${helyzetKötés}`)?.név || helyzetKötés;
      const arr = helyzetFortélyok.get(hNév) || [];
      arr.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' '), aktív: aktívFeltételek.has(`harci_helyzet:${helyzetKötés}`) });
      helyzetFortélyok.set(hNév, arr);
    } else if (def.emlékeztető && fokDef.hatás && fokDef.hatás.length > 0) {
      fortélyEmlékeztetők.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' ') });
    }
  }

  // Alapesetek (0.fok) kiértékelés
  const alapesetek = evaluateAlapesetek(data.fortelySummaries as any, karakter, session);

  // Alapesetek helyzet-kötött: ha a módosítónak harci_helyzet feltétele van → helyzet alá
  const alapesetekFiltered = alapesetek.filter(ae => {
    const hFelt = ae.módosítók.find(m => m.feltétel?.startsWith('harci_helyzet:'));
    if (hFelt) {
      const hId = hFelt.feltétel.slice(14);
      const hNév = data.harciHelyzetek.find(d => d.feltétel_kulcs === `harci_helyzet:${hId}`)?.név || hId;
      const arr = helyzetFortélyok.get(hNév) || [];
      arr.push({ név: `⚠ ${ae.fortély_név}`, fok: 0, hatás: ae.hatástext.join(' '), aktív: session.aktív_helyzetek.includes(hNév) });
      helyzetFortélyok.set(hNév, arr);
      return false;
    }
    return true;
  });

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
      {(session.aktív_taktikák.length > 0 || session.aktív_helyzetek.length > 0 || hasHatásPool || fortélyEmlékeztetők.length > 0 || alapesetekFiltered.length > 0 || manőverBónuszok.length > 0 || előnyHátrányMods.length > 0 || session.narratív_módosítók.length > 0) && (
        <div className="aktiv-hatas-pool">
          {session.aktív_taktikák.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Taktikák</span>
              <div className="hatas-pool-items">
                {session.aktív_taktikák.map((at, i) => {
                  const def = data.taktikak.find(t => t.név === at.név);
                  if (!def) return null;
                  const mods: string[] = [];
                  if (def.fokozatos && def.fokok && at.fok != null) {
                    const fokDef = def.fokok.find(f => f.fok === at.fok);
                    if (fokDef) { for (const [k, v] of Object.entries(fokDef)) { if (k !== 'fok' && typeof v === 'number' && v !== 0) mods.push(`${k}: ${v > 0 ? '+' : ''}${v}`); } }
                  } else if (def.módosítók) {
                    for (const [k, v] of Object.entries(def.módosítók)) { if (typeof v === 'number' && v !== 0) mods.push(`${k}: ${v > 0 ? '+' : ''}${v}`); }
                  }
                  return <span key={i} className="hatas-pool-item">
                    <strong style={{ color: '#90caf9' }}>{def.név}{at.fok != null ? ` (${at.fok})` : ''}:</strong>
                    {mods.length > 0 && <span style={{ color: '#66bb6a' }}> {mods.join(', ')} ✔</span>}
                    {def.megjegyzés && <span> {mods.length > 0 ? '• ' : ''}{def.megjegyzés}</span>}
                  </span>;
                })}
              </div>
            </div>
          )}
          {session.aktív_helyzetek.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Harci helyzetek</span>
              <div className="hatas-pool-items">
                {session.aktív_helyzetek.map((h, i) => {
                  const def = data.harciHelyzetek.find(d => d.név === h);
                  if (!def) return null;
                  const kötöttFortélyok = helyzetFortélyok.get(h) || [];
                  // Alapeset 0.fok hatástext keresés: fortély aminek feltétele ez a helyzet
                  const hId = (def as any).feltétel_kulcs?.split(':')[1] || '';
                  let alapText = '';
                  for (const fd of (data.fortelySummaries as any[])) {
                    const f0 = fd.fokok?.find((f: any) => f.fok === 0);
                    if (!f0?.hatás?.length) continue;
                    const hasFelt = f0.módosítók?.some((m: any) => m.feltétel === `harci_helyzet:${hId}`) || f0.hatás?.join(' ').toLowerCase().includes(h.toLowerCase());
                    if (hasFelt) { alapText = f0.hatás.join(' '); break; }
                  }
                  const infóText = (def.infó || '–') + (alapText ? ` Alapeset: ${alapText}` : '');
                  return <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="hatas-pool-item"><strong style={{ color: '#42a5f5' }}>{def.név}:</strong> {fmtCode(infóText)}</span>
                    {kötöttFortélyok.map((kf, j) => (
                      <span key={j} className="hatas-pool-item" style={{ paddingLeft: '12px', color: kf.aktív ? '#66bb6a' : '#888' }}>
                        → {kf.név} ({kf.fok}): {fmtCode(kf.hatás)}{kf.aktív ? ' ✔' : ''}
                      </span>
                    ))}
                  </div>;
                })}
              </div>
            </div>
          )}
          {hasHatásPool && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Státuszok</span>
              <div className="hatas-pool-items">
                {taktikaHatásPerElem.map((t, i) => (
                  <div key={`t${i}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="hatas-pool-item"><strong style={{ color: '#90caf9' }}>{t.név}</strong></span>
                    {t.hatások.map((h, j) => {
                      const txt = fmtHatás(h, eseményNév);
                      return txt ? <span key={j} className="hatas-pool-item" style={{ paddingLeft: '12px' }}>{txt}</span> : null;
                    })}
                  </div>
                ))}
                {státuszPerElem.map((s, i) => (
                  <div key={`s${i}`} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="hatas-pool-item"><strong style={{ color: '#cd7c6f' }}>{s.név}{s.alcím ? ` ${s.alcím}` : ''}</strong></span>
                    {s.hatások.map((h, j) => {
                      const txt = fmtHatás(h, eseményNév);
                      return txt ? <span key={j} className="hatas-pool-item" style={{ paddingLeft: '12px' }}>{txt}</span> : null;
                    })}
                  </div>
                ))}
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
                  <span key={i} className={`hatas-pool-item ${eh.mód === 'előny' ? 'positive' : 'negative'}`}>{eh.mód === 'előny' ? `Előny+${eh.érték}` : `Hátrány${eh.érték}`}: {eh.cél.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())} ({eh.név})</span>
                ))}
              </div>
            </div>
          )}
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
          {session.narratív_módosítók.length > 0 && (
            <div className="hatas-pool-section">
              <span className="hatas-pool-title">Narratív módosítók</span>
              <div className="hatas-pool-items">
                {session.narratív_módosítók.map((nm, i) => (
                  <span key={i} className={`hatas-pool-item ${(nm.érték ?? 0) > 0 ? 'positive' : (nm.érték ?? 0) < 0 ? 'negative' : ''}`}>
                    {nm.szöveg}{nm.érték != null ? ` (${nm.érték > 0 ? 'Előny+' : 'Hátrány'}${nm.érték > 0 ? nm.érték : nm.érték})` : ''}
                    <button className="aktiv-chip-x" onClick={() => { pushUndo(`Narratív−: ${session.narratív_módosítók[i]?.szöveg}`); setSession(s => ({ ...s, narratív_módosítók: s.narratív_módosítók.filter((_, j) => j !== i) })); }}>✕</button>
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
        <button className="aktiv-add-btn" disabled={data.taktikak.every(t => session.aktív_taktikák.some(a => a.név === t.név) || !isTaktikaAllowed(t.név))} onClick={() => setShowTaktikaPicker(true)}>+ Taktika...</button>
      </div>

      {showTaktikaPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowTaktikaPicker(false); setTaktikaFokválasztó(null); } }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>{taktikaFokválasztó ? `${taktikaFokválasztó} — fok választó` : 'Taktika választó'}</label>
            </div>
            <div className="aktiv-picker-list">
              {!taktikaFokválasztó && data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név)).sort((a, b) => {
                const pinned = ['Támadó', 'Védő', 'Teljes Védekezés'];
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

      {/* Manőver */}
      <div className="aktiv-section">
        <span className="aktiv-label">Manőver</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="aktiv-field-btn" onClick={() => setShowManőverPicker(true)}>
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

      {/* Harci helyzetek */}
      <div className="aktiv-section" style={{ borderBottom: 'none' }}>
        <span className="aktiv-label">Harci helyzetek</span>
        {session.aktív_helyzetek.map((h, i) => (
          <div key={i} className="aktiv-chip">
            <span>{h}</span>
            <button className="aktiv-chip-x" onClick={() => { pushUndo(`Helyzet−: ${session.aktív_helyzetek[i]}`); setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) })); }}>✕</button>
          </div>
        ))}
        <button className="aktiv-add-btn" disabled={data.harciHelyzetek.every(h => {
          if ((h as any).rejtett) return true;
          if (session.aktív_helyzetek.includes(h.név)) return true;
          for (const ah of session.aktív_helyzetek) {
            const ahDef = data.harciHelyzetek.find(d => d.név === ah);
            if ((ahDef as any)?.kizár_helyzetek?.includes((h as any).id)) return true;
          }
          return false;
        })} onClick={() => setShowHelyzetPicker(true)}>+ Helyzet...</button>
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

      {/* Státuszok */}
      <div className="aktiv-section" style={{ marginTop: '16px', borderTop: '1px solid #333', borderBottom: 'none', paddingTop: '16px' }}>
        <span className="aktiv-label">Státuszok</span>
        {session.aktív_státuszok.map((st, i) => {
          const match = st.match(/^(.+) \((\d+)\)$/);
          const stNév = match?.[1] ?? st;
          const stFok = match ? parseInt(match[2]) : 1;
          const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
          const def = data.statuszok.find(s => s.név === baseName);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === stFok)?.alcím;
          return (
            <div key={i} className="aktiv-chip">
              <span onClick={() => {
                if (maxFok <= 1) return;
                const újFok = (stFok % maxFok) + 1;
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? `${stNév} (${újFok})` : v) }));
              }} style={maxFok > 1 ? { cursor: 'pointer' } : undefined}>{stNév} ({stFok}){alcím ? ` - ${alcím}` : ''}</span>
              <button className="aktiv-chip-x" onClick={() => { pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`); setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) })); }}>✕</button>
            </div>
          );
        })}
        <button className="aktiv-add-btn" disabled={data.statuszok.every(s => s.többszörös || session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))} onClick={() => setShowStátuszPicker(true)}>+ Státusz...</button>
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
                      {items.map(s => (
                        <div key={s.név} className="aktiv-picker-item" onClick={() => {
                          if (s.többszörös && s.alkategóriák?.length) {
                            setÉrzékválasztó(s.név);
                          } else if (s.fokok.length === 1) {
                            pushUndo(`Státusz: ${s.név} (1)`); setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${s.név} (1)`] }));
                            setShowStátuszPicker(false);
                          } else {
                            setStátuszFokválasztó(s.név);
                          }
                        }}>
                          <span className="aktiv-picker-item-name">{s.név}</span>
                          <span className="aktiv-picker-item-details">{s.fokok.map(f => `${f.fok}. ${f.alcím}`).join(' • ')}</span>
                        </div>
                      ))}
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
      <div className="aktiv-section">
        <span className="aktiv-label">Narratív módosítók</span>
        <button className="narrativ-add-btn" onClick={() => { setNarrativÉrték(undefined); setNarrativPopup(true); }}>+ Új</button>
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
