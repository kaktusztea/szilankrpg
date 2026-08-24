import { useState, useMemo, useCallback } from 'react';
import type { Tulajdonsagok } from '../../engine/types';
import type { PróbaEnyhítés } from '../../engine/data-types';
import type { Props, KepzettsegSlot } from './types';
import { buildDefsByGroup, getDisplayName } from './helpers';
import { TulajdonsagokHeader } from './TulajdonsagokHeader';
import { KepzettsegCsoport } from './KepzettsegCsoport';
import { buildFortélyFokok } from './KepzettsegProbaPopup';
import { TulajdonsagokPopups, INITIAL_POPUP_STATE, type PopupState } from './TulajdonsagokPopups';
import { PrimerKpBox } from './PrimerKpBox';
import { ElotortenetOverlay } from './ElotortenetOverlay';
import { useEscapeClose } from './useEscapeClose';
import './TulajdonsagokScreen.css';

export function TulajdonsagokScreen({
  data, gameMode, karakter, setKarakter, tulajdonságok, setTulajdonságok,
  képzettségek, setKépzettségek, név, setNév, becenév, setBecenév,
  játékos, setJátékos, tsz, setTsz, kor, setKor, faj, setFaj, anyanyelv, setAnyanyelv,
  jk, setJk, onTestReset
}: Props) {
  const fortélyFokok = buildFortélyFokok(karakter.fortélyok);

  // Fortélyok próba-enyhítő hatásainak összegyűjtése képzettségenként
  const próbaEnyhítésekByKép = useMemo(() => {
    const result: Record<string, PróbaEnyhítés[]> = {};
    for (const kf of karakter.fortélyok) {
      const def = data.fortelySummaries.find(d => d.név === kf.név);
      if (!def) continue;
      const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
      const pe_lista = fokDef?.próba_enyhítések;
      if (!pe_lista || !pe_lista.length) continue;
      for (const pe of pe_lista) {
        (result[pe.képzettség] ??= []).push({ ...pe, fortély: kf.név });
      }
    }
    return result;
  }, [karakter.fortélyok, data.fortelySummaries]);

  const [popup, setPopup] = useState<PopupState>(INITIAL_POPUP_STATE);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showElotortenet, setShowElotortenet] = useState(false);

  const csoportSorrend = data.konstansok.képzettség_csoport_sorrend;
  const CSOPORT_SORREND = csoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(csoportSorrend.map(c => [c.id, c.label]));

  const defsByGroup = useMemo(() => buildDefsByGroup(data.kepzettsegDefs), [data.kepzettsegDefs]);

  // Escape bezárja az aktív popup-ot
  const hasAnyPopup = popup.editingNév || popup.editingBecenév || popup.editingTsz
    || popup.editingKor || popup.editingJátékos || popup.deleteTarget !== null
    || popup.pendingNew !== null || popup.promptState !== null;
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
    // Compute insert position without mutating — the képzettség is only added
    // once the user picks a szint (cancel = no insert, no undo entry).
    const parentDef = data.kepzettsegDefs.find(d =>
      d.többszörös.length > 0 && d.többszörös[0] !== '*' && d.többszörös.includes(actualNév)
    );
    let insertAt = képzettségek.length;
    if (parentDef) {
      const siblings = new Set(parentDef.többszörös);
      const lastIdx = képzettségek.reduce((acc, k, i) => siblings.has(k.név) ? i : acc, -1);
      insertAt = lastIdx + 1;
    }
    setPopup(p => ({ ...p, pendingNew: { név: actualNév, insertAt } }));
  }

  function confirmPrompt() {
    if (!popup.promptState || !popup.promptValue.trim()) return;
    const fullNév = `${popup.promptState.alapNév}: ${popup.promptValue.trim()}`;
    setPopup(p => ({ ...p, promptState: null, pendingNew: { név: fullNév, insertAt: képzettségek.length } }));
  }

  function toggleCollapse(csoport: string) {
    setCollapsedGroups(prev => {
      const n = new Set(prev);
      if (n.has(csoport)) n.delete(csoport); else n.add(csoport);
      return n;
    });
  }

  const isTestKarakter = karakter.uid === data.testKarakter.uid;

  return (
    <div className="screen tul-screen">
      <h2>🔵 Tulajdonságok / Képzettségek{isTestKarakter && onTestReset && (
        <button
          type="button"
          className="tul-test-reset-btn"
          title="Teszt karakter alapállapotba állítása"
          onClick={onTestReset}
        >🔄</button>
      )}</h2>

      <TulajdonsagokHeader
        data={data} gameMode={gameMode}
        tulajdonságok={tulajdonságok} setTul={setTul}
        név={név} becenév={becenév} játékos={játékos} tsz={tsz} kor={kor} faj={faj} anyanyelv={anyanyelv}
        jk={jk} setJk={setJk}
        onEditNév={() => setPopup(p => ({ ...p, editingNév: true, tempNév: név }))}
        onEditBecenév={() => setPopup(p => ({ ...p, editingBecenév: true, tempBecenév: becenév }))}
        onEditTsz={() => setPopup(p => ({ ...p, editingTsz: true }))}
        onEditKor={() => setPopup(p => ({ ...p, editingKor: true }))}
        onEditJátékos={() => setPopup(p => ({ ...p, editingJátékos: true, tempJátékos: játékos }))}
        setFaj={setFaj} setAnyanyelv={setAnyanyelv}
        onOpenElotortenet={() => setShowElotortenet(true)}
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
            tulajdonságok={tulajdonságok}
            fortélyFokok={fortélyFokok}
            onAddKepzettseg={addKepzettseg}
            onSzintChange={handleSzintChange}
            onRemove={handleRemove}
            aktívStátuszok={karakter.session.aktív_státuszok}
            statuszDefs={data.statuszok}
            próbaEnyhítésekByKép={próbaEnyhítésekByKép}
          />
        ))}
      </div>

      <TulajdonsagokPopups
        data={data} setKépzettségek={setKépzettségek}
        popup={popup} setPopup={setPopup} onConfirmPrompt={confirmPrompt}
        setNév={setNév} setBecenév={setBecenév}
        tsz={tsz} setTsz={setTsz} kor={kor} setKor={setKor} setJátékos={setJátékos}
      />

      {!gameMode && <PrimerKpBox data={data} karakter={karakter} képzettségek={képzettségek} />}

      {showElotortenet && (
        <ElotortenetOverlay
          karakter={karakter}
          setKarakter={setKarakter}
          data={data}
          onClose={() => setShowElotortenet(false)}
        />
      )}
    </div>
  );
}
