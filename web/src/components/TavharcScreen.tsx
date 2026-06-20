import { useState } from 'react';
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

  // Aktív távfegyver
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];
  const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;

  // MF fok
  const getMfFok = (alap: string) => k.fortélyok.find(f => f.név === 'Mesterfegyver' && f.spec_elem === alap)?.fok ?? 0;
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
  const cé = céAlap + önuralom + k.CM + harcmodorCÉ + fegyverCÉ + mfCÉ + idea;

  // Harckeret / Támadás db
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const harckeret = harcmodorSzint + gyorsaság;
  const sebességStr = tfDef?.Sebesség ?? '-1';
  const sebesség = parseInt(sebességStr) || -1;

  let támadásLabel = '—';
  if (sebesség <= 0) {
    támadásLabel = '1 / kör';
  } else if (harckeret <= 0) {
    támadásLabel = '—';
  } else if (harckeret >= sebesség) {
    támadásLabel = `${Math.floor(harckeret / sebesség)} / kör`;
  } else {
    támadásLabel = `1 / ${Math.ceil(sebesség / harckeret)} kör`;
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

  // Találati esély
  const találatiEsély = Math.max(0, Math.min(100, Math.round((21 - (vé - cé)) / 20 * 100)));

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

  // MF popup
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  // Idea popup
  const [ideaPopup, setIdeaPopup] = useState(false);

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
            const cardCÉ = céAlap + önuralom + k.CM + hmCÉ + fCÉ + mfC + idea;
            const seb = parseInt(def?.Sebesség ?? '-1') || -1;
            const hk = hmSzint + gyorsaság;
            let tám = '—';
            if (seb <= 0) tám = '1 / kör';
            else if (hk <= 0) tám = '—';
            else if (hk >= seb) tám = `${Math.floor(hk / seb)} / kör`;
            else tám = `1 / ${Math.ceil(seb / hk)} kör`;
            return (
            <div key={i} className={`th-card${i === tfIdx ? ' th-card-active' : ''}`} onClick={() => setSession(s => ({ ...s, aktív_távfegyver_index: i }))}>
              <div className="th-card-header">
                <strong>{tf.alap}</strong>
                <button className="fort-delete" onClick={e => { e.stopPropagation(); setDeleteTarget(i); }}>✕</button>
              </div>
              <div className="th-card-fields">
                <button className="he-field-btn" onClick={e => { e.stopPropagation(); setMfTarget(i); }}>MF: <strong>{mf}</strong></button>
                <button className="he-field-btn" onClick={e => { e.stopPropagation(); setIdeaPopup(true); }}>Idea: <strong>{idea >= 0 ? '+' : ''}{idea}</strong></button>
                <span className="th-badge">CÉ: {cardCÉ}</span>
                <span className="th-badge">Támadás: {tám}</span>
              </div>
            </div>
            );
          })}
          <select className="he-add-select" value="" onChange={e => { if (e.target.value) addTávfegyver(e.target.value); }}>
            <option value="">+ Új távfegyver...</option>
            {felvehető.map(f => <option key={f.Fegyver} value={f.Fegyver}>{f.Fegyver}</option>)}
          </select>
        </section>
      )}

      {/* Game mód: csak aktív fegyver kijelzés */}
      {gameMode && k.távfegyverek.length > 0 && (
        <div className="th-row th-controls">
          <select className="th-select" value={tfIdx} onChange={e => setSession(s => ({ ...s, aktív_távfegyver_index: parseInt(e.target.value) }))}>
            {k.távfegyverek.map((tf, i) => <option key={i} value={i}>{tf.alap}</option>)}
          </select>
          <span className="th-badge">MF: {mfFok}</span>
          <span className="th-badge">Idea: {idea >= 0 ? '+' : ''}{idea}</span>
        </div>
      )}

      {/* Kalkulátor — csak ha van fegyver */}
      {tfDef && gameMode && (
        <>
          {/* CÉ + Támadás */}
          <div className="th-row th-results">
            <span className="th-value">CÉ: {cé}</span>
            <span className="th-value">Támadás: {támadásLabel}</span>
          </div>

          {/* VÉ kalkulátor — csak Game módban */}
          {gameMode && (
            <>
              {/* VÉ + Találati esély */}
              <div className="th-row th-results">
                <span className="th-value">VÉ: {vé}</span>
                <span className="th-value">Találati esély: {találatiEsély}%</span>
              </div>

              {/* Távolság + Cella */}
              <div className="th-row th-controls">
                <div className="th-stepper">
                  <button onClick={() => setTávolság(Math.max(1, távolság - 5))}>-5</button>
                  <button onClick={() => setTávolság(Math.max(1, távolság - 1))}>-1</button>
                  <span className="th-distance">{távolság}m</span>
                  <button onClick={() => setTávolság(távolság + 1)}>+1</button>
                  <button onClick={() => setTávolság(távolság + 5)}>+5</button>
                </div>
                <span className="th-value">Cella: {cella}</span>
              </div>

              {/* Szorzó pickerek */}
              <div className="th-szorzo-grid">
                <SzorzóPicker label="Cél mozgása" list={szorzok.célpont_mozgás} activeId={célMozgásId} onSelect={setCélMozgásId} />
                <SzorzóPicker label="Lövész mozgás" list={szorzok.lövész_mozgás} activeId={lövészMozgásId} onSelect={setLövészMozgásId} />
                <SzorzóPicker label="Méret" list={szorzok.célpont_méret} activeId={méretId} onSelect={setMéretId} />
                <SzorzóPicker label="Észlelhetőség" list={szorzok.észlelhetőség} activeId={észlelhetőségId} onSelect={setÉszlelhetőségId} />
                <SzorzóPicker label="Szél ereje" list={szorzok.szél} activeId={szélId} onSelect={setSzélId} />
              </div>

              {/* Szorzó összesítő */}
              <div className="th-row th-results">
                <span className="th-value th-szorzo-total">Szorzó: {szorzóÖsszeg}</span>
              </div>
            </>
          )}
        </>
      )}

      {!tfDef && k.távfegyverek.length === 0 && gameMode && (
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
            <button className="btn-del-confirm" onClick={() => { removeTávfegyver(deleteTarget); setDeleteTarget(null); }}>Távfegyver törlése</button>
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
