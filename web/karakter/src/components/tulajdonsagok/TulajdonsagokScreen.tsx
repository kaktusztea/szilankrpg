import { useState, useEffect, useMemo } from 'react';
import type { Tulajdonsagok } from '../../engine/types';
import type { Props, KepzettsegSlot } from './types';
import { buildDefsByGroup, getDisplayName } from './helpers';
import { TulajdonsagokHeader } from './TulajdonsagokHeader';
import { KepzettsegCsoport } from './KepzettsegCsoport';
import { TulajdonsagokPopups } from './TulajdonsagokPopups';
import { PrimerKpBox } from './PrimerKpBox';
import './TulajdonsagokScreen.css';

export function TulajdonsagokScreen({
  data, gameMode, karakter, tulajdonságok, setTulajdonságok,
  képzettségek, setKépzettségek, név, setNév, becenév, setBecenév,
  játékos, setJátékos, tsz, setTsz, kor, setKor, faj, setFaj, anyanyelv, setAnyanyelv
}: Props) {
  const felvettFortelyok = karakter.fortélyok.map(f => f.név);

  // Editing states
  const [editingNév, setEditingNév] = useState(false);
  const [tempNév, setTempNév] = useState('');
  const [editingBecenév, setEditingBecenév] = useState(false);
  const [tempBecenév, setTempBecenév] = useState('');
  const [editingTsz, setEditingTsz] = useState(false);
  const [editingKor, setEditingKor] = useState(false);
  const [editingJátékos, setEditingJátékos] = useState(false);
  const [tempJátékos, setTempJátékos] = useState('');

  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [promptState, setPromptState] = useState<{ alapNév: string } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; név: string; szint: number } | null>(null);
  const [pendingEditIdx, setPendingEditIdx] = useState<number | null>(null);

  const csoportSorrend = data.konstansok.képzettség_csoport_sorrend;
  const CSOPORT_SORREND = csoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(csoportSorrend.map(c => [c.id, c.label]));

  const defsByGroup = useMemo(() => buildDefsByGroup(data.kepzettsegDefs), [data.kepzettsegDefs]);

  // Escape bezárja az aktív popup-ot
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setEditingNév(false); setEditingBecenév(false); setEditingTsz(false);
        setEditingKor(false); setEditingJátékos(false); setDeleteTarget(null);
        setPendingEditIdx(null); setPromptState(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function setTul(key: keyof Tulajdonsagok, val: number) {
    setTulajdonságok(prev => ({ ...prev, [key]: Math.max(-5, Math.min(7, val)) }));
  }

  function handleSzintChange(globalIdx: number, szint: number) {
    setKépzettségek(prev => prev.map((k, i) => i === globalIdx ? { ...k, szint } : k));
  }

  function handleRemove(globalIdx: number, slot: KepzettsegSlot) {
    if (slot.szint === 0) {
      setKépzettségek(prev => prev.filter((_, i) => i !== globalIdx));
    } else {
      setDeleteTarget({ idx: globalIdx, név: getDisplayName(slot.név, data.kepzettsegDefs), szint: slot.szint });
    }
  }

  function addKepzettseg(_csoport: string, név: string) {
    if (név.startsWith('__prompt:')) {
      const alapNév = név.slice('__prompt:'.length);
      setPromptState({ alapNév });
      setPromptValue('');
      return;
    }
    let actualNév = név;
    if (név.includes(':') && !név.startsWith('__') && !data.kepzettsegDefs.some(d => d.név === név)) {
      actualNév = név.split(':')[1];
    }
    setKépzettségek(prev => {
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

  return (
    <div className="screen tul-screen">
      <h2>🔵 Tulajdonságok / Képzettségek</h2>

      <TulajdonsagokHeader
        data={data} gameMode={gameMode}
        tulajdonságok={tulajdonságok} setTul={setTul}
        név={név} becenév={becenév} játékos={játékos} tsz={tsz} kor={kor} faj={faj} anyanyelv={anyanyelv}
        onEditNév={() => { setTempNév(név); setEditingNév(true); }}
        onEditBecenév={() => { setTempBecenév(becenév); setEditingBecenév(true); }}
        onEditTsz={() => setEditingTsz(true)}
        onEditKor={() => setEditingKor(true)}
        onEditJátékos={() => { setTempJátékos(játékos); setEditingJátékos(true); }}
        setFaj={setFaj} setAnyanyelv={setAnyanyelv}
      />

      {/* Képzettségek */}
      <div className="kep-section">
        {CSOPORT_SORREND.map(csoport => (
          <KepzettsegCsoport
            key={csoport}
            csoport={csoport}
            csoportLabel={CSOPORT_LABEL[csoport]}
            gameMode={gameMode}
            képzettségek={képzettségek}
            defsByGroup={defsByGroup}
            kepzettsegDefs={data.kepzettsegDefs}
            kiterjesztesek={data.kiterjesztesek}
            tsz={tsz}
            collapsed={collapsedGroups.has(csoport)}
            onToggleCollapse={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}
            infoTarget={infoTarget}
            setInfoTarget={setInfoTarget}
            felvettFortelyok={felvettFortelyok}
            onAddKepzettseg={addKepzettseg}
            onSzintChange={handleSzintChange}
            onRemove={handleRemove}
          />
        ))}
      </div>

      <TulajdonsagokPopups
        data={data} képzettségek={képzettségek} setKépzettségek={setKépzettségek}
        promptState={promptState} setPromptState={setPromptState}
        promptValue={promptValue} setPromptValue={setPromptValue} onConfirmPrompt={confirmPrompt}
        deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
        pendingEditIdx={pendingEditIdx} setPendingEditIdx={setPendingEditIdx}
        editingNév={editingNév} setEditingNév={setEditingNév} tempNév={tempNév} setTempNév={setTempNév} setNév={setNév}
        editingBecenév={editingBecenév} setEditingBecenév={setEditingBecenév} tempBecenév={tempBecenév} setTempBecenév={setTempBecenév} setBecenév={setBecenév}
        editingTsz={editingTsz} setEditingTsz={setEditingTsz} tsz={tsz} setTsz={setTsz}
        editingKor={editingKor} setEditingKor={setEditingKor} kor={kor} setKor={setKor}
        editingJátékos={editingJátékos} setEditingJátékos={setEditingJátékos} tempJátékos={tempJátékos} setTempJátékos={setTempJátékos} setJátékos={setJátékos}
      />

      {!gameMode && <PrimerKpBox data={data} karakter={karakter} képzettségek={képzettségek} />}
    </div>
  );
}
