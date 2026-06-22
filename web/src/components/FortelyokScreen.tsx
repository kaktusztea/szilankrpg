import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData, FortelySummary } from '../engine/data-loader';
import type { Fortely } from '../engine/types';
import './FortelyokScreen.css';

function fmtCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) => p.startsWith('`') && p.endsWith('`')
    ? <code key={i} style={{ fontFamily: 'monospace', background: '#333', padding: '0 3px', borderRadius: '2px' }}>{p.slice(1, -1)}</code>
    : p
  );
}

const CSOPORT_SORREND = ['harci', 'távharc', 'általános', 'érzékek', 'szabad', 'kiemelt', 'misztikus'];
const CSOPORT_LABEL: Record<string, string> = {
  harci: '⚔️ Harci', távharc: '🏹 Távharc', általános: '🔧 Általános', érzékek: '👁️ Érzékek',
  szabad: '🆓 Szabad', kiemelt: '⭐ Kiemelt', misztikus: '✨ Misztikus',
};

/** Display name: "Kultúrkör - erv" if spec_elem, otherwise just név */
function displayName(f: Fortely): string {
  const base = f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név;
  if (f.kiérdemelt) return f.fok > 1 ? `${base} 🎁➕` : `${base} 🎁`;
  return base;
}

const NYELV_FOK_LABELS: Record<number, string> = { 1: 'Alap', 2: 'Udvari' };

interface Props {
  data: GameData;
  gameMode: boolean;
  fortélyok: Fortely[];
  setFortélyok: React.Dispatch<React.SetStateAction<Fortely[]>>;
  tsz: number;
  fegyverNevek: string[];
  távfegyverNevek: string[];
  nyelvtanulásSzint: number;
  képzettségek: { név: string; szint: number }[];
}

