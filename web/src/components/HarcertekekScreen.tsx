import { useState, useEffect, useRef } from 'react';
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

  // Hint sáv
  const [hint, setHint] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showHint(msg: string, duration = 3000) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), duration);
  }

  // Per-element double-tap tracking


  // Harcmodor szintek (read-only, Tul/Képz fülről jönnek)
  const harcmodorok = Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[];
  const harcmodorSzintek = harcmodorok.map(n => ({ név: n, szint: k.képzettségek.find(kp => kp.név === n)?.szint ?? 0 }));

  // max_HM (simplified calc here — same as reactive)
  const harciFortelyNevek = new Set(data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név));
  const harciFokok = k.fortélyok.filter(f => harciFortelyNevek.has(f.név) && f.név !== 'Mesterfegyver').reduce((s, f) => s + f.fok, 0);
  const harcmodorÖsszeg = harcmodorSzintek.reduce((s, h) => s + h.szint, 0);
  const alakzatharcSzint = k.képzettségek.find(kp => kp.név === 'Alakzatharc')?.szint ?? 0;
  const maxHM = harciFokok + harcmodorÖsszeg + alakzatharcSzint;
  const maxAszimmetria = Math.floor(k.tsz / data.konstansok.hm_aszimmetria_osztó);

  const hmTotal = k.HM_TÉ + k.HM_VÉ;
  const hmOverflow = hmTotal > maxHM;
  const aszimmetriaOverflow = Math.abs(k.HM_TÉ - k.HM_VÉ) > maxAszimmetria;

  function setHM_TÉ(v: number) { setKarakter(prev => prev ? { ...prev, HM_TÉ: Math.max(0, Math.min(v, maxHM - prev.HM_VÉ)) } : prev); }
  function setHM_VÉ(v: number) { setKarakter(prev => prev ? { ...prev, HM_VÉ: Math.max(0, Math.min(v, maxHM - prev.HM_TÉ)) } : prev); }

  // Mesterfegyver fok lookup: fortélyok tömbből, spec_elem === fegyver.alap (vagy Alapnév)
  function getMfFok(fegyverAlap: string): number {
    const fDef = data.fegyverek.find(fd => fd.Fegyver.toLowerCase() === fegyverAlap.toLowerCase());
    const displayName = fDef?.Alapnév || fegyverAlap;
    const entry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fegyverAlap));
    return entry?.fok ?? 0;
  }

  function mfKövetelményHiba(fegyverAlap: string): boolean {
    const fok = getMfFok(fegyverAlap);
    if (fok === 0) return false;
    const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
    const fokDef = mfDef?.fokok.find(f => f.fok === fok);
    if (!fokDef?.követelmények?.length) return false;
    for (const kov of fokDef.követelmények) {
      if (kov.típus === 'képzettség') {
        const nevek = Array.isArray(kov.név) ? kov.név : [kov.név];
        if (!nevek.some(n => (k.képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték)) return true;
      } else if (kov.típus === 'fortély') {
        const név = Array.isArray(kov.név) ? kov.név[0] : kov.név;
        if (!k.fortélyok.some(f => f.név.toLowerCase() === név.toLowerCase() && f.fok >= kov.érték)) return true;
      }
    }
    return false;
  }

  function setMfFok(fegyverAlap: string, fok: number) {
    const fDef = data.fegyverek.find(fd => fd.Fegyver.toLowerCase() === fegyverAlap.toLowerCase());
    const displayName = fDef?.Alapnév || fegyverAlap;
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fegyverAlap)));
      if (fok > 0) {
        fortélyok = [{ név: 'Mesterfegyver', fok, spec_típus: 'fegyver', spec_elem: displayName }, ...fortélyok];
      }
      return { ...prev, fortélyok };
    });
  }

  // Pajzshasználat fok lookup: fortélyok tömbből
  function getPajzsFok(): number {
    return k.fortélyok.find(f => f.név === 'Pajzshasználat')?.fok ?? 0;
  }

  function setPajzsFok(fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Pajzshasználat');
      if (fok > 0) {
        fortélyok = [{ név: 'Pajzshasználat', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      }
      return { ...prev, fortélyok };
    });
  }

  // Merevvértviselet fok lookup: fortélyok tömbből
  function getMerevvertFok(): number {
    return k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  }

  function setMerevvertFok(fok: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      let fortélyok = prev.fortélyok.filter(f => f.név !== 'Merevvértviselet');
      if (fok > 0) {
        fortélyok = [{ név: 'Merevvértviselet', fok, spec_típus: '', spec_elem: '' }, ...fortélyok];
      }
      return { ...prev, fortélyok };
    });
  }

  function addFegyver(alap: string) {
    setKarakter(prev => {
      if (!prev) return prev;
      const fegyverek = [...prev.fegyverek, { alap, név: '', anyag: 'acél', idea: 0 }];
      return { ...prev, fegyverek };
    });
  }
  function removeFegyver(idx: number) {
    setKarakter(prev => {
      if (!prev) return prev;
      const removed = prev.fegyverek[idx];
      const fegyverek = prev.fegyverek.filter((_, i) => i !== idx);
      // Töröljük a Mesterfegyver fortélyt is ha a fegyverhez tartozott
      const fDef = data.fegyverek.find(fd => fd.Fegyver.toLowerCase() === removed.alap.toLowerCase());
      const displayName = fDef?.Alapnév || removed.alap;
      const fortélyok = prev.fortélyok.filter(f => !(f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === removed.alap)));
      // Session: fegyver indexek és kétkezes harc reset ha érintett
      const session = { ...prev.session };
      if (session.aktív_fegyver_index >= fegyverek.length) { session.aktív_fegyver_index = 0; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_bal_index >= fegyverek.length) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      if (session.aktív_fegyver_index === session.aktív_fegyver_bal_index) { session.aktív_fegyver_bal_index = -1; session.kétkezes_harc = false; }
      return { ...prev, fegyverek, fortélyok, session };
    });
  }
  function updateFegyver(idx: number, patch: Partial<FegyverPeldany>) {
    setKarakter(prev => {
      if (!prev) return prev;
      const fegyverek = prev.fegyverek.map((f, i) => i === idx ? { ...f, ...patch } : f);
      return { ...prev, fegyverek };
    });
  }

  // Páncél
  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  function updatePajzs(patch: Partial<{ méret: string }>) {
    setKarakter(prev => {
      if (!prev) return prev;
      return { ...prev, pajzs: { ...prev.pajzs, ...patch } };
    });
  }

  // Fegyver dropdown: csoportosítva kategóriánként (MK 2K variánsok kiszűrve)
  const fegyverByKat = new Map<string, { id: string; label: string }[]>();
  const felvettFegyverek = new Set(k.fegyverek.map(fp => fp.alap.toLowerCase()));
  for (const f of data.fegyverek) {
    if (f.MK_pár && f['Forgatás módja'] === 'kétkezes') continue; // skip 2K of MK pairs
    if (felvettFegyverek.has(f.Fegyver.toLowerCase())) continue; // már felvéve
    const arr = fegyverByKat.get(f.Kategória) || [];
    arr.push({ id: f.Fegyver, label: f.Alapnév || f.Fegyver });
    fegyverByKat.set(f.Kategória, arr);
  }

  // Struktúrák a páncélhoz
  const struktúrák = konstansok.páncél_struktúrák;
  const fémalapanyagok = konstansok.páncél_fémalapanyagok;
  const aktStruktúra = struktúrák.find(s => s.struktúra === k.páncél.alap);

  // Idea popup
  const [ideaTarget, setIdeaTarget] = useState<{ type: 'fegyver' | 'páncél'; idx: number } | null>(null);
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  const [anyagTarget, setAnyagTarget] = useState<number | null>(null);
  const [pancelPopup, setPancelPopup] = useState<string | null>(null);
  const [pajzsPopup, setPajzsPopup] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const ideaMin = ideaTarget?.type === 'fegyver' ? -5 : -4;
  const ideaMax = ideaTarget?.type === 'fegyver' ? 5 : 4;

  useEffect(() => {
    if (!ideaTarget && mfTarget === null && anyagTarget === null && !pancelPopup && !pajzsPopup && deleteTarget === null) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setIdeaTarget(null); setMfTarget(null); setAnyagTarget(null); setPancelPopup(null); setPajzsPopup(null); setDeleteTarget(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ideaTarget, mfTarget, anyagTarget, pancelPopup, pajzsPopup, deleteTarget]);

  return (
    <div className="screen harcertekek-screen">
      <h2>🛡️ Harcértékek</h2>
      {/* HM/CM */}
      <section className="he-section">
        <h3>HM</h3>
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
        </div>
        <div className="he-hm-info">
          <span className={hmOverflow ? 'he-overflow' : ''}>HM keret: {maxHM - hmTotal}</span>
        </div>
      </section>

      {/* Harcmodorok (read-only) */}
      {harcmodorSzintek.some(h => h.szint > 0) && (
      <section className="he-section">
        <h3>Harcmodorok</h3>
        <div className="he-harcmodor-list">
          {harcmodorSzintek.filter(h => h.szint > 0).map(h => (
            <span key={h.név} className="he-harcmodor-item">{h.név}: <strong>{h.szint}</strong></span>
          ))}
        </div>
      </section>
      )}

      {/* Fegyverek */}
      <section className="he-section">
        <h3>Fegyverek</h3>
        {k.fegyverek.map((f, i) => (
          <div key={i} className="he-fegyver-card">
            <div className="he-fegyver-header">
              <strong>{f.alap.replace(/ \(1K\)$| 1K$/, '')}</strong>
              <button className="fort-delete" onClick={() => setDeleteTarget(i)}>✕</button>
            </div>
            <div className="he-fegyver-fields">
              <button className="he-field-btn" style={mfKövetelményHiba(f.alap) ? { color: '#e53935' } : undefined} onClick={() => setMfTarget(i)}>MF fok: <strong>{getMfFok(f.alap)}</strong></button>
              <button className="he-field-btn" onClick={() => setIdeaTarget({ type: 'fegyver', idx: i })}>Idea: <strong>{f.idea}</strong></button>
              <button className="he-field-btn" onClick={() => setAnyagTarget(i)}>Anyag: <strong>{f.anyag}</strong></button>
            </div>
          </div>
        ))}
        <select className="he-add-select" value="" onChange={e => { if (e.target.value) addFegyver(e.target.value); }}>
          <option value="">+ Új fegyver...</option>
          {['kardvívó', 'közelharci', 'romboló', 'lándzsavívó', 'ostorharc'].filter(kat => fegyverByKat.has(kat)).map(kat => (
            <optgroup key={kat} label={kat}>
              {fegyverByKat.get(kat)!.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </optgroup>
          ))}
        </select>
      </section>

      {/* Páncél */}
      <section className="he-section">
        <h3>Páncél</h3>
        <div className="he-fegyver-fields">
          <button className="he-field-btn" onClick={() => setPancelPopup('struktúra')}>Struktúra: <strong>{k.páncél.alap || '—'}</strong></button>
          {aktStruktúra?.merev && (
            <button className="he-field-btn" onClick={() => setPancelPopup('merevvért')}>Merevvért fok: <strong>{getMerevvertFok()}</strong></button>
          )}
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => setIdeaTarget({ type: 'páncél', idx: 0 })}>Idea: <strong>{k.páncél.idea}</strong></button>
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => setPancelPopup('kidolgozottság')}>Kidolgozottság: <strong>{k.páncél.kidolgozottság}</strong></button>
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => updatePancel({ sisak: !k.páncél.sisak })}>Sisak: <strong>{k.páncél.sisak ? 'igen' : 'nem'}</strong></button>
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => setPancelPopup('végtagvédettség')}>Végtagvédettség: <strong>{k.páncél.végtagvédettség}</strong></button>
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => setPancelPopup('méret')}>Méret: <strong>{k.páncél.méret_illeszkedés}</strong></button>
          <button className={`he-field-btn${!k.páncél.alap ? ' he-field-disabled' : ''}`} disabled={!k.páncél.alap} onClick={() => setPancelPopup('rongálódás')}>Rongálódás: <strong>{k.páncél.rongálódás}</strong></button>
          {aktStruktúra?.fém && (
            <button className="he-field-btn" onClick={() => setPancelPopup('fémalapanyag')}>Fémalapanyag: <strong>{k.páncél.fémalapanyag || 'acél'}</strong></button>
          )}
        </div>
      </section>

      {/* Pajzs */}
      <section className="he-section">
        <h3>Pajzs</h3>
        <div className="he-fegyver-fields">
          <button className="he-field-btn" onClick={() => setPajzsPopup('méret')}>Méret: <strong>{k.pajzs.méret || '— nincs —'}</strong></button>
          <button className="he-field-btn" onClick={() => setPajzsPopup('pajzshasználat')}>Pajzshasználat fok: <strong>{getPajzsFok()}</strong></button>
          <span className="he-field-btn he-field-indicator" onClick={() => showHint('A pajzs kézben állapotot az Aktív fülön állíthatod!')}>Kézben: <strong>{k.session.aktív_pajzs ? 'igen' : 'nem'}</strong></span>
        </div>
      </section>

      {/* Idea popup */}
      {ideaTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Idea érték</label>
            {(() => {
              const current = ideaTarget.type === 'fegyver' ? k.fegyverek[ideaTarget.idx]?.idea : k.páncél.idea;
              const selectIdea = (n: number) => { if (ideaTarget.type === 'fegyver') updateFegyver(ideaTarget.idx, { idea: n }); else updatePancel({ idea: n }); setIdeaTarget(null); };
              const btn = (n: number) => <button key={n} className={`fort-fok-btn ${current === n ? 'active' : ''}`} style={{ width: '36px', height: '36px', fontSize: '13px' }} onClick={() => selectIdea(n)}>{n > 0 ? `+${n}` : n}</button>;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {Array.from({ length: -ideaMin }, (_, i) => ideaMin + i).map(btn)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {btn(0)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {Array.from({ length: ideaMax }, (_, i) => i + 1).map(btn)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {mfTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Mesterfegyver fok</label>
            <div className="fort-fok-radios">
              {[0, 1, 2, 3].map(n => (
                <button key={n} className={`fort-fok-btn ${getMfFok(k.fegyverek[mfTarget]?.alap ?? '') === n ? 'active' : ''}`} onClick={() => { setMfFok(k.fegyverek[mfTarget]?.alap ?? '', n); setMfTarget(null); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {anyagTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              {['acél', 'bronz', 'abbitacél', 'mithrill', 'lunír'].map(a => (
                <button key={a} className={`fort-fok-btn ${k.fegyverek[anyagTarget]?.anyag === a ? 'active' : ''}`} style={{ width: 'auto', minWidth: '120px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updateFegyver(anyagTarget, { anyag: a }); setAnyagTarget(null); }}>{a}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {pancelPopup && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              {pancelPopup === 'struktúra' && <>
                <button className={`fort-fok-btn ${!k.páncél.alap ? 'active' : ''}`} style={{ width: 'auto', minWidth: '140px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ alap: '', fémalapanyag: '' }); setPancelPopup(null); }}>— nincs —</button>
                {struktúrák.map(s => (
                  <button key={s.struktúra} className={`fort-fok-btn ${k.páncél.alap === s.struktúra ? 'active' : ''}`} style={{ width: 'auto', minWidth: '140px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ alap: s.struktúra, fémalapanyag: '' }); setPancelPopup(null); }}>{s.struktúra}</button>
                ))}
              </>}
              {pancelPopup === 'fémalapanyag' && <>
                <button className={`fort-fok-btn ${!k.páncél.fémalapanyag ? 'active' : ''}`} style={{ width: 'auto', minWidth: '120px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ fémalapanyag: '' }); setPancelPopup(null); }}>acél (alap)</button>
                {fémalapanyagok.map(a => (
                  <button key={a.anyag} className={`fort-fok-btn ${k.páncél.fémalapanyag === a.anyag ? 'active' : ''}`} style={{ width: 'auto', minWidth: '120px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ fémalapanyag: a.anyag }); setPancelPopup(null); }}>{a.anyag}</button>
                ))}
              </>}
              {pancelPopup === 'kidolgozottság' && ['pocsék', 'átlagos', 'mestermunka'].map(v => (
                <button key={v} className={`fort-fok-btn ${k.páncél.kidolgozottság === v ? 'active' : ''}`} style={{ width: 'auto', minWidth: '120px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ kidolgozottság: v }); setPancelPopup(null); }}>{v}</button>
              ))}
              {pancelPopup === 'méret' && ['passzol', 'nem passzol', 'borzalmas'].map(v => (
                <button key={v} className={`fort-fok-btn ${k.páncél.méret_illeszkedés === v ? 'active' : ''}`} style={{ width: 'auto', minWidth: '140px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePancel({ méret_illeszkedés: v }); setPancelPopup(null); }}>{v}</button>
              ))}
              {pancelPopup === 'végtagvédettség' && (
                <div className="fort-fok-radios">
                  {[0, 1, 2, 3, 4].map(n => (
                    <button key={n} className={`fort-fok-btn ${k.páncél.végtagvédettség === n ? 'active' : ''}`} onClick={() => { updatePancel({ végtagvédettség: n }); setPancelPopup(null); }}>{n}</button>
                  ))}
                </div>
              )}
              {pancelPopup === 'rongálódás' && (
                <div className="fort-fok-radios">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={`fort-fok-btn ${k.páncél.rongálódás === n ? 'active' : ''}`} onClick={() => { updatePancel({ rongálódás: n }); setPancelPopup(null); }}>{n}</button>
                  ))}
                </div>
              )}
              {pancelPopup === 'merevvért' && (
                <div className="fort-fok-radios">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} className={`fort-fok-btn ${getMerevvertFok() === n ? 'active' : ''}`} onClick={() => { setMerevvertFok(n); setPancelPopup(null); }}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {pajzsPopup && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              {pajzsPopup === 'méret' && <>
                <button className={`fort-fok-btn ${!k.pajzs.méret ? 'active' : ''}`} style={{ width: 'auto', minWidth: '140px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePajzs({ méret: '' }); setPajzsPopup(null); }}>— nincs —</button>
                {['kis', 'közepes', 'nagy'].map(v => (
                  <button key={v} className={`fort-fok-btn ${k.pajzs.méret === v ? 'active' : ''}`} style={{ width: 'auto', minWidth: '140px', padding: '6px 16px', borderRadius: '6px', fontSize: '14px' }} onClick={() => { updatePajzs({ méret: v }); setPajzsPopup(null); }}>{v}</button>
                ))}
              </>}
              {pajzsPopup === 'pajzshasználat' && (
                <div className="fort-fok-radios">
                  {[0, 1, 2, 3].map(n => (
                    <button key={n} className={`fort-fok-btn ${getPajzsFok() === n ? 'active' : ''}`} onClick={() => { setPajzsFok(n); setPajzsPopup(null); }}>{n}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteTarget !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{k.fegyverek[deleteTarget]?.alap.replace(/ \(1K\)$| 1K$/, '')}</label>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { removeFegyver(deleteTarget); setDeleteTarget(null); }}>Fegyver törlése</button>
          </div>
        </div>,
        document.body
      )}

      {hint && <div className="he-hint">{hint}</div>}
    </div>
  );
}
