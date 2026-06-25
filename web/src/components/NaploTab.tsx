import { useState } from 'react';
import type { Karakter } from '../engine/types';
import './NaploTab.css';

export function NaploTab({ karakter, setKarakter }: { karakter: Karakter; setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ dátum: '', km: '', kaland: '', események: '' });

  const today = new Date().toISOString().slice(0, 10);

  function addEntry() {
    if (!form.dátum && !form.kaland) return;
    setKarakter(prev => prev ? { ...prev, napló: [...prev.napló, { ...form }] } : prev);
    setForm({ dátum: '', km: '', kaland: '', események: '' });
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

  function renderForm(onSave: () => void, onCancel: () => void) {
    return (
      <div className="naplo-panel">
        <div className="naplo-form-row">
          <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} className="naplo-input-short" />
          <button className="naplo-btn" onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
        </div>
        <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} className="naplo-input" />
        <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} className="naplo-input" />
        <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))}
          rows={4} className="naplo-textarea" />
        <div className="naplo-form-btns">
          <button className="naplo-btn-save" onClick={onSave}>Mentés</button>
          <button className="naplo-btn-cancel" onClick={onCancel}>Mégse</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen naplo-screen"
      onClick={e => { if (editIdx !== null) return; if ((e.target as HTMLElement).closest('[data-naplo-entry]')) return; setOpenIdx(null); }}>

      <div className="naplo-header">
        <h2>📅 Napló</h2>
        <button className="naplo-btn-new"
          onClick={() => { setAdding(true); setForm({ dátum: today, km: '', kaland: '', események: '' }); }}>
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
          {renderForm(addEntry, () => setAdding(false))}
        </div>
      )}
    </div>
  );
}
