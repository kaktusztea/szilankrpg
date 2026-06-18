import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { GameData, KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import type { Tulajdonsagok } from '../engine/types';
import './TulajdonsagokScreen.css';

const TULAJDONSAG_NEVEK: (keyof Tulajdonsagok)[] = [
  'erő', 'edzettség', 'ügyesség', 'gyorsaság',
  'intelligencia', 'emlékezet', 'önuralom', 'érzékenység',
];

const CSOPORT_SORREND = ['harci', 'misztikus', 'fizikai', 'világi', 'alvilági', 'művészeti', 'tudományos'];
const CSOPORT_LABEL: Record<string, string> = {
  harci: '⚔️ Harci', misztikus: '✨ Misztikus', fizikai: '🏃 Fizikai',
  világi: '🌍 Világi', alvilági: '🗝️ Alvilági', művészeti: '🎨 Művészeti', tudományos: '🧪 Tudományos',
};

interface KepzettsegSlot {
  név: string;
  szint: number;
}

interface Props {
  data: GameData;
  gameMode: boolean;
  tulajdonságok: Tulajdonsagok;
  setTulajdonságok: React.Dispatch<React.SetStateAction<Tulajdonsagok>>;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  név: string;
  setNév: (v: string) => void;
  játékos: string;
  setJátékos: (v: string) => void;
  tsz: number;
  setTsz: (v: number) => void;
  kor: number;
  setKor: (v: number) => void;
  faj: string;
  setFaj: (v: string) => void;
  anyanyelv: string;
  setAnyanyelv: (v: string) => void;
}

export function TulajdonsagokScreen({ data, gameMode, tulajdonságok, setTulajdonságok, képzettségek, setKépzettségek, név, setNév, játékos, setJátékos, tsz, setTsz, kor, setKor, faj, setFaj, anyanyelv, setAnyanyelv }: Props) {
  const [editingNév, setEditingNév] = useState(false);
  const [tempNév, setTempNév] = useState('');
  const [editingTsz, setEditingTsz] = useState(false);
  const [editingKor, setEditingKor] = useState(false);
  const [editingJátékos, setEditingJátékos] = useState(false);
  const [tempJátékos, setTempJátékos] = useState('');

  // Game mode: adatlap megjelenítés
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Escape bezárja az aktív popup-ot
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingNév(false); setEditingTsz(false);
        setEditingKor(false); setEditingJátékos(false); setDeleteTarget(null); setPendingEditIdx(null);
        setPromptState(null); setTradícióPicker(false); setTradícióAltípusPicker(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const defsByGroup = new Map<string, KepzettsegDef[]>();
  for (const d of data.kepzettsegDefs) {
    const arr = defsByGroup.get(d.csoport) || [];
    arr.push(d);
    defsByGroup.set(d.csoport, arr);
  }

  function setTul(key: keyof Tulajdonsagok, val: number) {
    setTulajdonságok(prev => ({ ...prev, [key]: Math.max(-5, Math.min(7, val)) }));
  }

  function setKepSzint(idx: number, szint: number) {
    setKépzettségek(prev => prev.map((k, i) => i === idx ? { ...k, szint } : k));
  }



  // Szabad szöveges többszörös: custom dialógus
  const [promptState, setPromptState] = useState<{ alapNév: string } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  // Törlés megerősítés dialógus
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; név: string; szint: number } | null>(null);
  // Új képzettség felvétele után automatikusan megnyíló szint popup
  const [pendingEditIdx, setPendingEditIdx] = useState<number | null>(null);
  // Tradíció picker
  const [tradícióPicker, setTradícióPicker] = useState(false);
  const [tradícióAltípusPicker, setTradícióAltípusPicker] = useState<string | null>(null);

  function addKepzettseg(_csoport: string, név: string) {
    if (név === '__tradicio') {
      setTradícióPicker(true);
      return;
    }
    if (név.startsWith('__prompt:')) {
      const alapNév = név.slice('__prompt:'.length);
      setPromptState({ alapNév });
      setPromptValue('');
      return;
    }
    // Többszörös prefixelt value: "AlapNév:AlNév" → tárolt név = "AlNév"
    let actualNév = név;
    if (név.includes(':') && !név.startsWith('__')) {
      actualNév = név.split(':')[1];
    }
    setKépzettségek(prev => {
      // Ha többszörös alnév: csoportosítva szúrjuk be a testvérei mellé
      const parentDef = data.kepzettsegDefs.find(d =>
        d.többszörös.length > 0 && d.többszörös[0] !== '*' && d.többszörös.includes(actualNév)
      );
      if (parentDef) {
        const siblings = new Set(parentDef.többszörös);
        const lastIdx = prev.reduce((acc, k, i) => siblings.has(k.név) ? i : acc, -1);
        const newArr = [...prev];
        const insertAt = lastIdx + 1;
        newArr.splice(insertAt, 0, { név: actualNév, szint: 0 });
        setPendingEditIdx(insertAt);
        return newArr;
      }
      setPendingEditIdx(prev.length);
      return [...prev, { név: actualNév, szint: 0 }];
    });
  }

  function confirmPrompt() {
    if (!promptState || !promptValue.trim()) return;
    setKépzettségek(prev => [...prev, { név: `${promptState.alapNév}: ${promptValue.trim()}`, szint: 0 }]);
    setPendingEditIdx(képzettségek.length);
    setPromptState(null);
  }

  // Megjelenítési név: többszörös képzettségeknél "AlapNév: AlNév" formátum
  function getDisplayName(név: string): string {
    if (név.startsWith('Tradíció: ')) return név;
    for (const d of data.kepzettsegDefs) {
      if (d.többszörös.length === 0) continue;
      if (d.többszörös[0] === '*') {
        // Szabad szöveges: "AlapNév: xyz" formátum már a névben van
        if (név.startsWith(d.név + ':')) return név;
      } else {
        if (d.többszörös.includes(név)) return `${d.név}: ${név}`;
      }
    }
    return név;
  }

  // A def lookup többszörös képzettségeknél az alap def-et adja vissza
  function findDef(név: string): KepzettsegDef | undefined {
    if (név.startsWith('Tradíció: ')) return data.kepzettsegDefs.find(d => d.név === 'Tradíció');
    for (const d of data.kepzettsegDefs) {
      if (d.többszörös.length === 0) continue;
      if (d.többszörös[0] === '*' && név.startsWith(d.név + ':')) return d;
      if (d.többszörös.includes(név)) return d;
    }
    return data.kepzettsegDefs.find(d => d.név === név);
  }

  // Minden csoport elérhető neveinek generálása (többszörös kibontva)
  function getAvailableNames(csoport: string, usedNames: string[]): { label: string; value: string }[] {
    const csoportDefs = defsByGroup.get(csoport) || [];
    const options: { label: string; value: string }[] = [];
    for (const d of csoportDefs) {
      if (d.név === 'Tradíció') {
        // Tradíció: speciális — ha bármelyik "Tradíció: ..." már felvéve, nem jelenik meg
        const hasTradicio = usedNames.some(n => n.startsWith('Tradíció: '));
        if (!hasTradicio) options.push({ label: 'Tradíció', value: '__tradicio' });
        continue;
      }
      if (d.többszörös.length > 0) {
        if (d.többszörös[0] === '*') {
          // Szabad szöveges — mindig elérhető
          options.push({ label: `${d.név} (új)`, value: `__prompt:${d.név}` });
        } else {
          for (const sub of d.többszörös) {
            if (!usedNames.includes(sub)) {
              options.push({ label: `${d.név}: ${sub}`, value: `${d.név}:${sub}` });
            }
          }
        }
      } else {
        if (!usedNames.includes(d.név)) {
          options.push({ label: d.név, value: d.név });
        }
      }
    }
    return options.sort((a, b) => a.value === '__tradicio' ? -1 : b.value === '__tradicio' ? 1 : 0);
  }

  function getKepzettsegekForCsoport(csoport: string): KepzettsegSlot[] {
    const csoportDefs = defsByGroup.get(csoport) || [];
    const allValidNames = new Set<string>();
    const freeTextPrefixes: string[] = [];
    for (const d of csoportDefs) {
      if (d.név === 'Tradíció') {
        freeTextPrefixes.push('Tradíció: ');
        continue;
      }
      if (d.többszörös.length > 0) {
        if (d.többszörös[0] === '*') {
          freeTextPrefixes.push(d.név + ':');
        } else {
          for (const sub of d.többszörös) allValidNames.add(sub);
        }
      } else {
        allValidNames.add(d.név);
      }
    }
    return képzettségek.filter(k =>
      allValidNames.has(k.név) || freeTextPrefixes.some(p => k.név.startsWith(p))
    );
  }

  return (
    <div className="screen tul-screen">
      <h2>🔵 Tulajdonságok / Képzettségek</h2>
      {/* Fejléc: Név + Szint */}
      <div className="tul-header">
        <div className="tul-header-box tul-header-név"
          onClick={() => { if (gameMode) return; setTempNév(név); setEditingNév(true); }}
        >
          <span className="tul-header-label">Név:</span> <strong>{gameMode ? `${név} (${faj}, ${kor})` : név}</strong>
        </div>
        <div
          className="tul-header-box"
          onClick={() => { if (gameMode) return; setEditingTsz(true); }}
        >
          <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
        </div>
      </div>

      {/* Faj + Kor - csak szerkesztő módban */}
      {!gameMode && (<>
        <div className="tul-faj-kor-row">
          <div className="tul-faj-row">
            <span className="tul-header-label">Faj:</span>
            <select className="faj-select" value={faj} onChange={e => setFaj(e.target.value)}>
              {data.fajNevek.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="tul-faj-row"
            onClick={() => { setEditingKor(true); }}
          >
            <span className="tul-header-label">Kor:</span> <strong>{kor}</strong>
          </div>
        </div>
        <div className="tul-faj-row">
          <span className="tul-header-label">Anyanyelv:</span>
          <select className="faj-select" value={anyanyelv} onChange={e => setAnyanyelv(e.target.value)}>
            {data.nyelvek.map(n => <option key={n.név} value={n.név}>{n.név}</option>)}
          </select>
        </div>
        <div className="tul-header-box"
          onClick={() => { setEditingJátékos(true); setTempJátékos(játékos); }}
        >
          <span className="tul-header-label">Játékos:</span> <strong>{játékos || '—'}</strong>
        </div>
      </>)}

      {/* Tulajdonságok */}
      {!gameMode && (() => {
        const pontTábla = data.konstansok.tulajdonság_pontok as Record<string, number>;
        const keret = (data.konstansok.arányok as any).tulajdonság_pont_alap + Math.floor(tsz / 2);
        const elköltött = TULAJDONSAG_NEVEK.reduce((s, key) => s + (pontTábla[String(tulajdonságok[key])] ?? 0), 0);
        const maradék = keret - elköltött;
        return (
          <div className="tul-pont-bar" style={{ padding: '4px 8px', fontSize: '13px', color: maradék < 0 ? 'var(--error)' : 'var(--text-dim)' }}>
            <span>Tulajdonság pontok: {elköltött}/{keret}</span>
          </div>
        );
      })()}
      <div className="tul-grid">
        {TULAJDONSAG_NEVEK.map(key => (
          <TulajdonsagCell
            key={key}
            név={key}
            érték={tulajdonságok[key]}
            gameMode={gameMode}
            onChange={v => setTul(key, v)}
            fajMax={data.fajKeretek[faj]?.[key]?.[1]}
            fajMin={data.fajKeretek[faj]?.[key]?.[0]}
          />
        ))}
      </div>

      {/* Képzettségek */}
      <div className="kep-section">
        {CSOPORT_SORREND.map(csoport => {
          const slotok = getKepzettsegekForCsoport(csoport).slice().sort((a, b) => {
            const aHm = a.név.startsWith('Harcmodor:');
            const bHm = b.név.startsWith('Harcmodor:');
            if (aHm && !bHm) return -1;
            if (bHm && !aHm) return 1;
            return b.szint - a.szint;
          });
          if (gameMode && slotok.length === 0) return null;
          const usedNames = slotok.map(s => s.név);
          const available = getAvailableNames(csoport, usedNames);

          return (
            <div key={csoport} className="kep-csoport">
              <h3 className="kep-csoport-label" onClick={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}>
                <span className="kep-csoport-arrow">{collapsedGroups.has(csoport) ? '▸' : '▾'}</span> {CSOPORT_LABEL[csoport]} <span className="dim">({slotok.length})</span>
              </h3>
              {!collapsedGroups.has(csoport) && (<>
              {slotok.map((slot, i) => {
                const globalIdx = képzettségek.findIndex(k => k === slot);
                const kepDef = findDef(slot.név);
                const maxSzint = kepDef?.primer ? tsz : tsz + 3;
                return (
                  <KepzettsegRow
                    key={`${csoport}-${i}`}
                    slot={slot}
                    gameMode={gameMode}
                    onSzintChange={szint => setKepSzint(globalIdx, szint)}
                    onRemove={() => {
                      if (slot.szint === 0) {
                        setKépzettségek(prev => prev.filter((_, i2) => i2 !== globalIdx));
                      } else {
                        setDeleteTarget({ idx: globalIdx, név: getDisplayName(slot.név), szint: slot.szint });
                      }
                    }}
                    kiterjesztesek={data.kiterjesztesek}
                    infoOpen={infoTarget === `${globalIdx}`}
                    onInfoToggle={() => setInfoTarget(infoTarget === `${globalIdx}` ? null : `${globalIdx}`)}
                    displayName={getDisplayName(slot.név)}
                    findDef={findDef}
                    overLimit={slot.szint > maxSzint}
                  />
                );
              })}
              {/* Szerkesztő módban: üres dropdown új képzettség felvételéhez */}
              {!gameMode && available.length > 0 && (
                <div className="kep-row kep-row-new">
                  <select
                    className="kep-select"
                    value=""
                    onChange={e => { if (e.target.value) addKepzettseg(csoport, e.target.value); }}
                  >
                    <option value="">+ Új képzettség...</option>
                    {available.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              </>)}
            </div>
          );
        })}
      </div>

      {promptState && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{promptState.alapNév} — alnév:</label>
            <input
              autoFocus
              maxLength={20}
              value={promptValue}
              onChange={e => setPromptValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmPrompt(); if (e.key === 'Escape') setPromptState(null); }}
            />
            <div className="kep-prompt-btns">
              <button onClick={confirmPrompt} disabled={!promptValue.trim()}>OK</button>
              <button onClick={() => setPromptState(null)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center' }}>
            <label>{deleteTarget.név}</label>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { setKépzettségek(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}>Képzettség törlése</button>
          </div>
        </div>,
        document.body
      )}

      {pendingEditIdx !== null && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{getDisplayName(képzettségek[pendingEditIdx]?.név ?? '')} — szint:</label>
            <div className="kep-szint-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                <button key={n} className={`fort-fok-btn ${képzettségek[pendingEditIdx!]?.szint === n ? 'active' : ''}`} onClick={() => { setKépzettségek(prev => prev.map((k, i) => i === pendingEditIdx ? { ...k, szint: n } : k)); setPendingEditIdx(null); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingNév && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Karakter neve:</label>
            <input
              autoFocus
              maxLength={40}
              value={tempNév}
              onChange={e => setTempNév(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && tempNév.trim()) { setNév(tempNév.trim()); setEditingNév(false); } if (e.key === 'Escape') setEditingNév(false); }}
            />
            <div className="kep-prompt-btns">
              <button onClick={() => { setNév(tempNév.trim()); setEditingNév(false); }} disabled={!tempNév.trim()}>OK</button>
              <button onClick={() => setEditingNév(false)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingTsz && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Tapasztalati szint</label>
            <div className="kep-szint-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', maxWidth: `${5 * 36 + 4 * 6}px`, margin: '0 auto' }}>
              {Array.from({ length: data.konstansok.arányok.max_tsz - 2 }, (_, i) => i + 3).map(n => (
                <button key={n} className={`fort-fok-btn ${tsz === n ? 'active' : ''}`} style={{ width: '36px', height: '36px' }} onClick={() => { setTsz(n); setEditingTsz(false); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}



      {editingKor && createPortal(
        <div className="kep-prompt-overlay">
          <KorPicker kor={kor} onSelect={v => { setKor(v); setEditingKor(false); }} />
        </div>,
        document.body
      )}

      {editingJátékos && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Játékos neve</label>
            <input autoFocus maxLength={40} value={tempJátékos} onChange={e => setTempJátékos(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setJátékos(tempJátékos); setEditingJátékos(false); } }} />
            <div className="kep-prompt-btns">
              <button onClick={() => { setJátékos(tempJátékos); setEditingJátékos(false); }}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {tradícióPicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tradíció választás</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              {data.tradiciok.map(t => (
                <button key={t.név} className="he-field-btn" onClick={() => {
                  if (t.altípusok.length > 0) {
                    setTradícióPicker(false);
                    setTradícióAltípusPicker(t.név);
                  } else {
                    const fullName = `Tradíció: ${t.név}`;
                    setKépzettségek(prev => [...prev, { név: fullName, szint: 0 }]);
                    setPendingEditIdx(képzettségek.length);
                    setTradícióPicker(false);
                  }
                }}>{t.név} {t.altípusok.length > 0 && '▸'} <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>({t.típus})</span></button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {tradícióAltípusPicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>{tradícióAltípusPicker} — altípus</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const trad = data.tradiciok.find(t => t.név === tradícióAltípusPicker);
                if (!trad) return null;
                const hasPantheon = trad.altípusok.some(a => a.pantheon);
                if (hasPantheon) {
                  const byPantheon = new Map<string, typeof trad.altípusok>();
                  for (const a of trad.altípusok) {
                    const p = a.pantheon || '';
                    const arr = byPantheon.get(p) || [];
                    arr.push(a);
                    byPantheon.set(p, arr);
                  }
                  const elements: ReactNode[] = [];
                  for (const [pantheon, items] of byPantheon) {
                    elements.push(<div key={`h-${pantheon}`} style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', borderBottom: '1px solid #444', paddingBottom: '2px' }}>{pantheon}</div>);
                    for (const item of items) {
                      elements.push(
                        <button key={item.név} className="he-field-btn" onClick={() => {
                          const fullName = `Tradíció: ${tradícióAltípusPicker} (${item.név})`;
                          setKépzettségek(prev => [...prev, { név: fullName, szint: 0 }]);
                          setPendingEditIdx(képzettségek.length);
                          setTradícióAltípusPicker(null);
                        }}>{item.név} {item.leírás && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>— {item.leírás}</span>}</button>
                      );
                    }
                  }
                  return elements;
                }
                return trad.altípusok.map(a => (
                  <button key={a.név} className="he-field-btn" onClick={() => {
                    const fullName = `Tradíció: ${tradícióAltípusPicker} (${a.név})`;
                    setKépzettségek(prev => [...prev, { név: fullName, szint: 0 }]);
                    setPendingEditIdx(képzettségek.length);
                    setTradícióAltípusPicker(null);
                  }}>{a.név}</button>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Tulajdonság cella --- */
function TulajdonsagCell({ név, érték, gameMode, onChange, fajMin, fajMax }: {
  név: string; érték: number; gameMode: boolean; onChange: (v: number) => void; fajMin?: number; fajMax?: number;
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

  const label = név.charAt(0).toUpperCase() + név.slice(1);
  const overLimit = fajMax !== undefined && érték > fajMax;
  const underLimit = fajMin !== undefined && érték < fajMin;
  const hasWarning = overLimit || underLimit;

  function handleTap() {
    if (!gameMode) { setEditing(true); }
  }

  return (
    <>
      <div
        className={`tul-cell ${!gameMode ? 'editable' : ''} ${hasWarning ? 'tul-warn' : ''}`}
        onClick={handleTap}
      >
        <span className="tul-label">{label}:</span>
        <span className={`tul-value ${hasWarning ? 'tul-value-warn' : ''}`}>{érték}</span>
        {hasWarning && (
          <div className="tul-warn-info">{overLimit ? `Faj max: ${fajMax}` : `Faj min: ${fajMin}`}</div>
        )}
      </div>
      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{label}</label>
            <div className="kep-szint-grid tul-val-grid">
              {[-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(n => (
                <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => { onChange(n); setEditing(false); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* --- Képzettség sor --- */
function KepzettsegRow({ slot, gameMode, onSzintChange, onRemove, kiterjesztesek, infoOpen, onInfoToggle, displayName, findDef, overLimit }: {
  slot: KepzettsegSlot;
  gameMode: boolean;
  onSzintChange: (szint: number) => void;
  onRemove: () => void;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  infoOpen: boolean;
  onInfoToggle: () => void;
  displayName: string;
  findDef: (név: string) => KepzettsegDef | undefined;
  overLimit: boolean;
}) {
  const [szintEditing, setSzintEditing] = useState(false);

  useEffect(() => {
    if (!szintEditing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSzintEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [szintEditing]);

  function handleTap() {
    if (gameMode) { onInfoToggle(); return; }
    setSzintEditing(true);
  }

  const def = findDef(slot.név);
  const kit = kiterjesztesek[slot.név] || [];

  return (
    <div className="kep-row-wrapper">
      <div
        className="kep-row"
        data-kep={slot.név}
        onClick={handleTap}
      >
        <span className={`kep-név${overLimit ? ' kep-over' : ''}`}>{displayName}</span>
        <span className="kep-right">
          {!gameMode && (
            <button className="kep-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`kep-szint ${slot.szint === 0 ? 'kep-szint-zero' : slot.szint >= 9 ? 'kep-szint-high' : ''}${overLimit ? ' kep-over' : ''}`}>{slot.szint}</span>
        </span>
      </div>
      {/* Game mód: adatlap */}
      {gameMode && infoOpen && def && (
        <div className="kep-info">
          <div className="kep-info-row"><span className="kep-info-label">Próba:</span> {def.próba}</div>
          {def.domináns_tulajdonságok.length > 0 && (
            <div className="kep-info-row"><span className="kep-info-label">Domináns:</span> {def.domináns_tulajdonságok.join(', ')}</div>
          )}
          {kit.length > 0 && (
            <div className="kep-info-row">
              <span className="kep-info-label">Kiterjeszti:</span>
              <span className="kep-info-kit">{kit.map(k => `${k.fortély}${k.típus === 'erős' ? ' (erős)' : ''}`).join(', ')}</span>
            </div>
          )}
        </div>
      )}
      {szintEditing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{displayName} — szint:</label>
            <div className="kep-szint-grid">
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
                <button key={n} className={`fort-fok-btn ${slot.szint === n ? 'active' : ''}`} onClick={() => { onSzintChange(n); setSzintEditing(false); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


function KorPicker({ onSelect }: { kor: number; onSelect: (v: number) => void }) {
  const [hundreds, setHundreds] = useState(0);
  const [tens, setTens] = useState<number | null>(null);
  const [ones, setOnes] = useState<number | null>(null);
  const value = tens !== null && ones !== null ? hundreds * 100 + tens * 10 + ones : null;

  useEffect(() => {
    if (value !== null) { setTimeout(() => onSelect(value), 500); }
  }, [value]);

  return (
    <div className="kep-prompt" style={{ alignItems: 'center', gap: 'min(10px, 1.5vh)' }}>
      <label>Kor: <strong>{value ?? '—'}</strong></label>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(10, 1fr)', gridTemplateColumns: '1fr 1fr 1fr', gridAutoFlow: 'column', gap: 'min(6px, 0.8vh)' }}>
        {Array.from({ length: 10 }, (_, d) => (
          <button key={`h${d}`} className={`fort-fok-btn ${hundreds === d ? 'active' : ''}`} style={{ width: 'min(42px, 6vh)', height: 'min(42px, 6vh)', fontSize: 'min(16px, 2vh)' }} onClick={() => setHundreds(d)}>{d}</button>
        ))}
        {Array.from({ length: 10 }, (_, d) => (
          <button key={`t${d}`} className={`fort-fok-btn ${tens === d ? 'active' : ''}`} style={{ width: 'min(42px, 6vh)', height: 'min(42px, 6vh)', fontSize: 'min(16px, 2vh)' }} onClick={() => setTens(d)}>{d}</button>
        ))}
        {Array.from({ length: 10 }, (_, d) => (
          <button key={`o${d}`} className={`fort-fok-btn ${ones === d ? 'active' : ''}`} style={{ width: 'min(42px, 6vh)', height: 'min(42px, 6vh)', fontSize: 'min(16px, 2vh)' }} onClick={() => setOnes(d)}>{d}</button>
        ))}
      </div>
    </div>
  );
}
