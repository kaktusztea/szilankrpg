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
              const KATEGÓRIA_HARCMODOR: Record<string, string> = { közelharci: 'Közelharc', kardvívó: 'Kardvívás', romboló: 'Rombolás', lándzsavívó: 'Lándzsavívás', ostorharc: 'Ostorharc' };
              if (fd && KATEGÓRIA_HARCMODOR[fd.Kategória] === mk.érték) return false;
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

  return (
    <div className="screen aktiv-screen">
      <h2>❎ Aktív</h2>

      {/* Szilánk */}
      <div className="aktiv-row">
        <span className="aktiv-label">Szilánk</span>
        <span className="aktiv-value">{session.szilánk}</span>
      </div>

      {/* Aktív fegyver */}
      <div className="aktiv-row">
        <span className="aktiv-label">Fegyver</span>
        <select className="aktiv-select" value={session.aktív_fegyver_index} onChange={e => setSession(s => ({ ...s, aktív_fegyver_index: parseInt(e.target.value) }))}>
          {fegyverOpciók.map(f => <option key={f.idx} value={f.idx}>{f.név}</option>)}
        </select>
      </div>

      {/* Aktív pajzs */}
      <div className="aktiv-row">
        <span className="aktiv-label">Pajzs kézben</span>
        <button className={`aktiv-toggle ${session.aktív_pajzs ? 'on' : ''}`} onClick={() => setSession(s => ({ ...s, aktív_pajzs: !s.aktív_pajzs }))}>{session.aktív_pajzs ? 'Igen' : 'Nem'}</button>
      </div>

      {/* Aktív páncél */}
      <div className="aktiv-row">
        <span className="aktiv-label">Páncél viselve</span>
        <button className={`aktiv-toggle ${session.aktív_páncél ? 'on' : ''}`} onClick={() => setSession(s => ({ ...s, aktív_páncél: !s.aktív_páncél }))}>{session.aktív_páncél ? 'Igen' : 'Nem'}</button>
      </div>

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
        <select className="aktiv-select" value="" onChange={e => { if (e.target.value) { addTaktika(e.target.value); } }}>
          <option value="">+ Taktika...</option>
          {data.taktikak.filter(t => !session.aktív_taktikák.some(a => a.név === t.név) && isTaktikaAllowed(t.név)).map(t => (
            <option key={t.név} value={t.név}>{t.név}</option>
          ))}
        </select>
      </div>

      {/* Harci helyzetek */}
      <div className="aktiv-section">
        <span className="aktiv-label">Harci helyzetek</span>
        {session.aktív_helyzetek.map((h, i) => (
          <div key={i} className="aktiv-chip">
            <span>{h}</span>
            <button className="aktiv-chip-x" onClick={() => setSession(s => ({ ...s, aktív_helyzetek: s.aktív_helyzetek.filter((_, j) => j !== i) }))}>✕</button>
          </div>
        ))}
        <select className="aktiv-select" value="" onChange={e => { if (e.target.value) setSession(s => ({ ...s, aktív_helyzetek: [...s.aktív_helyzetek, e.target.value] })); }}>
          <option value="">+ Helyzet...</option>
          {data.harciHelyzetek.filter(h => !session.aktív_helyzetek.includes(h.név)).map(h => (
            <option key={h.név} value={h.név}>{h.név}</option>
          ))}
        </select>
      </div>

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
          {data.szituaciok.filter(s2 => !session.aktív_szituációk.includes(s2.név)).map(s2 => (
            <option key={s2.név} value={s2.név}>{s2.név}</option>
          ))}
        </select>
      </div>

      {/* Manőver */}
      <div className="aktiv-row">
        <span className="aktiv-label">Manőver</span>
        <select className="aktiv-select" value={session.aktív_manőver} onChange={e => setSession(s => ({ ...s, aktív_manőver: e.target.value }))}>
          <option value="">— nincs —</option>
          {data.manoverek.map(m => <option key={m.név} value={m.név}>{m.név} ({m.nehézség})</option>)}
        </select>
      </div>

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
    </div>
  );
}
