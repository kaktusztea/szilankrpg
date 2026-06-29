import { useState, useRef, useEffect, useMemo } from 'react';
import type { FortelySummary } from '../../engine/data-loader';
import type { FortelyokScreenProps, DeleteTarget, SzabadTypePicker } from './types';
import { buildDefsByGroup, displayName, getFortelyokForCsoport } from './helpers';
import { FortelyCsoport } from './FortelyCsoport';
import { DeletePopup, FokPickerPopup, MultiPicker, SzabadTypePickerPopup } from './FortelyPopups';
import { HINT_DURATION_MS } from '../../ui-constants';
import './FortelyokScreen.css';

export function FortelyokScreen({ data, gameMode, fortélyok, setFortélyok, tsz, fegyverNevek, távfegyverNevek, nyelvtanulásSzint, képzettségek }: FortelyokScreenProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [pendingFortIdx, setPendingFortIdx] = useState<number | null>(null);
  const [multiPickerDef, setMultiPickerDef] = useState<FortelySummary | null>(null);
  const [szabadTypePicker, setSzabadTypePicker] = useState<SzabadTypePicker | null>(null);

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

  function setFok(idx: number, fok: number) {
    setFortélyok(prev => prev.map((f, i) => i === idx ? { ...f, fok } : f));
  }

  function addFortely(név: string) {
    const def = data.fortelySummaries.find(d => d.név === név);
    if (def && def.csoport === 'szabad') {
      if (def.többszörös_típus) { setMultiPickerDef(def); return; }
      setSzabadTypePicker({ név, spec_típus: '', spec_elem: '' });
      return;
    }
    if (def && def.többszörös_típus) { setMultiPickerDef(def); return; }
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
    if (multiPickerDef.csoport === 'szabad' || multiPickerDef.csoport === 'kiemelt' || multiPickerDef.csoport === 'misztikus') {
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
        <DeletePopup
          target={deleteTarget}
          onConfirm={() => { setFortélyok(prev => prev.filter((_, i) => i !== deleteTarget.idx)); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {pendingFortIdx !== null && (() => {
        const pSlot = fortélyok[pendingFortIdx];
        const pDef = data.fortelySummaries.find(d => d.név === pSlot?.név);
        if (!pSlot) return null;
        return (
          <FokPickerPopup
            slot={pSlot}
            maxfok={pDef?.maxfok ?? 1}
            nyelvFokLabels={NYELV_FOK_LABELS}
            onSelect={fok => { setFok(pendingFortIdx, fok); setPendingFortIdx(null); }}
            onCancel={() => setPendingFortIdx(null)}
          />
        );
      })()}

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
          onFelvett={() => {
            const p = szabadTypePicker;
            setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem }]);
            setSzabadTypePicker(null);
          }}
          onKiérdemelt={() => {
            const p = szabadTypePicker;
            setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem, kiérdemelt: true }]);
            setSzabadTypePicker(null);
          }}
          onCancel={() => setSzabadTypePicker(null)}
        />
      )}
    </div>
  );
}
