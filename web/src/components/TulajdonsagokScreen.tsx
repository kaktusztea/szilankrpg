import { useState, useRef, useEffect } from 'react';
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
  tsz: number;
  setTsz: (v: number) => void;
  kor: number;
  setKor: (v: number) => void;
  faj: string;
  setFaj: (v: string) => void;
}

export function TulajdonsagokScreen({ data, gameMode, tulajdonságok, setTulajdonságok, képzettségek, setKépzettségek, név, setNév, tsz, setTsz, kor, setKor, faj, setFaj }: Props) {
  const [editingNév, setEditingNév] = useState(false);
  const [tempNév, setTempNév] = useState('');
  const [editingTsz, setEditingTsz] = useState(false);
  const lastTapNév = useRef(0);
  const lastTapTsz = useRef(0);
  const [editingKor, setEditingKor] = useState(false);
  const lastTapKor = useRef(0);

  // Game mode: adatlap megjelenítés
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Escape bezárja az aktív popup-ot
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingNév(false); setEditingTsz(false);
        setEditingKor(false); setDeleteTarget(null); setPendingEditIdx(null);
        setPromptState(null);
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

  function addKepzettseg(_csoport: string, név: string) {
    if (név.startsWith('__prompt:')) {
      const alapNév = név.slice('__prompt:'.length);
      setPromptState({ alapNév });
      setPromptValue('');
      return;
    }
    setKépzettségek(prev => {
      // Ha többszörös alnév: csoportosítva szúrjuk be a testvérei mellé
      const parentDef = data.kepzettsegDefs.find(d =>
        d.többszörös.length > 0 && d.többszörös[0] !== '*' && d.többszörös.includes(név)
      );
      if (parentDef) {
        const siblings = new Set(parentDef.többszörös);
        const lastIdx = prev.reduce((acc, k, i) => siblings.has(k.név) ? i : acc, -1);
        const newArr = [...prev];
        const insertAt = lastIdx + 1;
        newArr.splice(insertAt, 0, { név, szint: 0 });
        setPendingEditIdx(insertAt);
        return newArr;
      }
      setPendingEditIdx(prev.length);
      return [...prev, { név, szint: 0 }];
    });
  }

  function confirmPrompt() {
    if (!promptState || !promptValue.trim()) return;
    setKépzettségek(prev => [...prev, { név: `${promptState.alapNév}: ${promptValue.trim()}`, szint: 0 }]);
    setPromptState(null);
  }

  // Megjelenítési név: többszörös képzettségeknél "AlapNév: AlNév" formátum
  function getDisplayName(név: string): string {
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
      if (d.többszörös.length > 0) {
        if (d.többszörös[0] === '*') {
          // Szabad szöveges — mindig elérhető
          options.push({ label: `${d.név} (új)`, value: `__prompt:${d.név}` });
        } else {
          for (const sub of d.többszörös) {
            if (!usedNames.includes(sub)) {
              options.push({ label: `${d.név}: ${sub}`, value: sub });
            }
          }
        }
      } else {
        if (!usedNames.includes(d.név)) {
          options.push({ label: d.név, value: d.név });
        }
      }
    }
    return options;
  }

  function getKepzettsegekForCsoport(csoport: string): KepzettsegSlot[] {
    const csoportDefs = defsByGroup.get(csoport) || [];
    const allValidNames = new Set<string>();
    const freeTextPrefixes: string[] = [];
    for (const d of csoportDefs) {
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
      {/* Fejléc: Név + Szint */}
      <div className="tul-header">
        <div className="tul-header-box tul-header-név"
          onClick={() => { if (gameMode) return; const now = Date.now(); if (now - lastTapNév.current < 350) { setTempNév(név); setEditingNév(true); lastTapNév.current = 0; } else { lastTapNév.current = now; } }}
        >
          <span className="tul-header-label">Név:</span> <strong>{gameMode ? `${név} (${faj}, ${kor})` : név}</strong>
        </div>
        <div
          className="tul-header-box"
          onClick={() => { if (gameMode) return; const now = Date.now(); if (now - lastTapTsz.current < 350) { setEditingTsz(true); lastTapTsz.current = 0; } else { lastTapTsz.current = now; } }}
        >
          <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
        </div>
      </div>

      {/* Faj + Kor - csak szerkesztő módban */}
      {!gameMode && (
        <div className="tul-faj-kor-row">
          <div className="tul-faj-row">
            <span className="tul-header-label">Faj:</span>
            <select className="faj-select" value={faj} onChange={e => setFaj(e.target.value)}>
              {data.fajNevek.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="tul-faj-row"
            onClick={() => { const now = Date.now(); if (now - lastTapKor.current < 350) { setEditingKor(true); lastTapKor.current = 0; } else { lastTapKor.current = now; } }}
          >
            <span className="tul-header-label">Kor:</span> <strong>{kor}</strong>
          </div>
        </div>
      )}

      {/* Tulajdonságok */}
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
          const slotok = getKepzettsegekForCsoport(csoport);
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
    </div>
  );
}

/* --- Tulajdonság cella --- */
function TulajdonsagCell({ név, érték, gameMode, onChange, fajMin, fajMax }: {
  név: string; érték: number; gameMode: boolean; onChange: (v: number) => void; fajMin?: number; fajMax?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const lastTap = useRef(0);

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
    const now = Date.now();
    if (now - lastTap.current < 350) {
      // Double tap
      if (!gameMode) { setEditing(true); }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      // Single tap: toggle warning
      if (hasWarning) setShowWarning(!showWarning);
    }
  }

  return (
    <>
      <div
        className={`tul-cell ${!gameMode ? 'editable' : ''} ${hasWarning ? 'tul-warn' : ''}`}
        onClick={handleTap}
      >
        <span className="tul-label">{label}:</span>
        <span className={`tul-value ${hasWarning ? 'tul-value-warn' : ''}`}>{érték}</span>
        {hasWarning && showWarning && (
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
function KepzettsegRow({ slot, gameMode, onSzintChange, onRemove, kiterjesztesek, infoOpen, onInfoToggle, displayName, findDef }: {
  slot: KepzettsegSlot;
  gameMode: boolean;
  onSzintChange: (szint: number) => void;
  onRemove: () => void;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  infoOpen: boolean;
  onInfoToggle: () => void;
  displayName: string;
  findDef: (név: string) => KepzettsegDef | undefined;
}) {
  const [szintEditing, setSzintEditing] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!szintEditing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSzintEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [szintEditing]);

  function handleTap() {
    if (gameMode) { onInfoToggle(); return; }
    const now = Date.now();
    if (now - lastTap.current < 350) {
      setSzintEditing(true);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
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
        <span className="kep-név">{displayName}</span>
        <span className="kep-right">
          {!gameMode && (
            <button className="kep-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`kep-szint ${slot.szint === 0 ? 'kep-szint-zero' : slot.szint >= 9 ? 'kep-szint-high' : ''}`}>{slot.szint}</span>
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

const KOR_RANGES = [
  { label: '10–100', values: Array.from({ length: 46 }, (_, i) => 10 + i * 2) },
  { label: '100–200', values: Array.from({ length: 21 }, (_, i) => 100 + i * 5) },
  { label: '200–1000', values: Array.from({ length: 17 }, (_, i) => 200 + i * 50) },
];

function KorPicker({ kor, onSelect }: { kor: number; onSelect: (v: number) => void }) {
  const [rangeIdx, setRangeIdx] = useState<number | null>(null);

  if (rangeIdx === null) {
    return (
      <div className="kep-prompt">
        <label>Kor: <strong>{kor}</strong> — tartomány:</label>
        <div className="kep-szint-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {KOR_RANGES.map((r, i) => (
            <button key={i} className="fort-fok-btn" style={{ width: 'auto', padding: '8px 16px', borderRadius: '6px' }} onClick={() => setRangeIdx(i)}>{r.label}</button>
          ))}
        </div>
      </div>
    );
  }

  const range = KOR_RANGES[rangeIdx];
  return (
    <div className="kep-prompt">
      <label>Kor ({range.label})</label>
      <div className="kep-szint-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', maxWidth: `${5 * 42 + 4 * 6}px`, margin: '0 auto' }}>
        {range.values.map(n => (
          <button key={n} className={`fort-fok-btn ${kor === n ? 'active' : ''}`} style={{ width: '42px', height: '36px', fontSize: '13px' }} onClick={() => onSelect(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}
