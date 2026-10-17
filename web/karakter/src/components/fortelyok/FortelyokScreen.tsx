import { useState, useEffect, useMemo } from 'react';
import type { FortelyokScreenProps, DeleteTarget } from './types';
import { buildDefsByGroup, displayName, getFortelyokForCsoport, calcSzabadFelvettKp } from './helpers';
import { FortelyCsoport } from './FortelyCsoport';
import { FokPickerPopup, MultiPicker, SzabadTypePickerPopup, EgyediFortelyPopup } from './FortelyPopups';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { useFortelyActions } from './useFortelyActions';
import { HINT_DURATION_MS } from '../../ui-constants';
import { useHint } from '../harcertekek/hooks/useHint';
import './FortelyokScreen.css';

export function FortelyokScreen({ data, gameMode, fortélyok, setFortélyok, karakter, setKarakter, tsz, fegyverNevek, nyelvtanulásSzint, képzettségek }: FortelyokScreenProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { hint, showHint } = useHint(HINT_DURATION_MS);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const {
    pendingFort, multiPickerDef, szabadTypePicker, egyediPicker,
    setPendingFort, setMultiPickerDef, setSzabadTypePicker, setEgyediPicker,
    setFok, addFortely, addMultiInstance, confirmSzabad, confirmEgyedi, confirmFok, pendingSlot,
  } = useFortelyActions({ data, fortélyok, setFortélyok, karakter, setKarakter });

  const fortCsoportSorrend = data.konstansok.fortély_csoport_sorrend;
  const CSOPORT_SORREND = fortCsoportSorrend.map(c => c.id);
  const CSOPORT_LABEL: Record<string, string> = Object.fromEntries(fortCsoportSorrend.map(c => [c.id, c.label]));
  const NYELV_FOK_LABELS: Record<number, string> = data.konstansok.nyelv_fok_nevek;
  const többszörösNevek = useMemo(() => new Set(data.fortelySummaries.filter(d => d.többszörös_típus).map(d => d.id)), [data]);
  const fajFortélyok = data.fajFortélyok[karakter.hátterek.faj] ?? {};
  const defsByGroup = useMemo(() => buildDefsByGroup(data.fortelySummaries), [data]);

  useEffect(() => { setInfoTarget(null); }, [gameMode]);

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
            slotok={getFortelyokForCsoport(csoport, fortélyok, defsByGroup)}
            collapsed={collapsedGroups.has(csoport)}
            gameMode={gameMode}
            tsz={tsz}
            többszörösNevek={többszörösNevek}
            fortélyok={fortélyok}
            fegyverNevek={fegyverNevek}
            nyelvtanulásSzint={nyelvtanulásSzint}
            nyelvFokLabels={NYELV_FOK_LABELS}
            képzettségek={képzettségek}
            fajFortélyok={fajFortélyok}
            data={data}
            onToggleCollapse={() => setCollapsedGroups(prev => { const n = new Set(prev); if (n.has(csoport)) n.delete(csoport); else n.add(csoport); return n; })}
            onAddFortely={addFortely}
            onToggleInfo={idx => setInfoTarget(prev => prev === `${idx}` ? null : `${idx}`)}
            onFokChange={setFok}
            onRemove={(idx) => setDeleteTarget({ idx, név: displayName(fortélyok[idx], data), fok: fortélyok[idx]?.fok ?? 0 })}
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

      {pendingFort && pendingSlot && (
        <FokPickerPopup
          slot={pendingSlot}
          maxfok={data.fortelySummaries.find(d => d.id === pendingSlot.id)?.maxfok ?? 1}
          data={data}
          nyelvFokLabels={NYELV_FOK_LABELS}
          onSelect={confirmFok}
          onCancel={() => setPendingFort(null)}
        />
      )}

      {multiPickerDef && (
        <MultiPicker
          def={multiPickerDef}
          fortélyok={fortélyok}
          data={data}
          onSelect={addMultiInstance}
          onCancel={() => setMultiPickerDef(null)}
        />
      )}

      {szabadTypePicker && (
        <SzabadTypePickerPopup
          data={data}
          picker={szabadTypePicker}
          felvettKp={calcSzabadFelvettKp(szabadTypePicker.id, fortélyok, data.fortelySummaries, tsz)}
          onFelvett={() => confirmSzabad(false)}
          onKiérdemelt={() => confirmSzabad(true)}
          onCancel={() => setSzabadTypePicker(null)}
        />
      )}

      {egyediPicker && (
        <EgyediFortelyPopup
          data={data}
          képzettségek={képzettségek}
          onConfirm={confirmEgyedi}
          onCancel={() => setEgyediPicker(false)}
        />
      )}
    </div>
  );
}
