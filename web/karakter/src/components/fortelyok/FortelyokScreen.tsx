import { useState, useRef, useEffect, useMemo } from 'react';
import type { FortelyokScreenProps, DeleteTarget } from './types';
import { buildDefsByGroup, displayName, getFortelyokForCsoport } from './helpers';
import { FortelyCsoport } from './FortelyCsoport';
import { FokPickerPopup, MultiPicker, SzabadTypePickerPopup } from './FortelyPopups';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { useFortelyActions } from './useFortelyActions';
import { HINT_DURATION_MS } from '../../ui-constants';
import './FortelyokScreen.css';

export function FortelyokScreen({ data, gameMode, fortélyok, setFortélyok, tsz, fegyverNevek, távfegyverNevek, nyelvtanulásSzint, képzettségek }: FortelyokScreenProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const {
    pendingFortIdx, multiPickerDef, szabadTypePicker,
    setPendingFortIdx, setMultiPickerDef, setSzabadTypePicker,
    setFok, addFortely, addMultiInstance, confirmSzabad, confirmFok, pendingSlot,
  } = useFortelyActions({ data, fortélyok, setFortélyok });

  const fortCsoportSorrend = data.konstansok.fortély_csoport_sorrend;
  const CSOPORT_SORREND = fortCsoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(fortCsoportSorrend.map(c => [c.id, c.label]));
  const NYELV_FOK_LABELS: Record<number, string> = data.konstansok.nyelv_fok_nevek;
  const lockedSet = useMemo(() => new Set(data.konstansok.locked_fortélyok), [data]);
  const többszörösNevek = useMemo(() => new Set(data.fortelySummaries.filter(d => d.többszörös_típus).map(d => d.név)), [data]);
  const harcmodorNevek = useMemo(() => [...data.konstansok.harcmodorok.közelharci, ...data.konstansok.harcmodorok.távolsági], [data]);
  const defsByGroup = useMemo(() => buildDefsByGroup(data.fortelySummaries), [data]);

  useEffect(() => { setInfoTarget(null); }, [gameMode]);

  function showHint(msg: string, duration = HINT_DURATION_MS) {
    setHint(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), duration);
  }

  return (
    <div className="screen fort-screen">
      <h2>🟣 Fortélyok</h2>
      <div className="fort-section">
        {CSOPORT_SORREND.map(csoport => (
          <FortelyCsoport
            key={csoport}
            csoport={csoport}
            csoportLabel={CSOPORT_LABEL[csoport]}
            csoportDefs={defsByGroup.get(csoport) || []}
            slotok={getFortelyokForCsoport(csoport, fortélyok, defsByGroup, lockedSet)}
            collapsed={collapsedGroups.has(csoport)}
            gameMode={gameMode}
            tsz={tsz}
            lockedSet={lockedSet}
            többszörösNevek={többszörösNevek}
            fortélyok={fortélyok}
            fegyverNevek={fegyverNevek}
            távfegyverNevek={távfegyverNevek}
            nyelvtanulásSzint={nyelvtanulásSzint}
            nyelvFokLabels={NYELV_FOK_LABELS}
            képzettségek={képzettségek}
            harcmodorNevek={harcmodorNevek}
            data={data}
            onToggleCollapse={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}
            onAddFortely={addFortely}
            onToggleInfo={idx => setInfoTarget(prev => prev === `${idx}` ? null : `${idx}`)}
            onFokChange={setFok}
            onRemove={(idx) => setDeleteTarget({ idx, név: displayName(fortélyok[idx]), fok: fortélyok[idx]?.fok ?? 0 })}
            onHint={showHint}
            infoTarget={infoTarget}
          />
        ))}
      </div>

      {hint && <div className="fort-hint">{hint}</div>}

      {deleteTarget && (
        <DeleteConfirmPopup
          label={deleteTarget.név}
          buttonText="Fortély törlése"
          onConfirm={() => { setFortélyok(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {pendingFortIdx !== null && pendingSlot && (
        <FokPickerPopup
          slot={pendingSlot}
          maxfok={data.fortelySummaries.find(d => d.név === pendingSlot.név)?.maxfok ?? 1}
          nyelvFokLabels={NYELV_FOK_LABELS}
          onSelect={confirmFok}
          onCancel={() => setPendingFortIdx(null)}
        />
      )}

      {multiPickerDef && (
        <MultiPicker
          def={multiPickerDef}
          fortélyok={fortélyok}
          fegyverNevek={fegyverNevek}
          nyelvek={data.nyelvek}
          onSelect={addMultiInstance}
          onCancel={() => setMultiPickerDef(null)}
        />
      )}

      {szabadTypePicker && (
        <SzabadTypePickerPopup
          picker={szabadTypePicker}
          onFelvett={() => confirmSzabad(false)}
          onKiérdemelt={() => confirmSzabad(true)}
          onCancel={() => setSzabadTypePicker(null)}
        />
      )}
    </div>
  );
}
