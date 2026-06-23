import { useState } from 'react';
import type { Karakter } from '../engine/types';

export function NaploTab({ karakter, setKarakter }: { karakter: Karakter; setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ dátum: '', km: '', kaland: '', események: '' });

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

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="screen" style={{ padding: '12px', minHeight: '100%' }} onClick={e => { if (editIdx !== null) return; if ((e.target as HTMLElement).closest('[data-naplo-entry]')) return; setOpenIdx(null); }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>📅 Napló</h2>
        <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '6px 12px', color: 'var(--text)', fontSize: '14px' }} onClick={() => { setAdding(true); setForm({ dátum: today, km: '', kaland: '', események: '' }); }}>+ Új bejegyzés</button>
      </div>

      {karakter.napló.length === 0 && !adding && <p style={{ color: 'var(--text-dim)' }}>Nincs bejegyzés.</p>}

      {karakter.napló.map((entry, i) => (
        <div key={i} style={{ marginBottom: '4px' }} data-naplo-entry>
          <div
            style={{ background: 'var(--surface)', border: '1px solid #444', borderRadius: '4px', padding: '8px 10px', cursor: 'pointer', fontSize: '15px' }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            [{entry.dátum}] {entry.km && `${entry.km}: `}{entry.kaland}
          </div>
          {openIdx === i && editIdx !== i && (
            <div style={{ background: '#1a1a3a', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '8px 10px', fontSize: '14px' }}>
              {entry.események && <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{entry.események}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 10px', color: 'var(--text)', fontSize: '13px' }} onClick={() => { setEditIdx(i); setForm({ ...entry }); }}>Szerkeszt</button>
                <button style={{ background: 'var(--error)', border: 'none', borderRadius: '4px', padding: '4px 10px', color: '#fff', fontSize: '13px' }} onClick={() => removeEntry(i)}>Törlés</button>
              </div>
            </div>
          )}
          {editIdx === i && (
            <div style={{ background: '#1a1a3a', border: '1px solid #444', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '14px' }} />
                <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '13px' }} onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
              </div>
              <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
              <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
              <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))} rows={4} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px 14px', color: '#000', fontWeight: 'bold', fontSize: '14px' }} onClick={saveEdit}>Mentés</button>
                <button style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 14px', color: 'var(--text)', fontSize: '14px' }} onClick={() => setEditIdx(null)}>Mégse</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding && (
        <div style={{ background: 'var(--surface)', border: '1px solid #555', borderRadius: '6px', padding: '12px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input type="date" value={form.dátum} onChange={e => setForm(f => ({ ...f, dátum: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '14px' }} />
            <button style={{ background: 'var(--primary)', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px', color: 'var(--text)', fontSize: '13px' }} onClick={() => setForm(f => ({ ...f, dátum: today }))}>Ma</button>
          </div>
          <input placeholder="KM neve" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
          <input placeholder="Kaland neve" value={form.kaland} onChange={e => setForm(f => ({ ...f, kaland: e.target.value }))} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px' }} />
          <textarea placeholder="Események..." value={form.események} onChange={e => setForm(f => ({ ...f, események: e.target.value }))} rows={4} style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 10px', color: 'var(--text)', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '6px 14px', color: '#000', fontWeight: 'bold', fontSize: '14px' }} onClick={addEntry}>Mentés</button>
            <button style={{ background: 'var(--input-bg)', border: '1px solid #555', borderRadius: '4px', padding: '6px 14px', color: 'var(--text)', fontSize: '14px' }} onClick={() => setAdding(false)}>Mégse</button>
          </div>
        </div>
      )}
    </div>
  );
}
