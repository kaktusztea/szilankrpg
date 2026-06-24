import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData, KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import type { Tulajdonsagok, Karakter } from '../engine/types';
import { TulajdonsagCell } from './TulajdonsagCell';
import { PrimerKpBox } from './PrimerKpBox';
import './TulajdonsagokScreen.css';


interface KepzettsegSlot {
  név: string;
  szint: number;
}

interface Props {
  data: GameData;
  gameMode: boolean;
  karakter: Karakter;
  tulajdonságok: Tulajdonsagok;
  setTulajdonságok: React.Dispatch<React.SetStateAction<Tulajdonsagok>>;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  név: string;
  setNév: (v: string) => void;
  becenév: string;
  setBecenév: (v: string) => void;
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

export function TulajdonsagokScreen({ data, gameMode, karakter, tulajdonságok, setTulajdonságok, képzettségek, setKépzettségek, név, setNév, becenév, setBecenév, játékos, setJátékos, tsz, setTsz, kor, setKor, faj, setFaj, anyanyelv, setAnyanyelv }: Props) {
  const felvettFortelyok = karakter.fortélyok.map(f => f.név);
  const [editingNév, setEditingNév] = useState(false);
  const [tempNév, setTempNév] = useState('');
  const [editingBecenév, setEditingBecenév] = useState(false);
  const [tempBecenév, setTempBecenév] = useState('');
  const [editingTsz, setEditingTsz] = useState(false);
  const [editingKor, setEditingKor] = useState(false);
  const [editingJátékos, setEditingJátékos] = useState(false);
  const [tempJátékos, setTempJátékos] = useState('');

  // Game mode: adatlap megjelenítés
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const TULAJDONSAG_NEVEK = (data.konstansok as any).tulajdonság_sorrend as (keyof Tulajdonsagok)[];
  const csoportSorrend = (data.konstansok as any).képzettség_csoport_sorrend as { id: string; label: string }[];
  const CSOPORT_SORREND = csoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(csoportSorrend.map(c => [c.id, c.label]));

  // Escape bezárja az aktív popup-ot
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingNév(false); setEditingBecenév(false); setEditingTsz(false);
        setEditingKor(false); setEditingJátékos(false); setDeleteTarget(null); setPendingEditIdx(null);
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
    // Többszörös prefixelt value: "AlapNév:AlNév" → tárolt név = "AlNév"
    // De ha a teljes név önálló képzettség (pl. "Arkánum: Időmágia"), megtartjuk
    let actualNév = név;
    if (név.includes(':') && !név.startsWith('__') && !data.kepzettsegDefs.some(d => d.név === név)) {
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
      {/* Fejléc: Név + Becenév + Szint */}
      <div className="tul-header" style={{ flexDirection: 'column', gap: '4px' }}>
        <div className="tul-header-box" style={{ width: '100%' }}
          onClick={() => { if (gameMode) return; setTempNév(név); setEditingNév(true); }}
        >
          <span className="tul-header-label">Név:</span> <strong>{gameMode ? `${név} (${faj}, ${kor})` : név}</strong>
        </div>
        {!gameMode && (
        <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
          <div className="tul-header-box" style={{ flex: 1 }}
            onClick={() => { setEditingBecenév(true); setTempBecenév(becenév); }}
          >
            <span className="tul-header-label">Becenév:</span> <strong>{becenév || '—'}</strong>
          </div>
          <div className="tul-header-box"
            onClick={() => { setEditingTsz(true); }}
          >
            <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
          </div>
        </div>
        )}
        {gameMode && (
        <div className="tul-header-box"
          onClick={() => {}}
        >
          <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
        </div>
        )}
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
            const aTrad = a.név.startsWith('Tradíció');
            const bTrad = b.név.startsWith('Tradíció');
            if (aTrad && !bTrad) return -1;
            if (bTrad && !aTrad) return 1;
            const aArk = a.név.startsWith('Arkánum');
            const bArk = b.név.startsWith('Arkánum');
            if (aArk && !bArk) return -1;
            if (bArk && !aArk) return 1;
            const aHm = a.név.startsWith('Harcmodor:');
            const bHm = b.név.startsWith('Harcmodor:');
            if (aHm && !bHm) return -1;
            if (bHm && !aHm) return 1;
            return a.név.localeCompare(b.név, 'hu');
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
                    warning={slot.név.startsWith('Arkánum') && !képzettségek.some(k => k.név.startsWith('Tradíció'))}
                    felvettFortelyok={felvettFortelyok}
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
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setEditingKor(false); }}>
          <KorPicker kor={kor} onSelect={v => { setKor(v); }} />
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

