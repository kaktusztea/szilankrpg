import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { evaluate, buildContext } from '../engine/reactive';

export function MisztikusScreen({ data, karakter, képzettségek, setKépzettségek, gameMode }: {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  gameMode: boolean;
}) {
  const konstansok = data.konstansok;
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [promptTarget, setPromptTarget] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');

  // Aura (reactive)
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok as any, {});
  const computed = evaluate(data.rules, ctx);
  const aura = computed.get('Aura') ?? 0;
  const me = aura + ((konstansok as any).aura?.mágiaellenállás_konstans ?? 10);

  // Misztikus képzettségek
  const tradíció = képzettségek.find(k => k.név.startsWith('Tradíció'));
  const arkánumok = képzettségek.filter(k => k.név.startsWith('Arkánum'));
  const ősiNyelvek = képzettségek.filter(k => k.név.startsWith('Ősi nyelv ismerete'));

  // Elérhető opciók
  const arkánumDefs = data.kepzettsegDefs.filter(d => d.név.startsWith('Arkánum:'));
  const felvettArkNevek = new Set(arkánumok.map(a => a.név));
  const elérhetőArkánumok = arkánumDefs.filter(d => !felvettArkNevek.has(d.név));

  // Tradíció opciók (tradiciok.json)
  const tradícióOpciók = data.tradiciok ?? [];

  function addKépzettség(név: string) {
    setKépzettségek(prev => [...prev, { név, szint: 1 }]);
  }
  function removeKépzettség(név: string) {
    setKépzettségek(prev => prev.filter(k => k.név !== név));
  }
  function setSzint(név: string, szint: number) {
    setKépzettségek(prev => prev.map(k => k.név === név ? { ...k, szint } : k));
  }

  const renderRow = (k: { név: string; szint: number }, canDelete = true) => (
    <div key={k.név} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
      <span style={{ flex: 1, fontSize: '14px' }}>{k.név.includes(':') ? k.név.split(':')[1].trim() : k.név}</span>
      {canDelete && <button className="fort-delete" onClick={() => setDeleteTarget(k.név)}>✕</button>}
      <strong style={{ width: '20px', textAlign: 'right' }}>{k.szint}</strong>
      <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={k.szint <= 1} onClick={() => setSzint(k.név, k.szint - 1)}>−</button>
      <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={k.szint >= 15} onClick={() => setSzint(k.név, k.szint + 1)}>+</button>
    </div>
  );

  return (
    <div className="screen" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2>✨ Misztikus</h2>

      {/* Aura értékek */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--input-bg)', border: '1px solid #444', borderRadius: '6px', padding: '8px 14px', textAlign: 'center' }}>
          <span style={{ fontSize: '14px', color: '#aaa' }}>Mágiaellenállás</span><br/>
          <strong style={{ fontSize: '20px' }}>{me}</strong>
        </div>
        <div style={{ background: 'var(--input-bg)', border: '1px solid #444', borderRadius: '6px', padding: '8px 14px', textAlign: 'center' }}>
          <span style={{ fontSize: '14px', color: '#aaa' }}>Mágia akarata</span><br/>
          <strong style={{ fontSize: '20px' }}>{aura} + k20</strong>
        </div>
        <div style={{ background: 'var(--input-bg)', border: '1px solid #444', borderRadius: '6px', padding: '8px 14px', textAlign: 'center' }}>
          <span style={{ fontSize: '14px', color: '#aaa' }}>Aura</span><br/>
          <strong style={{ fontSize: '20px' }}>{aura}</strong>
        </div>
      </div>

      {/* Tradíció */}
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 6px' }}>Tradíció</h3>
        {tradíció && renderRow(tradíció)}
        {!tradíció && !gameMode && (
          <select className="he-add-select" value="" onChange={e => { if (e.target.value) addKépzettség(e.target.value); }}>
            <option value="">+ Tradíció választása...</option>
            {tradícióOpciók.map(t => <option key={t.név} value={`Tradíció: ${t.név}`}>{t.név}</option>)}
          </select>
        )}
        {!tradíció && gameMode && <span style={{ color: '#666', fontSize: '13px' }}>Nincs tradíció</span>}
      </section>

      {/* Arkánumok — mindig megjelenik, tradíció nélkül disabled */}
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 6px' }}>Arkánumok</h3>
          {arkánumok.map(a => (
            <div key={a.név} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <span style={{ flex: 1, fontSize: '14px', color: !tradíció ? '#e53935' : undefined }}>{a.név.includes(':') ? a.név.split(':')[1].trim() : a.név}</span>
              <button className="fort-delete" onClick={() => setDeleteTarget(a.név)}>✕</button>
              <strong style={{ width: '20px', textAlign: 'right' }}>{a.szint}</strong>
              <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={a.szint <= 1} onClick={() => setSzint(a.név, a.szint - 1)}>−</button>
              <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={a.szint >= 15} onClick={() => setSzint(a.név, a.szint + 1)}>+</button>
            </div>
          ))}
          {!gameMode && elérhetőArkánumok.length > 0 && (
            <select className="he-add-select" value="" disabled={!tradíció} onChange={e => { if (e.target.value) addKépzettség(e.target.value); }}>
              <option value="">{!tradíció ? '⚠ Tradíció szükséges' : '+ Arkánum...'}</option>
              {elérhetőArkánumok.map(d => <option key={d.név} value={d.név}>{d.név.split(':')[1].trim()}</option>)}
            </select>
          )}
      </section>

      {/* Faj misztérium — kötve a faj választóhoz, nem törölhető */}
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 6px' }}>Faj misztérium</h3>
        {(() => {
          const fajNév = karakter.hátterek.faj;
          const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : null;
          const slot = fajMisztNév ? képzettségek.find(k => k.név === fajMisztNév) : null;
          const szint = slot?.szint ?? 0;
          if (!fajNév) return <span style={{ color: '#666', fontSize: '13px' }}>Faj nincs kiválasztva</span>;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ flex: 1, fontSize: '14px' }}>{fajNév}</span>
              <strong style={{ width: '20px', textAlign: 'right' }}>{szint}</strong>
              <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={szint <= 0} onClick={() => {
                if (szint === 1) setKépzettségek(prev => prev.filter(k => k.név !== fajMisztNév));
                else setSzint(fajMisztNév!, szint - 1);
              }}>−</button>
              <button className="fort-fok-btn" style={{ width: '24px', height: '24px', fontSize: '13px' }} disabled={szint >= 15} onClick={() => {
                if (!slot) setKépzettségek(prev => [...prev, { név: fajMisztNév!, szint: 1 }]);
                else setSzint(fajMisztNév!, szint + 1);
              }}>+</button>
            </div>
          );
        })()}
      </section>

      {/* Ősi nyelv ismerete */}
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 6px' }}>Ősi nyelv ismerete</h3>
        {ősiNyelvek.map(k => renderRow(k))}
        {!gameMode && (
          <button className="he-add-select" style={{ background: 'var(--input-bg)', border: '1px solid #444', borderRadius: '4px', color: 'var(--text)', padding: '6px 8px', fontSize: '14px', cursor: 'pointer', width: '100%', textAlign: 'left' }} onClick={() => { setPromptTarget('Ősi nyelv ismerete'); setPromptValue(''); }}>+ Ősi nyelv ismerete...</button>
        )}
      </section>

      {/* Törlés megerősítő */}
      {deleteTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setDeleteTarget(null); }}>
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{deleteTarget}</label>
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { removeKépzettség(deleteTarget); setDeleteTarget(null); }}>Képzettség törlése</button>
          </div>
        </div>,
        document.body
      )}

      {/* Szabad szöveges felvétel popup (Ősi nyelv) */}
      {promptTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setPromptTarget(null); }}>
          <div className="kep-prompt">
            <label>{promptTarget}: név</label>
            <input autoFocus maxLength={30} value={promptValue} onChange={e => setPromptValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } if (e.key === 'Escape') setPromptTarget(null); }} />
            <div className="kep-prompt-btns">
              <button onClick={() => { if (promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } }} disabled={!promptValue.trim()}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
