import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { evaluate, buildContext } from '../engine/reactive';

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
  const [misztFokTarget, setMisztFokTarget] = useState<number | null>(null);
  const [misztFortPrompt, setMisztFortPrompt] = useState<{ név: string; többszörös_típus: string; maxfok: number; lista: string[] } | null>(null);
  const [misztKierdemeltPicker, setMisztKierdemeltPicker] = useState<{ név: string; spec_típus: string; spec_elem: string; maxfok: number } | null>(null);
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
    if (!deleteTarget && !szintTarget && !promptTarget && !tradícióPicker && !tradícióAltípusPicker && misztFokTarget === null && !misztFortPrompt && !misztKierdemeltPicker) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setDeleteTarget(null); setSzintTarget(null); setPromptTarget(null); setTradícióPicker(false); setTradícióAltípusPicker(null); setMisztFokTarget(null); setMisztFortPrompt(null); setMisztKierdemeltPicker(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deleteTarget, szintTarget, promptTarget, tradícióPicker, tradícióAltípusPicker, misztFokTarget, misztFortPrompt, misztKierdemeltPicker]);

  const maxSzint = karakter.tsz; // misztikus képzettségek mind primerek

  const renderRow = (k: { név: string; szint: number }, canDelete = true, warning = false) => (
    <div key={k.név} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--surface)', border: '1px solid #3a3a5a', borderRadius: '4px', marginBottom: '4px', cursor: 'pointer' }} onClick={() => !gameMode && setSzintTarget(k.név)}>
      <span style={{ flex: 1, fontSize: '17px', color: warning ? '#e53935' : undefined }}>{k.név.includes(':') ? k.név.split(':')[1].trim() : k.név}</span>
      {canDelete && !gameMode && <button className="fort-delete" onClick={e => { e.stopPropagation(); setDeleteTarget(k.név); }}>✕</button>}
      <strong className={`kep-szint${k.szint > maxSzint ? ' kep-over' : k.szint >= 9 ? ' kep-szint-high' : ''}`}>{k.szint}</strong>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--surface)', border: '1px solid #3a3a5a', borderRadius: '4px', cursor: 'pointer' }} onClick={() => !gameMode && setSzintTarget(fajMisztNév!)}>
              <span style={{ flex: 1, fontSize: '17px' }}>{fajNév}</span>
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
            <button className="btn-del-confirm" style={{ padding: '6px 15px' }} onClick={() => { removeKépzettség(deleteTarget); setDeleteTarget(null); }}>Képzettség törlése</button>
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
                    elements.push(<div key={`h-${pantheon}`} style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px', borderBottom: '1px solid #444', paddingBottom: '2px' }}>{pantheon}</div>);
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
            <input autoFocus maxLength={30} value={promptValue} onChange={e => setPromptValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } if (e.key === 'Escape') setPromptTarget(null); }} />
            <div className="kep-prompt-btns">
              <button onClick={() => { if (promptValue.trim()) { addKépzettség(`${promptTarget}: ${promptValue.trim()}`); setPromptTarget(null); } }} disabled={!promptValue.trim()}>OK</button>
            </div>
          </div>
        </div>,
        document.body
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

      {misztFortPrompt && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) setMisztFortPrompt(null); }}>
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>{misztFortPrompt.név}</label>
            {misztFortPrompt.lista.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
                {misztFortPrompt.lista.filter(l => !fortélyok.some(f => f.név === misztFortPrompt.név && f.spec_elem === l)).map(l => (
                  <button key={l} className="he-field-btn" onClick={() => {
                    const newIdx = fortélyok.length;
                    setFortélyok(prev => [...prev, { név: misztFortPrompt.név, fok: 1, spec_típus: misztFortPrompt.többszörös_típus, spec_elem: l }]);
                    if (misztFortPrompt.maxfok > 1) setMisztFokTarget(newIdx);
                    setMisztFortPrompt(null);
                  }}>{l}</button>
                ))}
              </div>
            ) : (<>
              <input autoFocus maxLength={30} value={promptValue} onChange={e => setPromptValue(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && promptValue.trim()) {
                  setMisztKierdemeltPicker({ név: misztFortPrompt.név, spec_típus: misztFortPrompt.többszörös_típus, spec_elem: promptValue.trim(), maxfok: misztFortPrompt.maxfok });
                  setMisztFortPrompt(null);
                }
                if (e.key === 'Escape') setMisztFortPrompt(null);
              }} />
              <div className="kep-prompt-btns">
                <button onClick={() => {
                  if (!promptValue.trim()) return;
                  setMisztKierdemeltPicker({ név: misztFortPrompt.név, spec_típus: misztFortPrompt.többszörös_típus, spec_elem: promptValue.trim(), maxfok: misztFortPrompt.maxfok });
                  setMisztFortPrompt(null);
                }} disabled={!promptValue.trim()}>OK</button>
              </div>
            </>)}
          </div>
        </div>,
        document.body
      )}

      {misztKierdemeltPicker && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: 'bold' }}>{misztKierdemeltPicker.spec_elem ? `${misztKierdemeltPicker.név} - ${misztKierdemeltPicker.spec_elem}` : misztKierdemeltPicker.név}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => {
                const p = misztKierdemeltPicker;
                const newIdx = fortélyok.length;
                setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem }]);
                if (p.maxfok > 1) setMisztFokTarget(newIdx);
                setMisztKierdemeltPicker(null);
              }}>Felvett</button>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => {
                const p = misztKierdemeltPicker;
                const newIdx = fortélyok.length;
                setFortélyok(prev => [...prev, { név: p.név, fok: 1, spec_típus: p.spec_típus, spec_elem: p.spec_elem, kiérdemelt: true }]);
                if (p.maxfok > 1) setMisztFokTarget(newIdx);
                setMisztKierdemeltPicker(null);
              }}>⭐ Kiérdemelt</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Misztikus fortélyok */}
      {(() => {
        const misztFortDefs = data.fortelySummaries.filter(d => d.csoport === 'misztikus');
        const misztFortSlotok = fortélyok.filter(f => misztFortDefs.some(d => d.név === f.név));
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
              <div key={`${f.név}-${f.spec_elem}-${i}`} className="kep-row" style={{ gap: '8px', cursor: !gameMode && maxfok > 1 ? 'pointer' : undefined }} onClick={() => { if (!gameMode && maxfok > 1) setMisztFokTarget(globalIdx); }}>
                <span className="kep-név" style={{ flex: 1 }}>{f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név}{f.kiérdemelt ? ' ⭐' : ''}</span>
                {!gameMode && <button className="fort-delete" onClick={e => { e.stopPropagation(); setFortélyok(prev => prev.filter((_, j) => j !== globalIdx)); }}>✕</button>}
                <span className="fort-fok-dots">{Array.from({ length: 3 }, (_, di) => <span key={di} className={`fort-dot${di < f.fok ? ' filled' : ''}${di >= maxfok ? ' fort-dot-hidden' : ''}`} />)}</span>
              </div>
              );
            })}
            {!gameMode && felvehető.length > 0 && (
              <select className="he-add-select" value="" onChange={e => {
                if (!e.target.value) return;
                const def = misztFortDefs.find(d => d.név === e.target.value);
                if (!def) return;
                if (def.többszörös_típus) {
                  setMisztFortPrompt({ ...def, lista: def.többszörös_lista });
                  setPromptValue('');
                } else {
                  setMisztKierdemeltPicker({ név: def.név, spec_típus: '', spec_elem: '', maxfok: def.maxfok });
                }
              }}>
                <option value="">+ Misztikus fortély...</option>
                {felvehető.map(d => <option key={d.név} value={d.név}>{d.név}</option>)}
              </select>
            )}
          </section>
        );
      })()}
    </div>
  );
}
