import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
import './TavharcScreen.css';

export function TavharcScreen({ data, karakter, session, setSession, setKarakter, gameMode }: {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  gameMode: boolean;
}) {
  const k = karakter;
  const konstansok = data.konstansok;
  const szorzok = data.tavharcSzorzok;

  // "Alkalmatlan fegyver hajítása" fortélyból automatikus fegyverek
  const alkalmatlanFortélyok = k.fortélyok.filter(f => f.név === 'Alkalmatlan fegyver hajítása' && f.spec_elem);
  const alkalmatlanNevek = alkalmatlanFortélyok.map(f => f.spec_elem);
  const alkalmatlanDef = data.tavfegyverek.find(d => d.Fegyver.startsWith('🔆'));

  // "Alkalmatlan tárgyak hajítása" fortély → "Alkalmi tárgy" virtuális fegyver
  const alkalmiTárgyFortély = k.fortélyok.find(f => f.név === 'Alkalmatlan tárgyak hajítása');
  const alkalmiTárgyNév = alkalmiTárgyFortély ? 'Alkalmi tárgy' : null;
  // 2. foknál Osztó = 2
  const alkalmiTárgyDef = alkalmatlanDef && alkalmiTárgyFortély
    ? { ...alkalmatlanDef, Osztó: alkalmiTárgyFortély.fok >= 2 ? '2' : '1' }
    : undefined;

  // Aktív távfegyver
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];
  const alkalmatlanStartIdx = k.távfegyverek.length;
  const alkalmiTárgyIdx = alkalmatlanStartIdx + alkalmatlanNevek.length;
  const isAlkalmatlan = !tfPeldany && tfIdx >= alkalmatlanStartIdx && tfIdx < alkalmiTárgyIdx;
  const isAlkalmiTárgy = !tfPeldany && tfIdx === alkalmiTárgyIdx && alkalmiTárgyDef;
  const tfDef = tfPeldany
    ? data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tfPeldany.alap.toLowerCase())
    : isAlkalmatlan ? alkalmatlanDef
    : isAlkalmiTárgy ? alkalmiTárgyDef
    : undefined;

  // MF fok
  const getMfFok = (alap: string) => k.fortélyok.find(f => f.név === 'Mesterfegyver' && f.spec_elem === alap)?.fok ?? 0;
  const mfKövetelményHiba = (alap: string): boolean => {
    const fok = getMfFok(alap);
    if (fok === 0) return false;
    const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
    const fokDef = mfDef?.fokok.find(f => f.fok === fok);
    if (!fokDef?.követelmények?.length) return false;
    for (const kov of fokDef.követelmények) {
      if (kov.típus === 'képzettség') {
        const nevek = Array.isArray(kov.név) ? kov.név : [kov.név];
        if (!nevek.some(n => (k.képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték)) return true;
      }
    }
    return false;
  };
  const mfFok = tfPeldany ? getMfFok(tfPeldany.alap) : 0;
  const mfBónusz = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok);

  // Idea
  const [idea, setIdea] = useState(0);

  // Harcmodor szint
  const harcmodorNév = tfDef?.Harcmodor ?? 'Hajítás';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const harcmodorBónusz = data.harcmodorBonusz.find(b => b.szint === harcmodorSzint);
  const harcmodorCÉ = harcmodorBónusz?.CÉ ?? -9;

  // CÉ
  const céAlap = konstansok.harcérték_alap.CÉ;
  const önuralom = k.tulajdonságok.önuralom ?? 0;
  const fegyverCÉ = parseInt(tfDef?.CÉ ?? '0') || 0;
  const mfCÉ = mfBónusz?.CÉ ?? 0;

  // Feltételes fortély CÉ bónusz (pl. Célzás + Kitartott célzás)
  const aktívFeltételek = new Set<string>();
  for (const h of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === h);
    if (def) aktívFeltételek.add((def as any).feltétel_kulcs);
  }
  let fortélyCÉ = 0;
  for (const def of data.fortelySummaries) {
    const karakterFok = k.fortélyok.find(f => f.név === def.név)?.fok ?? 0;
    // 0.fok (kiérdemelt): mindig aktív; magasabb fokok: csak ha a karakter felvette
    const effFok = Math.max(0, karakterFok);
    const fokDef = def.fokok.find(f => f.fok === effFok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.cél === 'CÉ' && mod.feltétel && aktívFeltételek.has(mod.feltétel)) {
        fortélyCÉ += mod.érték;
      }
    }
  }

  const cé = céAlap + önuralom + k.CM + harcmodorCÉ + fegyverCÉ + mfCÉ + idea + fortélyCÉ;

  // Harckeret / Támadás db
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const harckeret = harcmodorSzint + gyorsaság;
  const sebességStr = tfDef?.Sebesség ?? '-1';
  const sebesség = parseInt(sebességStr) || -1;

  let támadásLabel = '—';
  if (sebesség <= 0) {
    támadásLabel = '1x';
  } else if (harckeret <= 0) {
    támadásLabel = '—';
  } else if (harckeret >= sebesség) {
    támadásLabel = `${Math.floor(harckeret / sebesség)}x`;
  } else {
    támadásLabel = `1/${Math.ceil(sebesség / harckeret)} kör`;
  }

  // Távolság
  const [távolság, setTávolság] = useState(10);
  const osztó = parseInt(tfDef?.Osztó ?? '1') || 1;
  const cella = Math.ceil(távolság / osztó);

  // Szorzó pickerek state
  const [célMozgásId, setCélMozgásId] = useState(szorzok.célpont_mozgás[0]?.id ?? 1);
  const [lövészMozgásId, setLövészMozgásId] = useState(szorzok.lövész_mozgás[0]?.id ?? 1);
  const [méretId, setMéretId] = useState(szorzok.célpont_méret.find(m => m.szorzó === 0)?.id ?? 4);
  const [észlelhetőségId, setÉszlelhetőségId] = useState(szorzok.észlelhetőség[0]?.id ?? 0);
  const [szélId, setSzélId] = useState(szorzok.szél[0]?.id ?? 0);

  const getSzorzó = (list: typeof szorzok.célpont_mozgás, id: number) => list.find(e => e.id === id)?.szorzó ?? 0;
  const szorzóÖsszeg = getSzorzó(szorzok.célpont_mozgás, célMozgásId)
    + getSzorzó(szorzok.lövész_mozgás, lövészMozgásId)
    + getSzorzó(szorzok.célpont_méret, méretId)
    + getSzorzó(szorzok.észlelhetőség, észlelhetőségId)
    + getSzorzó(szorzok.szél, szélId);

  // VÉ
  const vé = szorzóÖsszeg >= 1 ? szorzóÖsszeg * cella : cella - Math.abs(szorzóÖsszeg);

  // --- Fegyver kezelés ---
  function addTávfegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const távfegyverek = [...prev.távfegyverek, { alap }];
      const session = { ...prev.session, aktív_távfegyver_index: távfegyverek.length - 1 };
      return { ...prev, távfegyverek, session };
    });
  }

  function removeTávfegyver(idx: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.távfegyverek[idx];
      const távfegyverek = prev.távfegyverek.filter((_, i) => i !== idx);
      const fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && f.spec_elem === removed.alap));
      const session = { ...prev.session };
      if (session.aktív_távfegyver_index >= távfegyverek.length) session.aktív_távfegyver_index = Math.max(0, távfegyverek.length - 1);
      if (távfegyverek.length === 0) session.aktív_távfegyver_index = -1;
      return { ...prev, távfegyverek, fortélyok, session };
    });
  }

  function setMfFok(alap: string, fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && f.spec_elem === alap));
      if (fok > 0) fortélyok = [...fortélyok, { név: 'Mesterfegyver', fok, spec_típus: 'fegyver', spec_elem: alap }];
      return { ...prev, fortélyok };
    });
  }

  // Dropdown: felvehető távfegyverek (még nem felvettek)
  const felvett = new Set(k.távfegyverek.map(tf => tf.alap.toLowerCase()));
  const felvehető = data.tavfegyverek.filter(d => !felvett.has(d.Fegyver.toLowerCase()) && !d.Fegyver.startsWith('🔆'));

  // Virtuális fegyver lista (távfegyverek + alkalmatlanok + alkalmi tárgy)
  const összesFegyver = [
    ...k.távfegyverek.map(tf => ({ alap: tf.alap, locked: false })),
    ...alkalmatlanNevek.map(név => ({ alap: név, locked: true })),
    ...(alkalmiTárgyNév ? [{ alap: alkalmiTárgyNév, locked: true }] : []),
  ];

  // MF popup
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  // Idea popup
  const [ideaPopup, setIdeaPopup] = useState(false);
  // Távolság popup
  const [távolságPopup, setTávolságPopup] = useState(false);

  return (
    <div className="screen tavharc-screen">
      {/* Fegyver lista (szerkesztő módban kezelhető) */}
      {!gameMode && (
        <section className="th-section">
          <h3>Távfegyverek</h3>
          {k.távfegyverek.map((tf, i) => {
            const def = data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tf.alap.toLowerCase());
            const hmNév = def?.Harcmodor ?? 'Hajítás';
            const hmSzint = k.képzettségek.find(kp => kp.név === hmNév)?.szint ?? 0;
            const hmCÉ = data.harcmodorBonusz.find(b => b.szint === hmSzint)?.CÉ ?? -9;
            const fCÉ = parseInt(def?.CÉ ?? '0') || 0;
            const mf = getMfFok(tf.alap);
            const mfC = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mf)?.CÉ ?? 0;
            const cardCÉ = céAlap + önuralom + k.CM + hmCÉ + fCÉ + mfC + idea + fortélyCÉ;
            const seb = parseInt(def?.Sebesség ?? '-1') || -1;
            const hk = hmSzint + gyorsaság;
            let tám = '—';
            if (seb <= 0) tám = '1x';
            else if (hk <= 0) tám = '—';
            else if (hk >= seb) tám = `${Math.floor(hk / seb)}x`;
            else tám = `1/${Math.ceil(seb / hk)} kör`;
            return (
            <div key={i} className={`th-card${i === tfIdx ? ' th-card-active' : ''}`} onClick={() => setSession(s => ({ ...s, aktív_távfegyver_index: i }))}>
              <div className="th-card-header">
                <strong>{tf.alap}</strong>
                <button className="fort-delete" onClick={e => { e.stopPropagation(); setDeleteTarget(i); }}>✕</button>
              </div>
              <div className="th-card-fields">
                <button className="he-field-btn he-field-fortely" style={mfKövetelményHiba(tf.alap) ? { color: '#e53935' } : undefined} onClick={e => { e.stopPropagation(); setMfTarget(i); }}>MF fok: <strong>{mf}</strong></button>
                <button className="he-field-btn" onClick={e => { e.stopPropagation(); setIdeaPopup(true); }}>Idea: <strong>{idea >= 0 ? '+' : ''}{idea}</strong></button>
                <span className="th-badge">CÉ: {cardCÉ}  ({tám})</span>
              </div>
            </div>
            );
          })}
          <select className="he-add-select" value="" onChange={e => { if (e.target.value) addTávfegyver(e.target.value); }}>
            <option value="">+ Új távfegyver...</option>
            {felvehető.map(f => <option key={f.Fegyver} value={f.Fegyver}>{f.Fegyver}</option>)}
          </select>
          {(alkalmatlanNevek.length > 0 || alkalmiTárgyNév) && (
            <>
              <h3 style={{ marginTop: '12px' }}>Hajítható fegyverek (fortélyból)</h3>
              {alkalmatlanNevek.map((név, i) => (
                <div key={`alk-${i}`} className="th-card" style={{ opacity: 0.8 }}>
                  <div className="th-card-header">
                    <strong>🔆 {név}</strong>
                  </div>
                  <div className="th-card-fields">
                    <span className="th-badge">CÉ: 0, Osztó: 1</span>
                  </div>
                </div>
              ))}
              {alkalmiTárgyNév && (
                <div className="th-card" style={{ opacity: 0.8 }}>
                  <div className="th-card-header">
                    <strong>🔆 {alkalmiTárgyNév}</strong>
                  </div>
                  <div className="th-card-fields">
                    <span className="th-badge">CÉ: 0, Osztó: {alkalmiTárgyFortély!.fok >= 2 ? 2 : 1}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Game mód: csak aktív fegyver kijelzés */}
      {gameMode && összesFegyver.length > 0 && (
        <div className="th-row th-controls">
          <select className="th-select" value={tfIdx} onChange={e => setSession(s => ({ ...s, aktív_távfegyver_index: parseInt(e.target.value) }))}>
            {összesFegyver.map((tf, i) => <option key={i} value={i}>{tf.locked ? '🔆 ' : ''}{tf.alap}</option>)}
          </select>
          <span className="th-badge">MF: {mfFok}</span>
          <span className="th-badge">Idea: {idea >= 0 ? '+' : ''}{idea}</span>
        </div>
      )}

      {/* Kalkulátor — csak game módban, ha van fegyver */}
      {tfDef && gameMode && (
        <>
          {/* CÉ + VÉ + Szorzó×Cella + Távolság */}
          <div className="th-main-row">
            <div className="th-value-main th-ce-ve-box">
              <span>CÉ: {cé}  ({támadásLabel})</span>
              <span style={{ color: vé - cé > 20 ? '#e53935' : '#ffa726' }}>VÉ: {vé}</span>
            </div>
            <span className="th-value-main th-szc-box">Szorzó × Cella<br/><span style={{ fontSize: '18px' }}>{szorzóÖsszeg} × {cella}</span></span>
            <button className="th-value-main th-tav-btn" style={{ borderColor: 'var(--success)' }} onClick={() => setTávolságPopup(true)}>Táv:<br/><span style={{ fontSize: '18px', color: 'var(--success)' }}>{távolság}m</span></button>
          </div>

          {/* Szorzó pickerek */}
          <div className="th-szorzo-grid">
            <SzorzóPicker label="Cél mozgása" list={szorzok.célpont_mozgás} activeId={célMozgásId} onSelect={setCélMozgásId} />
            <SzorzóPicker label="Lövész mozgás" list={szorzok.lövész_mozgás} activeId={lövészMozgásId} onSelect={setLövészMozgásId} />
            <SzorzóPicker label="Méret" list={szorzok.célpont_méret} activeId={méretId} onSelect={setMéretId} />
            <SzorzóPicker label="Észlelhetőség" list={szorzok.észlelhetőség} activeId={észlelhetőségId} onSelect={setÉszlelhetőségId} />
            <SzorzóPicker label="Szél ereje" list={szorzok.szél} activeId={szélId} onSelect={setSzélId} />
          </div>
        </>
      )}

      {!tfDef && összesFegyver.length === 0 && gameMode && (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Nincs távfegyver felvéve</p>
      )}

      {/* MF popup */}
      {mfTarget !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setMfTarget(null); }}>
          <div className="kep-prompt">
            <h4>Mesterfegyver fok — {k.távfegyverek[mfTarget]?.alap}</h4>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {[0, 1, 2, 3].map(f => (
                <button key={f} className={`fort-fok-btn${getMfFok(k.távfegyverek[mfTarget]?.alap) === f ? ' active' : ''}`}
                  onClick={() => { setMfFok(k.távfegyverek[mfTarget]!.alap, f); setMfTarget(null); }}>{f}</button>
              ))}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Delete confirm */}
      {deleteTarget !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setDeleteTarget(null); }}>
          <div className="kep-prompt" style={{ textAlign: 'center' }}>
            <p><strong>{k.távfegyverek[deleteTarget]?.alap}</strong></p>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { removeTávfegyver(deleteTarget); setDeleteTarget(null); }}>Távfegyver törlése</button>
          </div>
        </div>
      , document.body)}

      {/* Idea popup */}
      {ideaPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setIdeaPopup(false); }}>
          <div className="kep-prompt">
            <label>Idea érték</label>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[-5, -4, -3, -2, -1].map(n => <button key={n} className={`fort-fok-btn${idea === n ? ' active' : ''}`} style={{ width: '36px', height: '36px', fontSize: '13px' }} onClick={() => { setIdea(n); setIdeaPopup(false); }}>{n}</button>)}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className={`fort-fok-btn${idea === 0 ? ' active' : ''}`} style={{ width: '36px', height: '36px', fontSize: '13px' }} onClick={() => { setIdea(0); setIdeaPopup(false); }}>0</button>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(n => <button key={n} className={`fort-fok-btn${idea === n ? ' active' : ''}`} style={{ width: '36px', height: '36px', fontSize: '13px' }} onClick={() => { setIdea(n); setIdeaPopup(false); }}>+{n}</button>)}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Távolság popup */}
      {távolságPopup && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setTávolságPopup(false); }}>
          <TávolságPicker value={távolság} osztó={osztó} onChange={setTávolság} />
        </div>
      , document.body)}

      {/* Részletes értékek + CM szerkesztő */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, padding: '10px', border: '1px dashed #666', borderRadius: '6px', fontSize: '12px', color: '#aaa' }}>
          <strong style={{ color: '#e53935' }}>Részletes értékek</strong>
          <div>Fegyver alap CÉ: {fegyverCÉ}</div>
          <div>Fegyver Osztó: {osztó}</div>
          <div>MF CÉ bónusz: {mfCÉ}</div>
          <div>Idea CÉ bónusz: {idea}</div>
          {fortélyCÉ !== 0 && <div>Célzás CÉ bónusz: +{fortélyCÉ}</div>}
          <div>Harcmodor CÉ bónusz: {harcmodorCÉ} ({harcmodorNév} szint:{harcmodorSzint})</div>
          <div>Tulajdonság (Önuralom): {önuralom}</div>
          <div>CM: {k.CM}</div>
          <div>CÉ alap: {céAlap}</div>
          <div><strong>Összesen: {cé}</strong></div>
        </div>
        {!gameMode && (
          <div style={{ padding: '10px', border: '1px solid #444', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#aaa' }}>CM</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="fort-fok-btn" style={{ width: '32px', height: '32px' }} onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.max(0, prev.CM - 1) } : prev)}>−</button>
              <strong style={{ fontSize: '18px' }}>{k.CM}</strong>
              <button className="fort-fok-btn" style={{ width: '32px', height: '32px' }} onClick={() => setKarakter(prev => prev ? { ...prev, CM: Math.min(prev.CM + 1, prev.tsz * (konstansok.arányok.max_cm_perszint ?? 2)) } : prev)}>+</button>
            </div>
            <span style={{ fontSize: '11px', color: '#888' }}>max: {k.tsz * (konstansok.arányok.max_cm_perszint ?? 2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SzorzóPicker({ label, list, activeId, onSelect }: {
  label: string;
  list: { id: number; leírás: string; szorzó: number }[];
  activeId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="th-picker">
      <div className="th-picker-label">{label}</div>
      {list.map(item => (
        <div
          key={item.id}
          className={`th-picker-item${item.id === activeId ? ' th-picker-active' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          {item.szorzó}×: {item.leírás}
        </div>
      ))}
    </div>
  );
}

function TávolságPicker({ value, osztó, onChange }: { value: number; osztó: number; onChange: (v: number) => void }) {
  const [val, setVal] = useState(value);
  const holdRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });
  const cellaVal = Math.ceil(val / osztó);

  function startHold(dir: 1 | -1) {
    holdRef.current.active = true;
    let delay = 200;
    function tick() {
      if (!holdRef.current.active) return;
      setVal(v => { const nv = Math.max(1, Math.min(500, v + dir)); onChange(nv); return nv; });
      delay = Math.max(50, delay * 0.85);
      holdRef.current.timer = setTimeout(tick, delay);
    }
    holdRef.current.timer = setTimeout(tick, delay);
  }
  function stopHold() {
    holdRef.current.active = false;
    if (holdRef.current.timer) { clearTimeout(holdRef.current.timer); holdRef.current.timer = null; }
  }

  return (
    <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px', padding: '16px', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Távolság (méter)</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => { setVal(v => { const nv = Math.max(1, v - 1); onChange(nv); return nv; }); }}
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}>−</button>
        <strong style={{ fontSize: '28px', minWidth: '60px', textAlign: 'center' }}>{val}m</strong>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => { setVal(v => { const nv = Math.min(500, v + 1); onChange(nv); return nv; }); }}
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}>+</button>
      </div>
      <span style={{ fontSize: '18px', color: '#888' }}>(cella: {cellaVal})</span>
    </div>
  );
}
