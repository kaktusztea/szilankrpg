import { useState, useMemo, useCallback } from 'react';
import type { Tulajdonsagok } from '../../engine/types';
import type { Props, KepzettsegSlot } from './types';
import { buildDefsByGroup, getDisplayName } from './helpers';
import { TulajdonsagokHeader } from './TulajdonsagokHeader';
import { KepzettsegCsoport } from './KepzettsegCsoport';
import { TulajdonsagokPopups, INITIAL_POPUP_STATE, type PopupState } from './TulajdonsagokPopups';
import { PrimerKpBox } from './PrimerKpBox';
import { useEscapeClose } from './useEscapeClose';
import './TulajdonsagokScreen.css';

export function TulajdonsagokScreen({
  data, gameMode, karakter, tulajdonságok, setTulajdonságok,
  képzettségek, setKépzettségek, név, setNév, becenév, setBecenév,
  játékos, setJátékos, tsz, setTsz, kor, setKor, faj, setFaj, anyanyelv, setAnyanyelv
}: Props) {
  const felvettFortelyok = karakter.fortélyok.map(f => f.név);

  const [popup, setPopup] = useState<PopupState>(INITIAL_POPUP_STATE);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const csoportSorrend = data.konstansok.képzettség_csoport_sorrend;
  const CSOPORT_SORREND = csoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(csoportSorrend.map(c => [c.id, c.label]));

  const defsByGroup = useMemo(() => buildDefsByGroup(data.kepzettsegDefs), [data.kepzettsegDefs]);

  // Escape bezárja az aktív popup-ot
  const hasAnyPopup = popup.editingNév || popup.editingBecenév || popup.editingTsz
    || popup.editingKor || popup.editingJátékos || popup.deleteTarget !== null
    || popup.pendingEditIdx !== null || popup.promptState !== null;
  const resetPopups = useCallback(() => setPopup(INITIAL_POPUP_STATE), []);
  useEscapeClose(hasAnyPopup, resetPopups);

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
      setPopup(p => ({ ...p, deleteTarget: { idx: globalIdx, név: getDisplayName(slot.név, data.kepzettsegDefs), szint: slot.szint } }));
    }
  }

  function addKepzettseg(_csoport: string, név: string) {
    if (név.startsWith('__prompt:')) {
      const alapNév = név.slice('__prompt:'.length);
      setPopup(p => ({ ...p, promptState: { alapNév }, promptValue: '' }));
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
        setPopup(p => ({ ...p, pendingEditIdx: insertAt }));
        return newArr;
      }
      setPopup(p => ({ ...p, pendingEditIdx: prev.length }));
      return [...prev, { név: actualNév, szint: 0 }];
    });
  }

  function confirmPrompt() {
    if (!popup.promptState || !popup.promptValue.trim()) return;
    const fullNév = `${popup.promptState.alapNév}: ${popup.promptValue.trim()}`;
    setKépzettségek(prev => [...prev, { név: fullNév, szint: 0 }]);
    setPopup(p => ({ ...p, promptState: null, pendingEditIdx: képzettségek.length }));
  }

  function toggleCollapse(csoport: string) {
    setCollapsedGroups(prev => {
      const n = new Set(prev);
      if (n.has(csoport)) n.delete(csoport); else n.add(csoport);
      return n;
    });
  }

  return (
    <div className="screen tul-screen">
      <h2>🔵 Tulajdonságok / Képzettségek</h2>

      <TulajdonsagokHeader
        data={data} gameMode={gameMode}
        tulajdonságok={tulajdonságok} setTul={setTul}
        név={név} becenév={becenév} játékos={játékos} tsz={tsz} kor={kor} faj={faj} anyanyelv={anyanyelv}
        onEditNév={() => setPopup(p => ({ ...p, editingNév: true, tempNév: név }))}
        onEditBecenév={() => setPopup(p => ({ ...p, editingBecenév: true, tempBecenév: becenév }))}
        onEditTsz={() => setPopup(p => ({ ...p, editingTsz: true }))}
        onEditKor={() => setPopup(p => ({ ...p, editingKor: true }))}
        onEditJátékos={() => setPopup(p => ({ ...p, editingJátékos: true, tempJátékos: játékos }))}
        setFaj={setFaj} setAnyanyelv={setAnyanyelv}
      />

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
            onToggleCollapse={() => toggleCollapse(csoport)}
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
        popup={popup} setPopup={setPopup} onConfirmPrompt={confirmPrompt}
        setNév={setNév} setBecenév={setBecenév}
        tsz={tsz} setTsz={setTsz} kor={kor} setKor={setKor} setJátékos={setJátékos}
      />

      {!gameMode && <PrimerKpBox data={data} karakter={karakter} képzettségek={képzettségek} />}
    </div>
  );
}