      {editingBecenév && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Becenév (max 12)</label>
            <input autoFocus maxLength={12} value={tempBecenév} onChange={e => setTempBecenév(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setBecenév(tempBecenév.trim()); setEditingBecenév(false); } if (e.key === 'Escape') setEditingBecenév(false); }} />
            <div className="kep-prompt-btns">
              <button onClick={() => { setBecenév(tempBecenév.trim()); setEditingBecenév(false); }}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {!gameMode && <PrimerKpBox data={data} karakter={karakter} képzettségek={képzettségek} />}
    </div>
  );
}

/* --- Képzettség sor --- */
function KepzettsegRow({ slot, gameMode, onSzintChange, onRemove, kiterjesztesek, infoOpen, onInfoToggle, displayName, findDef, overLimit, warning, felvettFortelyok }: {
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
  warning?: boolean;
  felvettFortelyok: string[];
}) {
  const [szintEditing, setSzintEditing] = useState(false);

  useEffect(() => {
    if (!szintEditing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSzintEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [szintEditing]);

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (gameMode) { onInfoToggle(); return; }
    const row = e.currentTarget;
    const delBtn = row.querySelector('.kep-delete') as HTMLElement | null;
    if (delBtn) {
      const btnRect = delBtn.getBoundingClientRect();
      if (e.clientX >= btnRect.left - 25) return;
    }
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
        <span className={`kep-név${overLimit || warning ? ' kep-over' : ''}`}>{displayName}</span>
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
          {kit.filter(k => k.típus !== 'erős').length > 0 && (
            <div className="kep-info-row">
              <span className="kep-info-label">Kiterjeszti Normál:</span>
              <span className="kep-info-kit">{kit.filter(k => k.típus !== 'erős').map((k, i) => (
                <span key={i} style={{ color: felvettFortelyok.includes(k.fortély) ? 'var(--success)' : '#e53935' }}>{i > 0 ? '; ' : ''}{k.fortély}</span>
              ))}</span>
            </div>
          )}
          {kit.filter(k => k.típus === 'erős').length > 0 && (
            <div className="kep-info-row">
              <span className="kep-info-label">Kiterjeszti Erős:</span>
              <span className="kep-info-kit">{kit.filter(k => k.típus === 'erős').map((k, i) => (
                <span key={i} style={{ color: felvettFortelyok.includes(k.fortély) ? 'var(--success)' : '#e53935' }}>{i > 0 ? '; ' : ''}{k.fortély}</span>
              ))}</span>
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


function KorPicker({ kor, onSelect }: { kor: number; onSelect: (v: number) => void }) {
  const [value, setValue] = useState(kor || 25);
  const holdRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({ active: false, timer: null });

  function startHold(dir: 1 | -1) {
    holdRef.current.active = true;
    let delay = 200;
    const startTime = Date.now();
    function tick() {
      if (!holdRef.current.active) return;
      const elapsed = Date.now() - startTime;
      const step = elapsed > 4000 ? 10 : 1;
      setValue(v => Math.max(1, Math.min(2000, v + dir * step)));
      delay = Math.max(30, delay * 0.82);
      holdRef.current.timer = setTimeout(tick, delay);
    }
    holdRef.current.timer = setTimeout(tick, delay);
  }
  function stopHold() {
    holdRef.current.active = false;
    if (holdRef.current.timer) { clearTimeout(holdRef.current.timer); holdRef.current.timer = null; }
  }

  useEffect(() => { onSelect(value); }, [value]);
  useEffect(() => () => stopHold(), []);

  return (
    <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px', padding: '16px', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}>
      <label style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Életkor</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => setValue(v => Math.max(1, v - 1))}
          onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}>−</button>
        <strong style={{ fontSize: '28px', minWidth: '60px', textAlign: 'center', userSelect: 'none' }}>{value}</strong>
        <button className="fort-fok-btn" style={{ width: '44px', height: '44px', fontSize: '22px' }}
          onClick={() => setValue(v => Math.min(2000, v + 1))}
          onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}>+</button>
      </div>
    </div>
  );
}