export function FortelyokScreen({ data, gameMode, fortélyok, setFortélyok, tsz, fegyverNevek, távfegyverNevek, nyelvtanulásSzint, képzettségek }: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const lockedSet = new Set(data.konstansok.locked_fortélyok);
  const [hint, setHint] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showHint(msg: string, duration = 2000) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), duration);
  }
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  useEffect(() => { setInfoTarget(null); }, [gameMode]);
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; név: string; fok: number } | null>(null);
  const [pendingFortIdx, setPendingFortIdx] = useState<number | null>(null);
  const [szabadTypePicker, setSzabadTypePicker] = useState<{ név: string; spec_típus: string; spec_elem: string } | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMultiPickerDef(null); setDeleteTarget(null); setPendingFortIdx(null); setSzabadTypePicker(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const defsByGroup = new Map<string, FortelySummary[]>();
  for (const d of data.fortelySummaries) {
    const vizCsoport = (d as any).alcsoport === 'tavharc' ? 'távharc' : d.csoport;
    const arr = defsByGroup.get(vizCsoport) || [];
    arr.push(d);
    defsByGroup.set(vizCsoport, arr);
  }

  function setFok(idx: number, fok: number) {
    setFortélyok(prev => prev.map((f, i) => i === idx ? { ...f, fok } : f));
  }

  const [multiPickerDef, setMultiPickerDef] = useState<FortelySummary | null>(null);
  const [freetextValue, setFreetextValue] = useState('');

  function addFortely(név: string) {
    const def = data.fortelySummaries.find(d => d.név === név);
    // Szabad fortély: kérdezzük meg Felvett/Kiérdemelt
    if (def && def.csoport === 'szabad') {
      if (def.többszörös_típus) {
        if (def.többszörös_lista.length > 0) {
          setMultiPickerDef(def);
        } else {
          setFreetextValue('');
          setMultiPickerDef(def);
        }
        return;
      }
      setSzabadTypePicker({ név, spec_típus: '', spec_elem: '' });
      return;
    }
    if (def && def.többszörös_típus) {
      if (def.többszörös_lista.length > 0) {
        setMultiPickerDef(def);
      } else {
        setFreetextValue('');
        setMultiPickerDef(def);
      }
      return;
    }
    setFortélyok(prev => {
      if (def && def.maxfok > 1) {
        setPendingFortIdx(prev.length);
        return [...prev, { név, fok: 0, spec_típus: '', spec_elem: '' }];
      }
      return [...prev, { név, fok: 1, spec_típus: '', spec_elem: '' }];
    });
  }

  function addMultiInstance(subName: string) {
    if (!multiPickerDef) return;
    if (multiPickerDef.csoport === 'szabad') {
      setSzabadTypePicker({ név: multiPickerDef.név, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName });
      setMultiPickerDef(null);
      return;
    }
    const maxfok = multiPickerDef.maxfok;
    setFortélyok(prev => {
      if (maxfok > 1) setPendingFortIdx(prev.length);
      return [...prev, { név: multiPickerDef.név, fok: maxfok > 1 ? 0 : 1, spec_típus: multiPickerDef.többszörös_típus, spec_elem: subName }];
    });
    setMultiPickerDef(null);
  }

  function getFortelyokForCsoport(csoport: string): Fortely[] {
    const csoportNevek = new Set((defsByGroup.get(csoport) || []).map(d => d.név));
    const items = fortélyok.filter(f => csoportNevek.has(f.név));
    // Group by név (identical names together), locked fortélyok always first, then by fok desc
    items.sort((a, b) => {
      const aLocked = lockedSet.has(a.név);
      const bLocked = lockedSet.has(b.név);
      if (aLocked && !bLocked) return -1;
      if (bLocked && !aLocked) return 1;
      const nameComp = a.név.localeCompare(b.név);
      if (nameComp !== 0) return nameComp;
      return b.fok - a.fok;
    });
    return items;
  }

  return (
    <div className="screen fort-screen">
      <h2>🟣 Fortélyok</h2>
      <div className="fort-section">
        {CSOPORT_SORREND.map(csoport => {
          const csoportDefs = defsByGroup.get(csoport) || [];
          const slotok = getFortelyokForCsoport(csoport);
          if (gameMode && slotok.length === 0) return null;
          // A nem-többszörös fortélyok egyszer vehetők fel; többszörösök mindig elérhetők
          const usedNonMulti = new Set(slotok.filter(f => !f.spec_típus).map(f => f.név));
          const többszörösNevek = new Set(data.fortelySummaries.filter(d => d.többszörös_típus).map(d => d.név));
          const available = csoportDefs.filter(d => (!usedNonMulti.has(d.név) || többszörösNevek.has(d.név)) && !lockedSet.has(d.név));
          const collapsed = collapsedGroups.has(csoport);

          return (
            <div key={csoport} className="fort-csoport">
              <h3 className="fort-csoport-label" onClick={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}>
                <span className="fort-csoport-arrow">{collapsed ? '▸' : '▾'}</span> {CSOPORT_LABEL[csoport]} <span className="dim">({slotok.length})</span>
              </h3>
              {!collapsed && (<>
                {(() => {
                  // Nyelvismeret pont keret és túllépés számítás
                  const nyelvPontKeret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
                  const nyelvismeretSlotok = slotok.filter(s => s.név === 'Nyelvismeret');
                  const nyelvÖsszFok = nyelvismeretSlotok.filter(s => !s.kiérdemelt).reduce((s, f) => s + f.fok, 0)
                    + nyelvismeretSlotok.filter(s => !!s.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
                  const nyelvTúllépés = Math.max(0, nyelvÖsszFok - nyelvPontKeret);
                  // Mark last N foks as over (from end — includes kiérdemelt with fok>1)
                  let maradékTúl = nyelvTúllépés;
                  const nyelvOverSet = new Set<Fortely>();
                  const fizetősNyelvek = nyelvismeretSlotok.filter(s => !s.kiérdemelt || s.fok > 1);
                  for (let j = fizetősNyelvek.length - 1; j >= 0 && maradékTúl > 0; j--) {
                    nyelvOverSet.add(fizetősNyelvek[j]);
                    maradékTúl -= fizetősNyelvek[j].kiérdemelt ? fizetősNyelvek[j].fok - 1 : fizetősNyelvek[j].fok;
                  }
                  return slotok.map((slot, i) => {
                  const globalIdx = fortélyok.indexOf(slot);
                  const def = csoportDefs.find(d => d.név === slot.név);
                  const isOpen = infoTarget === `${globalIdx}`;
                  let isIngyenes = false;
                  if (csoport === 'szabad') {
                    if (slot.kiérdemelt) {
                      isIngyenes = true;
                    } else {
                      const nonKierdemeltIdx = slotok.filter(s => !s.kiérdemelt).indexOf(slot);
                      isIngyenes = nonKierdemeltIdx < tsz;
                    }
                  } else if (def && def.ingyenes_perszint > 0) {
                    const ingyenesDb = Math.floor((tsz + 1) / def.ingyenes_perszint);
                    const sameTypeSlots = slotok.filter(s => s.név === def.név);
                    const posInType = sameTypeSlots.indexOf(slot);
                    isIngyenes = posInType < ingyenesDb;
                  }
                  return (
                    <FortelyRow
                      key={`${csoport}-${i}`}
                      slot={slot}
                      def={def}
                      isIngyenes={isIngyenes}
                      locked={lockedSet.has(slot.név)}
                      gameMode={gameMode}
                      isOpen={isOpen}
                      overLimit={slot.név === 'Nyelvismeret' && nyelvOverSet.has(slot)}
                      nyelvPontKeret={slot.név === 'Nyelvismeret' ? nyelvPontKeret : undefined}
                      képzettségek={képzettségek}
                      fortélyok={fortélyok}
                      harcmodorNevek={[...data.konstansok.harcmodorok.közelharci, ...data.konstansok.harcmodorok.távolsági]}
                      távfegyverNevek={távfegyverNevek}
                      onToggleInfo={() => setInfoTarget(isOpen ? null : `${globalIdx}`)}
                      onFokChange={fok => setFok(globalIdx, fok)}
                      onHint={showHint}
                      onRemove={() => {
                        setDeleteTarget({ idx: globalIdx, név: displayName(slot), fok: slot.fok });
                      }}
                    />
                  );
                });
                })()}
                {!gameMode && available.length > 0 && (
                  <div className="fort-row fort-row-new">
                    <select
                      className="fort-select"
                      value=""
                      onChange={e => { if (e.target.value) addFortely(e.target.value); }}
                    >
                      <option value="">+ Új fortély...</option>
                      {available.map(d => {
                        let label = `${d.név} (${d.maxfok})`;
                        if (csoport === 'szabad') {
                          const nonKierdemelt = slotok.filter(s => !s.kiérdemelt).length;
                          const maradtIngyenes = Math.max(0, tsz - nonKierdemelt);
                          if (maradtIngyenes > 0) label += ` 🎁${maradtIngyenes}`;
                        } else if (d.ingyenes_perszint > 0) {
                          const ingyenesDb = Math.floor((tsz + 1) / d.ingyenes_perszint);
                          const felvettDb = fortélyok.filter(f => f.név === d.név).length;
                          const maradtIngyenes = Math.max(0, ingyenesDb - felvettDb);
                          if (maradtIngyenes > 0) label += ` 🎁${maradtIngyenes}`;
                        } else if (d.kp_perfok < 0) {
                          const vals = Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1));
                          label += ` ➕${vals.join('-')}KP`;
                        }
                        const fegyverDisabled = d.többszörös_típus === 'fegyver' && (fegyverNevek.length === 0 || fegyverNevek.every(n => fortélyok.some(f => f.név === d.név && f.spec_elem === n)));
                        let nyelvDisabled = false;
                        if (d.név === 'Nyelvismeret') {
                          const keret = Math.max(0, (nyelvtanulásSzint - 3) * 3);
                          const used = fortélyok.filter(f => f.név === 'Nyelvismeret' && !f.kiérdemelt).reduce((s, f) => s + f.fok, 0)
                            + fortélyok.filter(f => f.név === 'Nyelvismeret' && f.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
                          const maradt = keret - used;
                          if (maradt > 0) label += ` 🎁${maradt}`;
                          nyelvDisabled = maradt <= 0;
                        }
                        return <option key={d.név} value={d.név} disabled={fegyverDisabled || nyelvDisabled}>{label}</option>;
                      })}
                    </select>
                  </div>
                )}
              </>)}
            </div>
          );
        })}
      </div>

      {hint && <div className="fort-hint">{hint}</div>}

      {deleteTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center' }}>
            <label>{deleteTarget.név}</label>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { setFortélyok(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}>Fortély törlése</button>
          </div>
        </div>,
        document.body
      )}

      {pendingFortIdx !== null && (() => {
        const pSlot = fortélyok[pendingFortIdx];
        const pDef = data.fortelySummaries.find(d => d.név === pSlot?.név);
        const pMaxfok = pDef?.maxfok ?? 1;
        const isNyelv = pSlot?.név === 'Nyelvismeret';
        return createPortal(
          <div className="kep-prompt-overlay">
            <div className="kep-prompt">
              <label>{isNyelv ? displayName(pSlot) : `${pSlot?.név} — fok:`}</label>
              <div className="fort-fok-radios">
                {Array.from({ length: pMaxfok }, (_, i) => i + 1).map(f => (
                  <button key={f} className={`fort-fok-btn ${pSlot?.fok === f ? 'active' : ''}`} style={isNyelv ? { width: 'auto', padding: '6px 14px', borderRadius: '6px' } : undefined} onClick={() => { setFortélyok(prev => prev.map((ft, i) => i === pendingFortIdx ? { ...ft, fok: f } : ft)); setPendingFortIdx(null); }}>{isNyelv ? NYELV_FOK_LABELS[f] ?? f : f}</button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {multiPickerDef && (() => {
        const def = multiPickerDef;
        if (def.többszörös_lista.length > 0) {
          const usedSubs = new Set(fortélyok.filter(f => f.név === def.név).map(f => f.spec_elem));
          const availSubs = def.többszörös_lista.filter(s => !usedSubs.has(s));
          return createPortal(
            <div className="kep-prompt-overlay">
              <div className="kep-prompt">
                <label>{def.név} — {def.többszörös_típus}:</label>
                <select
                  className="fort-select"
                  autoFocus
                  value=""
                  onChange={e => { if (e.target.value) addMultiInstance(e.target.value); }}
                >
                  <option value="">Válassz...</option>
                  {availSubs.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="kep-prompt-btns">
                  <button onClick={() => setMultiPickerDef(null)}>Mégse</button>
                </div>
              </div>
            </div>,
            document.body
          );
        } else if (def.többszörös_típus === 'fegyver') {
          const usedSubs = new Set(fortélyok.filter(f => f.név === def.név).map(f => f.spec_elem));
          const availFegyverek = fegyverNevek.filter(n => !usedSubs.has(n));
          return createPortal(
            <div className="kep-prompt-overlay">
              <div className="kep-prompt">
                <label>{def.név} — fegyver:</label>
                <select
                  className="fort-select"
                  autoFocus
                  value=""
                  onChange={e => { if (e.target.value) addMultiInstance(e.target.value); }}
                >
                  <option value="">Válassz fegyvert...</option>
                  {availFegyverek.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="kep-prompt-btns">
                  <button onClick={() => setMultiPickerDef(null)}>Mégse</button>
                </div>
              </div>
            </div>,
            document.body
          );
        } else if (def.többszörös_típus === 'nyelv') {
          const usedSubs = new Set(fortélyok.filter(f => f.név === def.név).map(f => f.spec_elem));
          const availNyelvek = data.nyelvek.filter(n => !usedSubs.has(n.név));
          const byGroup = new Map<string, typeof availNyelvek>();
          for (const n of availNyelvek) {
            const arr = byGroup.get(n.csoport) || [];
            arr.push(n);
            byGroup.set(n.csoport, arr);
          }
          return createPortal(
            <div className="kep-prompt-overlay">
              <div className="kep-prompt nyelv-picker">
                {[...byGroup.entries()].map(([group, langs]) => (
                  <div key={group} className="nyelv-csoport">
                    <div className="nyelv-csoport-label">{group}</div>
                    {langs.map(l => (
                      <button key={l.név} className="nyelv-btn" onClick={() => addMultiInstance(l.név)}>{l.név}</button>
                    ))}
                  </div>
                ))}
              </div>
            </div>,
            document.body
          );
        } else {
          return createPortal(
            <div className="kep-prompt-overlay">
              <div className="kep-prompt">
                <label>{def.név} — {def.többszörös_típus}:</label>
                <input
                  autoFocus
                  maxLength={20}
                  value={freetextValue}
                  onChange={e => setFreetextValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && freetextValue.trim()) addMultiInstance(freetextValue.trim()); if (e.key === 'Escape') setMultiPickerDef(null); }}
                />
                <div className="kep-prompt-btns">
                  <button onClick={() => { if (freetextValue.trim()) addMultiInstance(freetextValue.trim()); }} disabled={!freetextValue.trim()}>OK</button>
                  <button onClick={() => setMultiPickerDef(null)}>Mégse</button>
                </div>
              </div>
            </div>,
            document.body
          );
        }
      })()}

      {szabadTypePicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{szabadTypePicker.spec_elem ? `${szabadTypePicker.név} - ${szabadTypePicker.spec_elem}` : szabadTypePicker.név}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => {
                const p = szabadTypePicker;
                setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem }]);
                setSzabadTypePicker(null);
              }}>6/0 Felvett</button>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => {
                const p = szabadTypePicker;
                setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem, kiérdemelt: true }]);
                setSzabadTypePicker(null);
              }}>⭐ Kiérdemelt</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function FortelyRow({ slot, def, gameMode, isOpen, onToggleInfo, onFokChange, onRemove, isIngyenes, locked, onHint, overLimit, nyelvPontKeret, képzettségek, fortélyok, harcmodorNevek, távfegyverNevek }: {
  slot: Fortely;
  def?: FortelySummary;
  gameMode: boolean;
  isOpen: boolean;
  isIngyenes: boolean;
  locked: boolean;
  overLimit: boolean;
  nyelvPontKeret?: number;
  képzettségek: { név: string; szint: number }[];
  fortélyok: Fortely[];
  harcmodorNevek: string[];
  távfegyverNevek: string[];
  onToggleInfo: () => void;
  onFokChange: (fok: number) => void;
  onRemove: () => void;
  onHint: (msg: string, duration?: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const maxfok = def?.maxfok ?? 1;

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

  function handleTap() {
    if (gameMode) { onToggleInfo(); return; }
    if (locked) { onHint(távfegyverNevek.includes(slot.spec_elem) ? 'Ezt a fortélyt a Távharc fülön kezeld!' : 'Ezt a fortélyt a Harcértékek fülön kezeld!', 3000); }
    else if (maxfok <= 1) { onHint('1 fok a maximum'); }
    else { setEditing(true); }
  }

  const fokDef = def?.fokok.find(f => f.fok === slot.fok);
  const label = displayName(slot);

  // Követelmény ellenőrzés
  const hiányzóKöv: string[] = [];
  if (fokDef?.követelmények && fokDef.követelmények.length > 0) {
    for (const kov of fokDef.követelmények) {
      if (kov.típus === 'képzettség') {
        const nevek = Array.isArray(kov.név) ? kov.név : [kov.név];
        const teljesül = nevek.some(n => (képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték);
        if (!teljesül) {
          const isHarcmodor = Array.isArray(kov.név) && kov.név.every(n => harcmodorNevek.some(h => h.toLowerCase() === n.toLowerCase()));
          hiányzóKöv.push(`${isHarcmodor ? 'Harcmodor' : (Array.isArray(kov.név) ? kov.név.join('/') : kov.név)} ≥ ${kov.érték}`);
        }
      } else if (kov.típus === 'fortély') {
        const név = Array.isArray(kov.név) ? kov.név[0] : kov.név;
        const megvan = fortélyok.some(f => f.név.toLowerCase() === név.toLowerCase() && f.fok >= kov.érték);
        if (!megvan) hiányzóKöv.push(`${név} fortély ≥ ${kov.érték}. fok`);
      }
    }
  }
  const követelményHiba = hiányzóKöv.length > 0;

  return (
    <div className="fort-row-wrapper">
      <div
        className={`fort-row${követelményHiba ? ' fort-kov-hiba' : ''}`}
        onClick={handleTap}
      >
        <span className={`fort-név${overLimit ? ' fort-over' : ''}`}>{label}{isIngyenes ? ' 🎁' : ''}</span>
        <span className="fort-right">
          {!gameMode && !locked && !slot.kiérdemelt && (
            <button className="fort-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`fort-fok ${slot.fok >= maxfok ? 'fort-fok-max' : ''}${overLimit ? ' fort-over' : ''}`}>{slot.név === 'Nyelvismeret' ? NYELV_FOK_LABELS[slot.fok] ?? slot.fok : (
            <span className="fort-fok-dots">{Array.from({ length: 3 }, (_, i) => <span key={i} className={`fort-dot${i < slot.fok ? ' filled' : ''}${i >= maxfok ? ' fort-dot-hidden' : ''}`} />)}</span>
          )}</span>
        </span>
      </div>
      {isOpen && def && (
        <div className="fort-info">
          {def.leírás && <div className="fort-info-desc">{fmtCode(def.leírás)}</div>}
          {fokDef && fokDef.hatás.length > 0 && (
            <div className="fort-info-row"><span className="fort-info-label">Hatás:</span> {fmtCode(fokDef.hatás.join(' '))}</div>
          )}
          {fokDef && fokDef.követelmény && (
            <div className="fort-info-row"><span className="fort-info-label">Követelmény:</span> {fokDef.követelmény}</div>
          )}
          {(def.kiterjeszti_normál.length > 0 || def.kiterjeszti_erős.length > 0) && (
            <div className="fort-info-row">
              <span className="fort-info-label">Kiterjeszti:</span>{' '}
              <span className="fort-info-kit">
                {def.kiterjeszti_normál.map((kn: string, ki: number) => (
                  <span key={ki} style={{ color: képzettségek.some((k: { név: string; szint: number }) => k.név === kn && k.szint >= 1) ? 'var(--success)' : '#e53935' }}>{ki > 0 ? ', ' : ''}{kn}</span>
                ))}
                {def.kiterjeszti_erős.length > 0 && <>{' | Erős: '}{def.kiterjeszti_erős.map((kn: string, ki: number) => (
                  <span key={ki} style={{ color: képzettségek.some((k: { név: string; szint: number }) => k.név === kn && k.szint >= 1) ? 'var(--success)' : '#e53935' }}>{ki > 0 ? ', ' : ''}{kn}</span>
                ))}</>}
              </span>
            </div>
          )}
        </div>
      )}
      {overLimit && isOpen && (
        <div className="fort-info" style={{ color: 'var(--error)' }}>
          A felvehető Nyelvismeret fokok száma a Nyelvtanulás képzettség szintjétől függ. Túllépted a keretet! Max tanulható fok: {nyelvPontKeret ?? 0}
        </div>
      )}
      {követelményHiba && (
        <div className="fort-info" style={{ color: 'var(--error)' }}>
          ⚠ Követelmény: {hiányzóKöv.join(', ')}
        </div>
      )}
      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={slot.név === 'Nyelvismeret' ? { textAlign: 'center', width: '100%' } : undefined}>{slot.név === 'Nyelvismeret' ? label : `${label} — fok:`}</label>
            <div className="fort-fok-radios">
              {Array.from({ length: maxfok }, (_, i) => i + 1).map(f => (
                <button key={f} className={`fort-fok-btn ${slot.fok === f ? 'active' : ''}`} style={slot.név === 'Nyelvismeret' ? { width: 'auto', padding: '6px 14px', borderRadius: '6px' } : undefined} onClick={() => { onFokChange(f); setEditing(false); }}>{slot.név === 'Nyelvismeret' ? NYELV_FOK_LABELS[f] ?? f : f}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
