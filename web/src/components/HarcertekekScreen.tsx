import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, FegyverPeldany, PancelPeldany } from '../engine/types';
import './HarcertekekScreen.css';

interface Props {
  data: GameData;
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
}

export function HarcertekekScreen({ data, karakter, setKarakter }: Props) {
  const k = karakter;
  const { konstansok } = data;

  // Harcmodor szintek (read-only, Tul/Képz fülről jönnek)
  const harcmodorok = ['Közelharc', 'Kardvívás', 'Rombolás', 'Lándzsavívás', 'Ostorharc'];
  const harcmodorSzintek = harcmodorok.map(n => ({ név: n, szint: k.képzettségek.find(kp => kp.név === n)?.szint ?? 0 }));

  // max_HM (simplified calc here — same as reactive)
  const harciFortelyNevek = new Set(data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név));
  const harciFokok = k.fortélyok.filter(f => harciFortelyNevek.has(f.név) && f.név !== 'Mesterfegyver').reduce((s, f) => s + f.fok, 0);
  const harcmodorÖsszeg = harcmodorSzintek.reduce((s, h) => s + h.szint, 0);
  const alakzatharcSzint = k.képzettségek.find(kp => kp.név === 'Alakzatharc')?.szint ?? 0;
  const maxHM = harciFokok + harcmodorÖsszeg + alakzatharcSzint;
  const maxCM = k.tsz * (konstansok.arányok.max_cm_perszint ?? 2);
  const maxAszimmetria = Math.floor(k.tsz / 2);

  const hmTotal = k.HM_TÉ + k.HM_VÉ;
  const hmOverflow = hmTotal > maxHM;
  const aszimmetriaOverflow = Math.abs(k.HM_TÉ - k.HM_VÉ) > maxAszimmetria;
  const cmOverflow = k.CM > maxCM;

  function setHM_TÉ(v: number) { setKarakter(prev => prev ? { ...prev, HM_TÉ: Math.max(0, v) } : prev); }
  function setHM_VÉ(v: number) { setKarakter(prev => prev ? { ...prev, HM_VÉ: Math.max(0, v) } : prev); }
  function setCM(v: number) { setKarakter(prev => prev ? { ...prev, CM: Math.max(0, v) } : prev); }

  // Fegyverek
  function addFegyver(alap: string) {
    setKarakter(prev => prev ? { ...prev, fegyverek: [...prev.fegyverek, { alap, név: '', anyag: 'acél', idea: 0, mesterfegyver_fok: 0 }] } : prev);
  }
  function removeFegyver(idx: number) { setKarakter(prev => prev ? { ...prev, fegyverek: prev.fegyverek.filter((_, i) => i !== idx) } : prev); }
  function updateFegyver(idx: number, patch: Partial<FegyverPeldany>) {
    setKarakter(prev => prev ? { ...prev, fegyverek: prev.fegyverek.map((f, i) => i === idx ? { ...f, ...patch } : f) } : prev);
  }

  // Páncél
  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  // Fegyver dropdown: csoportosítva kategóriánként
  const fegyverByKat = new Map<string, string[]>();
  for (const f of data.fegyverek) {
    const arr = fegyverByKat.get(f.Kategória) || [];
    arr.push(f.Fegyver);
    fegyverByKat.set(f.Kategória, arr);
  }

  // Struktúrák a páncélhoz
  const struktúrák = konstansok.páncél_struktúrák;
  const fémalapanyagok = konstansok.páncél_fémalapanyagok;
  const aktStruktúra = struktúrák.find(s => s.struktúra === k.páncél.alap);

  // Idea popup
  const [ideaTarget, setIdeaTarget] = useState<{ type: 'fegyver' | 'páncél'; idx: number } | null>(null);
  const ideaMin = ideaTarget?.type === 'fegyver' ? -5 : -4;
  const ideaMax = ideaTarget?.type === 'fegyver' ? 5 : 4;

  useEffect(() => {
    if (!ideaTarget) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIdeaTarget(null); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ideaTarget]);

  return (
    <div className="screen harcertekek-screen">
      {/* HM/CM */}
      <section className="he-section">
        <h3>HM / CM</h3>
        <div className="he-hm-grid">
          <div className={`he-hm-row ${hmOverflow || aszimmetriaOverflow ? 'he-error' : ''}`}>
            <span>HM TÉ:</span>
            <button onClick={() => setHM_TÉ(k.HM_TÉ - 1)}>−</button>
            <strong>{k.HM_TÉ}</strong>
            <button onClick={() => setHM_TÉ(k.HM_TÉ + 1)}>+</button>
          </div>
          <div className={`he-hm-row ${hmOverflow || aszimmetriaOverflow ? 'he-error' : ''}`}>
            <span>HM VÉ:</span>
            <button onClick={() => setHM_VÉ(k.HM_VÉ - 1)}>−</button>
            <strong>{k.HM_VÉ}</strong>
            <button onClick={() => setHM_VÉ(k.HM_VÉ + 1)}>+</button>
          </div>
          <div className={`he-hm-row ${cmOverflow ? 'he-error' : ''}`}>
            <span>CM:</span>
            <button onClick={() => setCM(k.CM - 1)}>−</button>
            <strong>{k.CM}</strong>
            <button onClick={() => setCM(k.CM + 1)}>+</button>
          </div>
        </div>
        <div className="he-hm-info">
          <span>HM: {hmTotal} / {maxHM}</span>
          <span>Aszimmetria: {Math.abs(k.HM_TÉ - k.HM_VÉ)} / {maxAszimmetria}</span>
          <span>CM: {k.CM} / {maxCM}</span>
        </div>
      </section>

      {/* Harcmodorok (read-only) */}
      <section className="he-section">
        <h3>Harcmodorok</h3>
        <div className="he-harcmodor-list">
          {harcmodorSzintek.map(h => (
            <span key={h.név} className="he-harcmodor-item">{h.név}: <strong>{h.szint}</strong></span>
          ))}
        </div>
      </section>

      {/* Fegyverek */}
      <section className="he-section">
        <h3>Fegyverek</h3>
        {k.fegyverek.map((f, i) => (
          <div key={i} className="he-fegyver-card">
            <div className="he-fegyver-header">
              <strong>{f.alap}</strong>
              <button className="fort-delete" onClick={() => removeFegyver(i)}>✕</button>
            </div>
            <div className="he-fegyver-fields">
              <label>MF fok:
                <select value={f.mesterfegyver_fok} onChange={e => updateFegyver(i, { mesterfegyver_fok: Number(e.target.value) })}>
                  {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label>Idea:
                <button className="he-idea-btn" onClick={() => setIdeaTarget({ type: 'fegyver', idx: i })}>{f.idea}</button>
              </label>
              <label>Anyag:
                <select value={f.anyag} onChange={e => updateFegyver(i, { anyag: e.target.value })}>
                  {['acél', 'bronz', 'abbitacél', 'mithrill', 'lunír'].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))}
        <select className="he-add-select" value="" onChange={e => { if (e.target.value) addFegyver(e.target.value); }}>
          <option value="">+ Új fegyver...</option>
          {[...fegyverByKat.entries()].map(([kat, nevek]) => (
            <optgroup key={kat} label={kat}>
              {nevek.map(n => <option key={n} value={n}>{n}</option>)}
            </optgroup>
          ))}
        </select>
      </section>

      {/* Páncél */}
      <section className="he-section">
        <h3>Páncél</h3>
        <div className="he-pancel-fields">
          <label>Struktúra:
            <select value={k.páncél.alap} onChange={e => updatePancel({ alap: e.target.value, fémalapanyag: '' })}>
              <option value="">— nincs —</option>
              {struktúrák.map(s => <option key={s.struktúra} value={s.struktúra}>{s.struktúra} ({s.leírás})</option>)}
            </select>
          </label>
          {aktStruktúra?.fém && (
            <label>Fémalapanyag:
              <select value={k.páncél.fémalapanyag} onChange={e => updatePancel({ fémalapanyag: e.target.value })}>
                <option value="">acél (alap)</option>
                {fémalapanyagok.map(a => <option key={a.anyag} value={a.anyag}>{a.anyag}</option>)}
              </select>
            </label>
          )}
          <label>Kidolgozottság:
            <select value={k.páncél.kidolgozottság} onChange={e => updatePancel({ kidolgozottság: e.target.value })}>
              {['pocsék', 'átlagos', 'mestermunka'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Méret:
            <select value={k.páncél.méret_illeszkedés} onChange={e => updatePancel({ méret_illeszkedés: e.target.value })}>
              {['passzoló', 'közepesen_más', 'nagyon_más'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label className="he-toggle">Sisak: <input type="checkbox" checked={k.páncél.sisak} onChange={e => updatePancel({ sisak: e.target.checked })} /></label>
          <label>Végtagvédettség:
            <select value={k.páncél.végtagvédettség} onChange={e => updatePancel({ végtagvédettség: Number(e.target.value) })}>
              {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>Idea:
            <button className="he-idea-btn" onClick={() => setIdeaTarget({ type: 'páncél', idx: 0 })}>{k.páncél.idea}</button>
          </label>
          <label>Rongálódás:
            <select value={k.páncél.rongálódás} onChange={e => updatePancel({ rongálódás: Number(e.target.value) })}>
              {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      </section>

      {/* Idea popup */}
      {ideaTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Idea érték</label>
            <div className="kep-szint-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', maxWidth: `${5 * 42 + 4 * 6}px`, margin: '0 auto' }}>
              {Array.from({ length: ideaMax - ideaMin + 1 }, (_, i) => ideaMin + i).map(n => {
                const current = ideaTarget.type === 'fegyver' ? k.fegyverek[ideaTarget.idx]?.idea : k.páncél.idea;
                return (
                  <button key={n} className={`fort-fok-btn ${current === n ? 'active' : ''}`} style={{ width: '42px', height: '36px', fontSize: '14px' }} onClick={() => {
                    if (ideaTarget.type === 'fegyver') updateFegyver(ideaTarget.idx, { idea: n });
                    else updatePancel({ idea: n });
                    setIdeaTarget(null);
                  }}>{n > 0 ? `+${n}` : n}</button>
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
