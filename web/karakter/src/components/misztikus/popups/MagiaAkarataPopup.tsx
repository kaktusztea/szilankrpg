import { useState } from 'react';
import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  onClose: () => void;
}

export function MagiaAkarataPopup({ onClose }: Props) {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <OverlayPortal dismissible onClose={onClose}>
      <div className="kep-prompt miszt-magia-popup" onClick={e => e.stopPropagation()}>
        <div className="miszt-magia-tabs">
          <button className={`miszt-magia-tab${tab === 0 ? ' active' : ''}`} onClick={() => setTab(0)}>
            Aurakiterjesztés
          </button>
          <button className={`miszt-magia-tab${tab === 1 ? ' active' : ''}`} onClick={() => setTab(1)}>
            Auraerősítés
          </button>
        </div>

        {tab === 0 && <AurakiterjesztesTab />}
        {tab === 1 && <AuraerosítesTab />}
      </div>
    </OverlayPortal>
  );
}

function AurakiterjesztesTab() {
  const rows: { label: string; szellemkéz: number; zóna: number }[] = [
    { label: 'Érintés / szemkontaktus', szellemkéz: 0, zóna: 0 },
    { label: 'Szoba', szellemkéz: 0, zóna: -3 },
    { label: 'Terem', szellemkéz: -3, zóna: -6 },
    { label: 'Mező', szellemkéz: -6, zóna: -9 },
    { label: 'Csatatér', szellemkéz: -9, zóna: -15 },
  ];

  return (
    <table className="miszt-magia-table">
      <thead>
        <tr><th></th><th>szellemkéz</th><th>zóna</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.label}>
            <td className="miszt-magia-label">{r.label}</td>
            <td className="miszt-magia-val">{r.szellemkéz}</td>
            <td className="miszt-magia-val">{r.zóna}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AuraerosítesTab() {
  const rows: { komp: number; bónusz: number }[] = [
    { komp: 9, bónusz: 1 },
    { komp: 12, bónusz: 3 },
    { komp: 15, bónusz: 5 },
    { komp: 18, bónusz: 7 },
    { komp: 21, bónusz: 9 },
    { komp: 24, bónusz: 11 },
    { komp: 27, bónusz: 13 },
    { komp: 30, bónusz: 15 },
  ];

  return (
    <div>
      <p className="miszt-magia-formula">Aurahangolás + Önuralom + k10</p>
      <table className="miszt-magia-table">
        <thead>
          <tr><th>Komplexitás</th><th>Bónusz</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.komp}>
              <td className="miszt-magia-val">{r.komp}</td>
              <td className="miszt-magia-val">+{r.bónusz}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
