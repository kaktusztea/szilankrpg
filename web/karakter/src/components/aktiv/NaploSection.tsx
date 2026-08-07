import { useState } from 'react';
import type { Karakter } from '../../engine/types';
import { createCheckpoint, autoCheckpointName } from '../../engine/checkpoint-utils';
import { MAX_CHECKPOINT_NÉV } from '../../ui-constants';

interface Props {
  karakter: Karakter;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
}

const EMPTY_FORM = { dátum: '', km: '', kaland: '', események: '' };

/** Napló accordion — bejegyzések listája, szerkesztő/új form, opcionális checkpoint létrehozás. */
export function NaploSection({ karakter, setKarakter }: Props) {
  const [open, setOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cpChecked, setCpChecked] = useState(true);
  const [cpNév, setCpNév] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  function addEntry() {
    if (!form.dátum && !form.kaland) return;
    if (cpChecked) {
      const név = cpNév.trim() || form.kaland.slice(0, MAX_CHECKPOINT_NÉV) || autoCheckpointName();
      const newCheckpoints = createCheckpoint(karakter, név);
      setKarakter(prev => prev ? { ...prev, napló: [...prev.napló, { ...form }], checkpoints: newCheckpoints } : prev);
    } else {
      setKarakter(prev => prev ? { ...prev, napló: [...prev.napló, { ...form }] } : prev);
    }
    setForm(EMPTY_FORM);
    setCpChecked(true);
    setCpNév('');
    setAdding(false);
  }

  function saveEdit() {
    if (editIdx === null) return;
    setKarakter(prev => prev ? { ...prev, napló: prev.napló.map((e, i) => i === editIdx ? { ...form } : e) } : prev);
    setEditIdx(null);
    setOpenIdx(null);
  }

  function removeEntry(idx: number) {
    setKarakter(prev => prev ? { ...prev, napló: prev.napló.filter((_, i) => i !== idx) } : prev);
    setOpenIdx(null);
  }

  function renderForm(onSave: () => void, onCancel: () => void, showCp = false) {
    return (
      <div className="naplo-panel">
        <div className="naplo-form-row">
          <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} className="field-input naplo-input-short" />
          <button className="naplo-btn" onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
        </div>
        <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} className="field-input" />
        <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} className="field-input" />
        <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))}
          rows={4} className="field-input naplo-textarea" />
        {showCp && (
          <div className="naplo-cp-row">
            <label className="naplo-cp-label">
              <input type="checkbox" checked={cpChecked} onChange={e => setCpChecked(e.target.checked)} />
              <span>Kiemelt verzió létrehozása</span>
            </label>
            {cpChecked && (
              <input
                className="field-input naplo-cp-name"
                placeholder="Verzió neve (max 20)"
                value={cpNév}
                onChange={e => setCpNév(e.target.value.slice(0, MAX_CHECKPOINT_NÉV))}
                maxLength={MAX_CHECKPOINT_NÉV}
              />
            )}
          </div>
        )}
        <div className="naplo-form-btns">
          <button className="naplo-btn-save" onClick={onSave}>Mentés</button>
          <button className="naplo-btn-cancel" onClick={onCancel}>Mégse</button>
        </div>
      </div>
    );
  }

  return (
    <details className="naplo-cp-section naplo-log-section" open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="naplo-cp-summary naplo-log-summary">
        Napló ({karakter.napló.length})
      </summary>

      <div onClick={e => { if (editIdx !== null) return; if ((e.target as HTMLElement).closest('[data-naplo-entry]')) return; setOpenIdx(null); }}>
        <div className="naplo-header">
          <button className="naplo-btn-new"
            onClick={() => { setAdding(true); setForm({ ...EMPTY_FORM, dátum: today }); setCpChecked(true); setCpNév(''); }}>
            + Új bejegyzés
          </button>
        </div>

        {karakter.napló.length === 0 && !adding && <p className="naplo-empty">Nincs bejegyzés.</p>}

        {karakter.napló.map((entry, i) => (
          <div key={i} className="naplo-entry" data-naplo-entry>
            <div className="naplo-entry-header" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              [{entry.dátum}] {entry.km && `${entry.km}: `}{entry.kaland}
            </div>

            {openIdx === i && editIdx !== i && (
              <div className="naplo-panel naplo-panel-view">
                {entry.események && <div className="naplo-events">{entry.események}</div>}
                <div className="naplo-actions">
                  <button className="naplo-btn" onClick={() => { setEditIdx(i); setForm({ ...entry }); }}>Szerkeszt</button>
                  <button className="naplo-btn-del" onClick={() => removeEntry(i)}>Törlés</button>
                </div>
              </div>
            )}

            {editIdx === i && renderForm(saveEdit, () => setEditIdx(null))}
          </div>
        ))}

        {adding && (
          <div className="naplo-add-wrap">
            {renderForm(addEntry, () => setAdding(false), true)}
          </div>
        )}
      </div>
    </details>
  );
}
