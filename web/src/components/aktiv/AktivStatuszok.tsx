import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import { fmtHatás } from '../formatters';

interface Props {
  data: GameData;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
  státuszPerElem: { név: string; hatások: any[] }[];
  eseményNév: (id: string) => string;
}

export function AktivStatuszok({ data, session, setSession, pushUndo, státuszPerElem, eseményNév }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [fokválasztó, setFokválasztó] = useState<string | null>(null);
  const [érzékválasztó, setÉrzékválasztó] = useState<string | null>(null);

  return (
    <>
      <div className="aktiv-section aktiv-section-statuszok">
        <span className="aktiv-label">Státuszok
          <button className="aktiv-add-btn aktiv-add-btn-sm"
            disabled={data.statuszok.every(s => s.többszörös || session.aktív_státuszok.some(st => st.startsWith(s.név + ' (')))}
            onClick={() => setShowPicker(true)}>+</button>
        </span>
        {session.aktív_státuszok.map((st, i) => {
          const match = st.match(/^(.+) \((\d+)\)$/);
          const stNév = match?.[1] ?? st;
          const stFok = match ? parseInt(match[2]) : 1;
          const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
          const def = data.statuszok.find(s => s.név === baseName);
          const maxFok = def?.fokok.length ?? 1;
          const alcím = def?.fokok.find(f => f.fok === stFok)?.alcím;
          const locked = baseName === 'Sérült';
          const perElem = státuszPerElem.find(s => s.név === stNév || s.név === `${stNév} (${stFok})`);
          return (
            <div key={i} className="kep-row" style={{ cursor: !locked && maxFok > 1 ? 'pointer' : undefined }} onClick={() => {
              if (locked || maxFok <= 1) return;
              const újFok = (stFok % maxFok) + 1;
              setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.map((v, j) => j === i ? `${stNév} (${újFok})` : v) }));
            }}>
              <span style={{ flex: 1 }}>
                <strong className="aktiv-statusz-name">{stNév} ({stFok}){alcím ? ` - ${alcím}` : ''}:</strong>
                {perElem && perElem.hatások.length > 0 && <span> {perElem.hatások.map((h, j) => {
                  const txt = fmtHatás(h, eseményNév);
                  return txt ? <span key={j}>{j > 0 ? ', ' : ''}{txt}</span> : null;
                })}</span>}
              </span>
              {!locked && <button className="fort-delete" onClick={e => {
                e.stopPropagation();
                pushUndo(`Státusz−: ${session.aktív_státuszok[i]}`);
                setSession(s => ({ ...s, aktív_státuszok: s.aktív_státuszok.filter((_, j) => j !== i) }));
              }}>✕</button>}
            </div>
          );
        })}
      </div>

      {showPicker && createPortal(
        <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { setShowPicker(false); setFokválasztó(null); } }}>
          <div className="aktiv-picker">
            <div className="aktiv-picker-header">
              <label>{fokválasztó ? `${fokválasztó} — fok választó` : 'Státusz választó'}</label>
            </div>
            <div className="aktiv-picker-list">
              {!fokválasztó && !érzékválasztó && ['fizikai', 'szellemi', 'mágikus'].map(kat => {
                const items = data.statuszok
                  .filter(s => s.kategória === kat && (s.többszörös || !session.aktív_státuszok.some(st => st.startsWith(s.név + ' ('))))
                  .sort((a, b) => a.név.localeCompare(b.név, 'hu'));
                if (items.length === 0) return null;
                return (
                  <div key={kat}>
                    <div className="aktiv-picker-category">{kat.charAt(0).toUpperCase() + kat.slice(1)}</div>
                    {items.map(s => {
                      const isAuto = s.név === 'Sérült';
                      return (
                        <div key={s.név} className={`aktiv-picker-item${isAuto ? ' aktiv-picker-disabled' : ''}`} onClick={() => {
                          if (isAuto) return;
                          if (s.többszörös && s.alkategóriák?.length) {
                            setÉrzékválasztó(s.név);
                          } else if (s.fokok.length === 1) {
                            pushUndo(`Státusz: ${s.név} (1)`);
                            setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${s.név} (1)`] }));
                            setShowPicker(false);
                          } else {
                            setFokválasztó(s.név);
                          }
                        }}>
                          <span className="aktiv-picker-item-name">{isAuto ? 'Sérült (auto)' : s.név}</span>
                          <span className="aktiv-picker-item-details">{s.fokok.map(f => `${f.fok}. ${f.alcím}`).join(' • ')}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {érzékválasztó && !fokválasztó && (() => {
                const def = data.statuszok.find(s => s.név === érzékválasztó);
                return (
                  <div>
                    <div className="aktiv-picker-category">Alkategória kiválasztása</div>
                    {(def?.alkategóriák ?? []).map(é => (
                      <div key={é} className="aktiv-picker-item" onClick={() => { setFokválasztó(`${érzékválasztó}: ${é}`); setÉrzékválasztó(null); }}>
                        <span className="aktiv-picker-item-name">{é}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {fokválasztó && (() => {
                const baseName = fokválasztó.includes(': ') ? fokválasztó.split(': ')[0] : fokválasztó;
                const def = data.statuszok.find(s => s.név === baseName);
                if (!def) return null;
                return def.fokok.map(f => (
                  <div key={f.fok} className="aktiv-picker-item" onClick={() => {
                    setSession(prev => ({ ...prev, aktív_státuszok: [...prev.aktív_státuszok, `${fokválasztó} (${f.fok})`] }));
                    setShowPicker(false); setFokválasztó(null);
                  }}>
                    <span className="aktiv-picker-item-name">{f.alcím} ({f.fok})</span>
                    <span className="aktiv-picker-item-hatas">{f.hatások.slice(0, 4).map((h: any) => {
                      if (typeof h === 'string') return h;
                      const célNév = data.esemenyek.find(e => e.id === h.cél)?.név ?? h.cél;
                      if (h.operátor === 'hátrány') return `Hátrány${h.érték} ${célNév}`;
                      if (h.operátor === 'előny') return `Előny+${h.érték} ${célNév}`;
                      if (h.operátor === 'letilt') return `❌ ${célNév}`;
                      if (h.operátor === 'max_limit') return `Max ${h.érték} ${célNév}`;
                      if (h.operátor === 'arányos') return `${célNév} ×${h.érték}`;
                      if (h.operátor === 'szöveges') return h.megjegyzés || célNév;
                      return `${célNév}: ${h.operátor}`;
                    }).join('; ')}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
