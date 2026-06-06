import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData, FortelySummary } from '../engine/data-loader';
import { testKarakter8 } from '../testdata';
import './FortelyokScreen.css';

const CSOPORT_SORREND = ['harci', 'általános', 'érzékek', 'szabad', 'kiemelt', 'misztikus'];
const CSOPORT_LABEL: Record<string, string> = {
  harci: '⚔️ Harci', általános: '🔧 Általános', érzékek: '👁️ Érzékek',
  szabad: '🆓 Szabad', kiemelt: '⭐ Kiemelt', misztikus: '✨ Misztikus',
};

interface FortelySlot {
  név: string;
  fok: number;
}

interface Props {
  data: GameData;
  gameMode: boolean;
  fortélyok: FortelySlot[];
  setFortélyok: React.Dispatch<React.SetStateAction<FortelySlot[]>>;
}

export function FortelyokScreen({ data, gameMode, fortélyok, setFortélyok }: Props) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; név: string; fok: number } | null>(null);
  const [pendingFortIdx, setPendingFortIdx] = useState<number | null>(null);

  // Escape bezárja az aktív popup-ot
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDeleteTarget(null); setPendingFortIdx(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const defsByGroup = new Map<string, FortelySummary[]>();
  for (const d of data.fortelySummaries) {
    const arr = defsByGroup.get(d.csoport) || [];
    arr.push(d);
    defsByGroup.set(d.csoport, arr);
  }

  function setFok(idx: number, fok: number) {
    setFortélyok(prev => prev.map((f, i) => i === idx ? { ...f, fok } : f));
  }

  // Többször felvehető fortélyok: generikus kezelés többszörös_típus alapján
  const [multiPickerDef, setMultiPickerDef] = useState<FortelySummary | null>(null);
  const [freetextValue, setFreetextValue] = useState('');

  function addFortely(név: string) {
    const def = data.fortelySummaries.find(d => d.név === név);
    if (def && def.többszörös_típus) {
      if (def.többszörös_lista.length > 0) {
        // Fix lista → dropdown picker
        setMultiPickerDef(def);
      } else {
        // Freetext
        setFreetextValue('');
        setMultiPickerDef(def);
      }
      return;
    }
    setFortélyok(prev => {
      if (def && def.maxfok > 1) setPendingFortIdx(prev.length);
      return [...prev, { név, fok: 1 }];
    });
  }

  function addMultiInstance(subName: string) {
    if (!multiPickerDef) return;
    setFortélyok(prev => [...prev, { név: `${multiPickerDef.név} - ${subName}`, fok: 1 }]);
    setMultiPickerDef(null);
  }

  function getFortelyokForCsoport(csoport: string): FortelySlot[] {
    const csoportNevek = (defsByGroup.get(csoport) || []).map(d => d.név);
    return fortélyok.filter(f => csoportNevek.includes(f.név) || csoportNevek.some(n => f.név.startsWith(n + ' - ')));
  }

  return (
    <div className="screen fort-screen">
      <div className="fort-section">
        {CSOPORT_SORREND.map(csoport => {
          const csoportDefs = defsByGroup.get(csoport) || [];
          const slotok = getFortelyokForCsoport(csoport);
          const usedNames = slotok.map(s => s.név);
          const többszörösNevek = new Set(data.fortelySummaries.filter(d => d.többszörös_típus).map(d => d.név));
          const available = csoportDefs.filter(d => !usedNames.includes(d.név) || többszörösNevek.has(d.név));
          const collapsed = collapsedGroups.has(csoport);

          return (
            <div key={csoport} className="fort-csoport">
              <h3 className="fort-csoport-label" onClick={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}>
                <span className="fort-csoport-arrow">{collapsed ? '▸' : '▾'}</span> {CSOPORT_LABEL[csoport]} <span className="dim">({slotok.length})</span>
              </h3>
              {!collapsed && (<>
                {slotok.map((slot, i) => {
                  const globalIdx = fortélyok.findIndex(f => f === slot);
                  const def = csoportDefs.find(d => d.név === slot.név || slot.név.startsWith(d.név + ' - '));
                  const isOpen = infoTarget === `${globalIdx}`;
                  // Ingyenes jelölés: többszörös fortélyoknál az első N db ingyenes
                  let isIngyenes = false;
                  if (def && def.ingyenes_perszint > 0) {
                    const ingyenesDb = Math.floor((testKarakter8.tsz + 1) / def.ingyenes_perszint);
                    const sameTypeSlots = slotok.filter(s => s.név === def.név || s.név.startsWith(def.név + ' - '));
                    const posInType = sameTypeSlots.indexOf(slot);
                    isIngyenes = posInType < ingyenesDb;
                  }
                  return (
                    <FortelyRow
                      key={`${csoport}-${i}`}
                      slot={slot}
                      def={def}
                      isIngyenes={isIngyenes}
                      gameMode={gameMode}
                      isOpen={isOpen}
                      onToggleInfo={() => setInfoTarget(isOpen ? null : `${globalIdx}`)}
                      onFokChange={fok => setFok(globalIdx, fok)}
                      onRemove={() => {
                        setDeleteTarget({ idx: globalIdx, név: slot.név, fok: slot.fok });
                      }}
                    />
                  );
                })}
                {!gameMode && available.length > 0 && (
                  <div className="fort-row fort-row-new">
                    <select
                      className="fort-select"
                      value=""
                      onChange={e => { if (e.target.value) addFortely(e.target.value); }}
                    >
                      <option value="">+ Új fortély...</option>
                      {available.map(d => {
                        let label = `${d.név} (max ${d.maxfok})`;
                        if (d.ingyenes_perszint > 0) {
                          const ingyenesDb = Math.floor((testKarakter8.tsz + 1) / d.ingyenes_perszint);
                          const felvettDb = fortélyok.filter(f => f.név === d.név || f.név.startsWith(d.név + ' - ')).length;
                          const maradtIngyenes = Math.max(0, ingyenesDb - felvettDb);
                          if (maradtIngyenes > 0) label += ` 🎁${maradtIngyenes}`;
                        } else if (d.kp_perfok < 0) {
                          const vals = Array.from({ length: d.maxfok }, (_, i) => Math.abs(d.kp_perfok) * (i + 1));
                          label += ` ➕${vals.join('-')}KP`;
                        }
                        return <option key={d.név} value={d.név}>{label}</option>;
                      })}
                    </select>
                  </div>
                )}
              </>)}
            </div>
          );
        })}
      </div>

      {deleteTarget && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>Törlöd: {deleteTarget.név} (fok: {deleteTarget.fok})?</label>
            <div className="kep-prompt-btns">
              <button className="btn-del-confirm" onClick={() => { setFortélyok(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}>Törlés</button>
              <button onClick={() => setDeleteTarget(null)}>Mégse</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {pendingFortIdx !== null && (() => {
        const pSlot = fortélyok[pendingFortIdx];
        const pDef = data.fortelySummaries.find(d => d.név === pSlot?.név);
        const pMaxfok = pDef?.maxfok ?? 1;
        return createPortal(
          <div className="kep-prompt-overlay">
            <div className="kep-prompt">
              <label>{pSlot?.név} — fok:</label>
              <div className="fort-fok-radios">
                {Array.from({ length: pMaxfok }, (_, i) => i + 1).map(f => (
                  <button key={f} className={`fort-fok-btn ${pSlot?.fok === f ? 'active' : ''}`} onClick={() => { setFortélyok(prev => prev.map((ft, i) => i === pendingFortIdx ? { ...ft, fok: f } : ft)); setPendingFortIdx(null); }}>{f}</button>
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
          // Fix lista dropdown
          const usedSubs = new Set(fortélyok.filter(f => f.név.startsWith(def.név + ' - ')).map(f => f.név.slice(def.név.length + 3)));
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
        } else {
          // Freetext
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
    </div>
  );
}

function FortelyRow({ slot, def, gameMode, isOpen, onToggleInfo, onFokChange, onRemove, isIngyenes }: {
  slot: FortelySlot;
  def?: FortelySummary;
  gameMode: boolean;
  isOpen: boolean;
  isIngyenes: boolean;
  onToggleInfo: () => void;
  onFokChange: (fok: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const maxfok = def?.maxfok ?? 1;
  const lastTap = useRef(0);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

  function handleTap() {
    if (gameMode) { onToggleInfo(); return; }
    if (maxfok <= 1) return;
    const now = Date.now();
    if (now - lastTap.current < 350) {
      setEditing(true);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  const fokDef = def?.fokok.find(f => f.fok === slot.fok);

  return (
    <div className="fort-row-wrapper">
      <div
        className="fort-row"
        onClick={handleTap}
      >
        <span className="fort-név">{slot.név}{isIngyenes ? ' 🎁' : ''}</span>
        <span className="fort-right">
          {!gameMode && (
            <button className="fort-delete" onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
          )}
          <span className={`fort-fok ${slot.fok >= maxfok ? 'fort-fok-max' : ''}`}>{slot.fok}</span>
        </span>
      </div>
      {isOpen && def && (
        <div className="fort-info">
          {def.leírás && <div className="fort-info-desc">{def.leírás}</div>}
          {fokDef && fokDef.hatás.length > 0 && (
            <div className="fort-info-row"><span className="fort-info-label">Hatás:</span> {fokDef.hatás.join(' ')}</div>
          )}
          {fokDef && fokDef.követelmény && (
            <div className="fort-info-row"><span className="fort-info-label">Követelmény:</span> {fokDef.követelmény}</div>
          )}
          {(def.kiterjeszti_normál.length > 0 || def.kiterjeszti_erős.length > 0) && (
            <div className="fort-info-row">
              <span className="fort-info-label">Kiterjeszti:</span>{' '}
              <span className="fort-info-kit">
                {def.kiterjeszti_normál.join(', ')}
                {def.kiterjeszti_erős.length > 0 && ` | Erős: ${def.kiterjeszti_erős.join(', ')}`}
              </span>
            </div>
          )}
        </div>
      )}
      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{slot.név} — fok:</label>
            <div className="fort-fok-radios">
              {Array.from({ length: maxfok }, (_, i) => i + 1).map(f => (
                <button key={f} className={`fort-fok-btn ${slot.fok === f ? 'active' : ''}`} onClick={() => { onFokChange(f); setEditing(false); }}>{f}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
