import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../../engine/data-loader';
import type { Session } from '../../engine/types';
import { useEscapeClose } from '../../hooks/useEscapeClose';

interface Props {
  data: GameData;
  session: Session;
  onPick: (fullName: string) => void;
  onClose: () => void;
}

export function StatuszPickerOverlay({ data, session, onPick, onClose }: Props) {
  useEscapeClose(true, onClose);
  const [fokválasztó, setFokválasztó] = useState<string | null>(null);
  const [érzékválasztó, setÉrzékválasztó] = useState<string | null>(null);

  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) { onClose(); } }}>
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
                        onPick(`${s.név} (1)`);
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
              <div key={f.fok} className="aktiv-picker-item" onClick={() => { onPick(`${fokválasztó} (${f.fok})`); }}>
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
  );
}
