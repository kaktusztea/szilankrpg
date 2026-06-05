import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData, KepzettsegDef, KiterjesztesEntry } from '../engine/data-loader';
import type { Tulajdonsagok } from '../engine/types';
import { testKarakter8 } from '../testdata';
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
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
}

export function TulajdonsagokScreen({ data, gameMode, képzettségek, setKépzettségek }: Props) {
  const [tulajdonságok, setTulajdonságok] = useState<Tulajdonsagok>({ ...testKarakter8.tulajdonságok });
  const [név, setNév] = useState(testKarakter8.név);
  const [editingNév, setEditingNév] = useState(false);
  const [tempNév, setTempNév] = useState('');
  const [tsz, setTsz] = useState(testKarakter8.tsz);
  const [editingTsz, setEditingTsz] = useState(false);
  const [tempTsz, setTempTsz] = useState(testKarakter8.tsz);
  const tszLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const névLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [faj, setFaj] = useState(testKarakter8.hátterek.faj);
  const [editingFaj, setEditingFaj] = useState(false);
  const fajLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [kor, setKor] = useState(testKarakter8.kor);
  const [editingKor, setEditingKor] = useState(false);
  const [tempKor, setTempKor] = useState(testKarakter8.kor);
  const korLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Game mode: adatlap megjelenítés
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

  function setKepNév(idx: number, név: string) {
    setKépzettségek(prev => prev.map((k, i) => i === idx ? { ...k, név } : k));
  }

  // Szabad szöveges többszörös: custom dialógus
  const [promptState, setPromptState] = useState<{ alapNév: string } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  // Törlés megerősítés dialógus
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; név: string; szint: number } | null>(null);

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
        newArr.splice(lastIdx + 1, 0, { név, szint: 0 });
        return newArr;
      }
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
          onPointerDown={() => { if (!gameMode) névLongPress.current = setTimeout(() => { névLongPress.current = null; setTempNév(név); setEditingNév(true); }, 400); }}
          onPointerUp={() => { if (névLongPress.current) { clearTimeout(névLongPress.current); névLongPress.current = null; } }}
          onPointerCancel={() => { if (névLongPress.current) { clearTimeout(névLongPress.current); névLongPress.current = null; } }}
        >
          <span className="tul-header-label">Név:</span> <strong>{gameMode ? `${név} (${faj}, ${kor})` : név}</strong>
        </div>
        <div
          className="tul-header-box"
          onPointerDown={() => { if (!gameMode) tszLongPress.current = setTimeout(() => { tszLongPress.current = null; setTempTsz(tsz); setEditingTsz(true); }, 400); }}
          onPointerUp={() => { if (tszLongPress.current) { clearTimeout(tszLongPress.current); tszLongPress.current = null; } }}
          onPointerCancel={() => { if (tszLongPress.current) { clearTimeout(tszLongPress.current); tszLongPress.current = null; } }}
        >
          <span className="tul-header-label">Szint:</span> <strong>{tsz}</strong>
        </div>
      </div>

      {/* Faj + Kor - csak szerkesztő módban */}
      {!gameMode && (
        <div className="tul-faj-kor-row">
          <div className="tul-faj-row"
            onPointerDown={() => { fajLongPress.current = setTimeout(() => { fajLongPress.current = null; setEditingFaj(true); }, 400); }}
            onPointerUp={() => { if (fajLongPress.current) { clearTimeout(fajLongPress.current); fajLongPress.current = null; } }}
            onPointerCancel={() => { if (fajLongPress.current) { clearTimeout(fajLongPress.current); fajLongPress.current = null; } }}
          >
            <span className="tul-header-label">Faj:</span> <strong>{faj}</strong>
          </div>
          <div className="tul-faj-row"
            onPointerDown={() => { korLongPress.current = setTimeout(() => { korLongPress.current = null; setTempKor(kor); setEditingKor(true); }, 400); }}
            onPointerUp={() => { if (korLongPress.current) { clearTimeout(korLongPress.current); korLongPress.current = null; } }}
            onPointerCancel={() => { if (korLongPress.current) { clearTimeout(korLongPress.current); korLongPress.current = null; } }}
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
          />
        ))}
      </div>

      {/* Képzettségek */}
      <div className="kep-section">
        {CSOPORT_SORREND.map(csoport => {
          const csoportDefs = defsByGroup.get(csoport) || [];
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
                    csoportDefs={csoportDefs}
                    usedNames={usedNames.filter(n => n !== slot.név)}
                    gameMode={gameMode}
                    onNévChange={név => setKepNév(globalIdx, név)}
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
          <div className="kep-prompt">
            <label>Törlöd: {deleteTarget.név} (szint: {deleteTarget.szint})?</label>
            <div className="kep-prompt-btns">
              <button onClick={() => { setKépzettségek(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}>Törlés</button>
              <button onClick={() => setDeleteTarget(null)}>Mégse</button>
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
            <label>Tapasztalati szint: <strong>{tempTsz}</strong></label>
            <input
              type="range"
              min={1}
              max={data.konstansok.arányok.max_tsz}
              value={tempTsz}
              onChange={e => setTempTsz(Number(e.target.value))}
              className="tsz-slider"
            />
            <div className="kep-prompt-btns">
              <button onClick={() => { setTsz(tempTsz); setEditingTsz(false); }}>OK</button>
              <button onClick={() => setEditingTsz(false)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingFaj && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Faj:</label>
            <select
              className="kep-select"
              value={faj}
              autoFocus
              onChange={e => { setFaj(e.target.value); setEditingFaj(false); }}
            >
              {data.fajNevek.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="kep-prompt-btns">
              <button onClick={() => setEditingFaj(false)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingKor && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Kor: <strong>{tempKor}</strong></label>
            <input
              type="range"
              min={5}
              max={500}
              step={5}
              value={tempKor}
              onChange={e => setTempKor(Number(e.target.value))}
              className="tsz-slider"
            />
            <div className="kep-prompt-btns">
              <button onClick={() => { setKor(tempKor); setEditingKor(false); }}>OK</button>
              <button onClick={() => setEditingKor(false)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* --- Tulajdonság cella --- */
function TulajdonsagCell({ név, érték, gameMode, onChange }: {
  név: string; érték: number; gameMode: boolean; onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tempVal, setTempVal] = useState(érték);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label = név.charAt(0).toUpperCase() + név.slice(1);

  return (
    <>
      <div
        className={`tul-cell ${!gameMode ? 'editable' : ''}`}
        onPointerDown={() => { if (!gameMode) longPressTimer.current = setTimeout(() => { longPressTimer.current = null; setTempVal(érték); setEditing(true); }, 400); }}
        onPointerUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
        onPointerCancel={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
      >
        <span className="tul-label">{label}:</span>
        <span className="tul-value">{érték}</span>
      </div>
      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{label}: <strong>{tempVal}</strong></label>
            <input
              type="range"
              min={-5}
              max={7}
              value={tempVal}
              onChange={e => setTempVal(Number(e.target.value))}
              className="tsz-slider"
            />
            <div className="kep-prompt-btns">
              <button onClick={() => { onChange(tempVal); setEditing(false); }}>OK</button>
              <button onClick={() => setEditing(false)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* --- Képzettség sor --- */
function KepzettsegRow({ slot, csoportDefs, usedNames, gameMode, onNévChange, onSzintChange, onRemove, kiterjesztesek, infoOpen, onInfoToggle, displayName, findDef }: {
  slot: KepzettsegSlot;
  csoportDefs: KepzettsegDef[];
  usedNames: string[];
  gameMode: boolean;
  onNévChange: (név: string) => void;
  onSzintChange: (szint: number) => void;
  onRemove: () => void;
  kiterjesztesek: Record<string, KiterjesztesEntry[]>;
  infoOpen: boolean;
  onInfoToggle: () => void;
  displayName: string;
  findDef: (név: string) => KepzettsegDef | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [tempSzint, setTempSzint] = useState(slot.szint);
  const rowRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const available = csoportDefs.filter(d => !usedNames.includes(d.név));

  function szintFromPointer(clientX: number) {
    const rect = rowRef.current!.getBoundingClientRect();
    const margin = rect.width * 0.125;
    const x = Math.max(0, Math.min(1, (clientX - rect.left - margin) / (rect.width - 2 * margin)));
    return Math.round(x * 15);
  }

  // Szerkesztő mód: rövid kopp → dropdown, hosszú nyomás → szint csúszka
  function handlePointerDown(e: React.PointerEvent) {
    if (gameMode) return;
    const pointerId = e.pointerId;
    const target = e.target as HTMLElement;
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null;
      target.setPointerCapture(pointerId);
      setSliding(true);
      setTempSzint(szintFromPointer(e.clientX));
    }, 400);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!sliding) return;
    const val = szintFromPointer(e.clientX);
    setTempSzint(val);
    onSzintChange(val);
  }

  function handlePointerUp() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      // Rövid kopp
      if (gameMode) {
        onInfoToggle();
      } else {
        setEditing(true);
      }
    }
    if (sliding) {
      setSliding(false);
      onSzintChange(tempSzint);
    }
  }

  function handleClick() {
    if (gameMode) {
      onInfoToggle();
    }
  }

  const def = findDef(slot.név);
  const kit = kiterjesztesek[slot.név] || [];

  return (
    <div className="kep-row-wrapper">
      <div
        ref={rowRef}
        className={`kep-row ${sliding ? 'sliding' : ''}`}
        onPointerDown={!gameMode ? handlePointerDown : undefined}
        onPointerMove={!gameMode ? handlePointerMove : undefined}
        onPointerUp={!gameMode ? handlePointerUp : undefined}
        onPointerCancel={!gameMode ? handlePointerUp : undefined}
        onTouchStart={e => { if (!gameMode) e.stopPropagation(); }}
        onTouchEnd={e => { if (!gameMode) e.stopPropagation(); }}
        onClick={gameMode ? handleClick : undefined}
      >
        {editing && !gameMode ? (
          <select
            className="kep-select"
            value={slot.név}
            autoFocus
            onChange={e => { onNévChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
          >
            <option value={slot.név}>{slot.név}</option>
            {available.map(d => <option key={d.név} value={d.név}>{d.név}</option>)}
          </select>
        ) : (
          <span className="kep-név">{displayName}</span>
        )}
        <span className="kep-right">
          {!gameMode && !sliding && (
            <button className="kep-delete" onClick={e => {
              e.stopPropagation();
              onRemove();
            }}>✕</button>
          )}
          <span className="kep-szint">{sliding ? tempSzint : slot.szint}</span>
        </span>
        {sliding && (
          <div className="kep-slider-track"><div className="kep-slider-fill" style={{ width: `${(tempSzint / 15) * 100}%` }} /></div>
        )}
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
    </div>
  );
}
