import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { evaluate, buildContext } from '../engine/reactive';
import './MisztikusScreen.css';
import { FortélyFelvétel } from './FortelyFelvetel';

export function MisztikusScreen({ data, karakter, képzettségek, setKépzettségek, fortélyok, setFortélyok, gameMode }: {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
  setKépzettségek: React.Dispatch<React.SetStateAction<{ név: string; szint: number }[]>>;
  fortélyok: { név: string; fok: number; spec_típus: string; spec_elem: string; kiérdemelt?: boolean }[];
  setFortélyok: React.Dispatch<React.SetStateAction<any[]>>;
  gameMode: boolean;
}) {
  const konstansok = data.konstansok;
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hint, setHint] = useState('');
  const [misztFokTarget, setMisztFokTarget] = useState<number | null>(null);
  const [felvételDef, setFelvételDef] = useState<any | null>(null);
  const [deleteFortIdx, setDeleteFortIdx] = useState<number | null>(null);
  const [promptTarget, setPromptTarget] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [tradícióPicker, setTradícióPicker] = useState(false);
  const [tradícióAltípusPicker, setTradícióAltípusPicker] = useState<string | null>(null);

  // Aura (reactive)
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok as any, {});
  const computed = evaluate(data.rules, ctx);
  const aura = computed.get('Aura') ?? 0;
  const me = aura + (konstansok as any).aura.mágiaellenállás_konstans;

  // Misztikus képzettségek
  const tradíció = képzettségek.find(k => k.név.startsWith('Tradíció'));
  const arkánumok = képzettségek.filter(k => k.név.startsWith('Arkánum')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  const ősiNyelvek = képzettségek.filter(k => k.név.startsWith('Ősi nyelv ismerete')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));

  // Elérhető opciók
  const arkánumDefs = data.kepzettsegDefs.filter(d => d.név.startsWith('Arkánum:'));
  const felvettArkNevek = new Set(arkánumok.map(a => a.név));
  const elérhetőArkánumok = arkánumDefs.filter(d => !felvettArkNevek.has(d.név));

  // Tradíció opciók (tradiciok.json)
  const tradícióOpciók = data.tradiciok ?? [];

  function addKépzettség(név: string) {
    setKépzettségek(prev => [...prev, { név, szint: 1 }]);
    setSzintTarget(név);
  }
  function removeKépzettség(név: string) {
    setKépzettségek(prev => prev.filter(k => k.név !== név));
  }
  function setSzint(név: string, szint: number) {
    setKépzettségek(prev => prev.map(k => k.név === név ? { ...k, szint } : k));
  }

  const [szintTarget, setSzintTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!deleteTarget && !szintTarget && !promptTarget && !tradícióPicker && !tradícióAltípusPicker && misztFokTarget === null && !felvételDef && deleteFortIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDeleteTarget(null); setSzintTarget(null); setPromptTarget(null);
        setTradícióPicker(false); setTradícióAltípusPicker(null);
        setMisztFokTarget(null); setFelvételDef(null); setDeleteFortIdx(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deleteTarget, szintTarget, promptTarget, tradícióPicker, tradícióAltípusPicker, misztFokTarget, felvételDef, deleteFortIdx]);

  const maxSzint = karakter.tsz; // misztikus képzettségek mind primerek

  const renderRow = (k: { név: string; szint: number }, canDelete = true, warning = false) => (
    <div key={k.név} className="miszt-row" onClick={() => !gameMode && setSzintTarget(k.név)}>
      <span className={`miszt-row-name${warning ? ' miszt-row-warn' : ''}`}>{k.név.includes(':') ? k.név.split(':')[1].trim() : k.név}</span>
      {canDelete && !gameMode && <button className="fort-delete" onClick={e => { e.stopPropagation(); setDeleteTarget(k.név); }}>✕</button>}
      <strong className={`kep-szint${k.szint > maxSzint ? ' kep-over' : k.szint >= 9 ? ' kep-szint-high' : ''}`}>{k.szint}</strong>
    </div>
  );

  return (
    <div className="screen miszt-screen">
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
      {(!gameMode || tradíció) && (
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Tradíció</h3>
        {tradíció && renderRow(tradíció)}
        {!tradíció && !gameMode && (
          <button className="he-add-select" onClick={() => setTradícióPicker(true)}>+ Tradíció választása...</button>
        )}
      </section>
      )}

      {/* Arkánumok */}
      {(!gameMode || arkánumok.length > 0) && (
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Arkánumok</h3>
        {arkánumok.map(a => renderRow(a, true, !tradíció))}
          {!gameMode && elérhetőArkánumok.length > 0 && (
            <select className="he-add-select" value="" disabled={!tradíció} onChange={e => { if (e.target.value) addKépzettség(e.target.value); }}>
              <option value="">{!tradíció ? '⚠ Tradíció szükséges' : '+ Arkánum...'}</option>
              {elérhetőArkánumok.map(d => <option key={d.név} value={d.név}>{d.név.split(':')[1].trim()}</option>)}
            </select>
          )}
      </section>
      )}

      {/* Faj misztérium */}
      {(!gameMode || (képzettségek.find(k => k.név.startsWith('Faj misztérium'))?.szint ?? 0) > 0) && (
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Faj misztérium</h3>
        {(() => {
          const fajNév = karakter.hátterek.faj;
          const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : null;
          const slot = fajMisztNév ? képzettségek.find(k => k.név === fajMisztNév) : null;
          const szint = slot?.szint ?? 0;
          if (!fajNév) return <span style={{ color: '#666', fontSize: '13px' }}>Faj nincs kiválasztva</span>;
          return (
            <div className="miszt-row" onClick={() => !gameMode && setSzintTarget(fajMisztNév!)}>
              <span className="miszt-row-name">{fajNév}</span>
              <strong className={`kep-szint${szint > maxSzint ? ' kep-over' : szint >= 9 ? ' kep-szint-high' : ''}`}>{szint}</strong>
            </div>
          );
        })()}
      </section>
      )}

      {/* Ősi nyelv ismerete */}
      {(!gameMode || ősiNyelvek.length > 0) && (
      <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
        <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Ősi nyelv ismerete</h3>
        {ősiNyelvek.map(k => renderRow(k))}
        {!gameMode && (
          <button className="he-add-select" onClick={() => { setPromptTarget('Ősi nyelv ismerete'); setPromptValue(''); }}>+ Ősi nyelv ismerete...</button>
        )}
      </section>
      )}

      {/* Törlés megerősítő */}
      {deleteTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setDeleteTarget(null); }}>
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{deleteTarget}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={() => { removeKépzettség(deleteTarget); setDeleteTarget(null); }}>Képzettség törlése</button>
          </div>
        </div>,
        document.body
      )}

      {/* Szint választó popup */}
      {szintTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setSzintTarget(null); }}>
          <div className="kep-prompt">
            <label>{szintTarget.includes(':') ? szintTarget.split(':')[1].trim() : szintTarget} — szint:</label>
            <div className="kep-szint-grid">
              {(() => {
                const minSzint = szintTarget!.startsWith('Faj misztérium') ? 0 : 1;
                const current = képzettségek.find(k => k.név === szintTarget)?.szint ?? 0;
                return [minSzint === 0 ? 0 : null, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].filter(n => n !== null).map(n => (
                  <button key={n} className={`fort-fok-btn ${current === n ? 'active' : ''}`} onClick={() => {
                    if (n === 0) setKépzettségek(prev => prev.filter(k => k.név !== szintTarget));
                    else if (!képzettségek.find(k => k.név === szintTarget)) setKépzettségek(prev => [...prev, { név: szintTarget!, szint: n as number }]);
                    else setSzint(szintTarget!, n as number);
                    setSzintTarget(null);
                  }}>{n}</button>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Szabad szöveges felvétel popup (Ősi nyelv) */}

      {/* Tradíció picker */}
      {tradícióPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setTradícióPicker(false); }}>
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tradíció választás</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              {tradícióOpciók.map(t => (
                <button key={t.név} className="he-field-btn" onClick={() => {
                  if (t.altípusok.length > 0) {
                    setTradícióPicker(false);
                    setTradícióAltípusPicker(t.név);
                  } else {
                    const fullName = `Tradíció: ${t.név}`;
                    addKépzettség(fullName);
                    setTradícióPicker(false);
                  }
                }}>{t.név} {t.altípusok.length > 0 && '▸'} <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>({t.típus})</span></button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tradíció altípus picker (pl. Szakrális istenségek) */}
      {tradícióAltípusPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setTradícióAltípusPicker(null); }}>
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>{tradícióAltípusPicker} — altípus</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const trad = tradícióOpciók.find(t => t.név === tradícióAltípusPicker);
                if (!trad) return null;
                const hasPantheon = trad.altípusok.some((a: any) => a.pantheon);
                if (hasPantheon) {
                  const byPantheon = new Map<string, any[]>();
                  for (const a of trad.altípusok) {
                    const p = (a as any).pantheon || '';
                    const arr = byPantheon.get(p) || [];
                    arr.push(a);
                    byPantheon.set(p, arr);
                  }
                  const elements: any[] = [];
                  for (const [pantheon, items] of byPantheon) {
                    elements.push(<div key={`h-${pantheon}`} className="miszt-section-label">{pantheon}</div>);
                    for (const item of items) {
                      elements.push(
                        <button key={item.név} className="he-field-btn" onClick={() => {
                          addKépzettség(`Tradíció: ${tradícióAltípusPicker} (${item.név})`);
                          setTradícióAltípusPicker(null);
                        }}>{item.név} {item.leírás && <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>— {item.leírás}</span>}</button>
                      );
                    }
                  }
                  return elements;
                }
                return trad.altípusok.map((a: any) => (
                  <button key={a.név} className="he-field-btn" onClick={() => {
                    addKépzettség(`Tradíció: ${tradícióAltípusPicker} (${a.név})`);
                    setTradícióAltípusPicker(null);
                  }}>{a.név}</button>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
      {promptTarget && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setPromptTarget(null); }}>
          <div className="kep-prompt">
            <label>{promptTarget}: név</label>
            <input autoFocus maxLength={30} value={promptValue}
              onChange={e => setPromptValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } if (e.key === 'Escape') setPromptTarget(null); }} />
            <div className="kep-prompt-btns">
              <button onClick={() => { if (promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } }} disabled={!promptValue.trim()}>OK</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {felvételDef && (
        <FortélyFelvétel
          def={felvételDef}
          kiérdemeltOpció={!!felvételDef.kiérdemelhető}
          felvettSpecElemek={fortélyok.filter(f => f.név === felvételDef.név).map(f => f.spec_elem)}
          onDone={result => { setFortélyok(prev => [...prev, result]); setFelvételDef(null); }}
          onCancel={() => setFelvételDef(null)}
        />
      )}

      {misztFokTarget !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setMisztFokTarget(null); }}>
          <div className="kep-prompt">
            <label>{fortélyok[misztFokTarget]?.név} — fok:</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: data.fortelySummaries.find(d => d.név === fortélyok[misztFokTarget]?.név)?.maxfok ?? 3 }, (_, i) => i + 1).map(n => (
                <button key={n} className={`fort-fok-btn ${fortélyok[misztFokTarget]?.fok === n ? 'active' : ''}`} onClick={() => {
                  setFortélyok(prev => prev.map((f, j) => j === misztFokTarget ? { ...f, fok: n } : f));
                  setMisztFokTarget(null);
                }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteFortIdx !== null && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setDeleteFortIdx(null); }}>
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{fortélyok[deleteFortIdx]?.név}{fortélyok[deleteFortIdx]?.spec_elem ? ` - ${fortélyok[deleteFortIdx].spec_elem}` : ''}</label>
            <button className="btn-del-confirm he-del-confirm" onClick={() => { setFortélyok(prev => prev.filter((_, j) => j !== deleteFortIdx)); setDeleteFortIdx(null); }}>Fortély törlése</button>
          </div>
        </div>,
        document.body
      )}

      {/* Misztikus fortélyok */}
      {(() => {
        const misztFortDefs = data.fortelySummaries.filter(d => d.csoport === 'misztikus');
        const misztFortSlotok = fortélyok.filter(f => misztFortDefs.some(d => d.név === f.név)).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
        const felvehető = misztFortDefs.filter(d => {
          if (!d.többszörös_típus) return !misztFortSlotok.some(s => s.név === d.név);
          if (d.többszörös_lista.length > 0) return d.többszörös_lista.some(l => !misztFortSlotok.some(s => s.név === d.név && s.spec_elem === l));
          return true;
        });
        if (gameMode && misztFortSlotok.length === 0) return null;
        return (
          <section style={{ borderTop: '1px solid #444', paddingTop: '12px' }}>
            <h3 style={{ fontSize: '17px', color: '#42a5f5', margin: '0 0 6px' }}>Misztikus fortélyok</h3>
            {misztFortSlotok.map((f, i) => {
              const def = misztFortDefs.find(d => d.név === f.név);
              const maxfok = def?.maxfok ?? 1;
              const globalIdx = fortélyok.indexOf(f);
              return (
              <div key={`${f.név}-${f.spec_elem}-${i}`} className="kep-row miszt-fort-row" onClick={() => { if (gameMode) return; if (maxfok > 1) setMisztFokTarget(globalIdx); else { setHint('1 fok a maximum'); setTimeout(() => setHint(''), 2000); } }}>
                <span className="kep-név" style={{ flex: 1 }}>{f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név}{f.kiérdemelt ? ' ⭐' : ''}</span>
                {!gameMode && <button className="fort-delete" onClick={e => { e.stopPropagation(); setDeleteFortIdx(globalIdx); }}>✕</button>}
                <span className="fort-fok-dots">{Array.from({ length: 3 }, (_, di) => <span key={di} className={`fort-dot${di < f.fok ? ' filled' : ''}${di >= maxfok ? ' fort-dot-hidden' : ''}`} />)}</span>
              </div>
              );
            })}
            {!gameMode && felvehető.length > 0 && (
              <select className="he-add-select" value="" onChange={e => {
                if (!e.target.value) return;
                const def = misztFortDefs.find(d => d.név === e.target.value);
                if (!def) return;
                setFelvételDef(def);
              }}>
                <option value="">+ Misztikus fortély...</option>
                {felvehető.map(d => <option key={d.név} value={d.név}>{d.név}</option>)}
              </select>
            )}
          </section>
        );
      })()}
      {hint && <div className="he-hint">{hint}</div>}
    </div>
  );
}
