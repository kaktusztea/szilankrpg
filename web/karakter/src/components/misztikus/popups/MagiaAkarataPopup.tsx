import { useState } from 'react';
import { OverlayPortal } from '../../overlays/OverlayPortal';

interface Props {
  onClose: () => void;
}

export function MagiaAkarataPopup({ onClose }: Props) {
  const [tab, setTab] = useState<0 | 1 | 2 | 3>(0);

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
          <button className={`miszt-magia-tab${tab === 2 ? ' active' : ''}`} onClick={() => setTab(2)}>
            Összhang
          </button>
          <button className={`miszt-magia-tab${tab === 3 ? ' active' : ''}`} onClick={() => setTab(3)}>
            Képzettség+
          </button>
        </div>

        {tab === 0 && <AurakiterjesztesTab />}
        {tab === 1 && <AuraerosítesTab />}
        {tab === 2 && <OsszehangTab />}
        {tab === 3 && <KepzettsegPlusTab />}
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

      <h4 className="miszt-osszh-title">Sikertelen:</h4>
      <ul className="miszt-magia-list">
        <li>Aura azonnal: <strong>-2</strong></li>
        <li>Regeneráció: 1 / óra</li>
        <li>NEM okoz auto kudarcot!</li>
      </ul>
    </div>
  );
}

function OsszehangTab() {
  const varázslóRows: { érték: number; leírás: string }[] = [
    { érték: -2, leírás: 'Erős koncentrálás másra' },
    { érték: -1, leírás: 'Koncentrálás másra' },
  ];

  const áldozatRows: { érték: number; leírás: string }[] = [
    { érték: -2, leírás: 'Papi védő áldás II. (adott arkánum ellen)' },
    { érték: -2, leírás: 'Isteni kegy' },
    { érték: -1, leírás: 'Friss szerelmes érzelmét elorozni — nehezebb (Asztrálmágia ellen)' },
    { érték: -1, leírás: 'Áldozat kiégett érzelmileg (Asztrálmágia ellen)' },
    { érték: -1, leírás: 'Harci láz (Asztrál/Mentálmágia ellen)' },
    { érték: -1, leírás: 'Papi védő áldás I. (adott arkánum ellen)' },
    { érték: -1, leírás: 'Védőszellem' },
    { érték: +1, leírás: 'Frissen összetört szívű fiatal ficsúrt asztrálmágiával elbájolni — könnyebb' },
    { érték: +2, leírás: 'Áldozat érzelmi sokkban' },
  ];

  return (
    <div className="miszt-osszh">
      <p className="miszt-magia-formula">Előny-Hátrány skálán eltolás (k10)</p>

      <h4 className="miszt-osszh-title">Varázsló állapota</h4>
      <table className="miszt-magia-table">
        <tbody>
          {varázslóRows.map((r, i) => (
            <tr key={i}>
              <td className="miszt-magia-val">{r.érték > 0 ? `+${r.érték}` : r.érték}</td>
              <td className="miszt-magia-label">{r.leírás}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="miszt-osszh-title">Áldozat állapota</h4>
      <table className="miszt-magia-table">
        <tbody>
          {áldozatRows.map((r, i) => (
            <tr key={i}>
              <td className="miszt-magia-val">{r.érték > 0 ? `+${r.érték}` : r.érték}</td>
              <td className="miszt-magia-label">{r.leírás}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KepzettsegPlusTab() {
  const rows: { szint: number; bónusz: number }[] = [
    { szint: 3, bónusz: 1 },
    { szint: 6, bónusz: 2 },
    { szint: 9, bónusz: 3 },
    { szint: 12, bónusz: 4 },
    { szint: 15, bónusz: 5 },
  ];

  return (
    <div className="miszt-osszh">
      <h4 className="miszt-osszh-title">Támadó oldal</h4>
      <table className="miszt-magia-table">
        <thead>
          <tr><th>Szint</th><th>Bónusz</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.szint}>
              <td className="miszt-magia-val">{r.szint}</td>
              <td className="miszt-magia-val">+{r.bónusz}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="miszt-magia-example">
        Példa: tengerész-varázsló (Hajózás: 6.szint) bónusza <strong>+2</strong> Mágia akaratra ha háborgó tengeren őrültet varázsolni.
      </p>

      <h4 className="miszt-osszh-title">Védelem</h4>
      <table className="miszt-magia-table">
        <thead>
          <tr><th>Szint</th><th>Módosító</th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.szint}>
              <td className="miszt-magia-val">{r.szint}</td>
              <td className="miszt-magia-val">-{r.bónusz}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="miszt-magia-example">
        Példa: hajóskapitányra (Hajózás: 9.szint) nyugodt tengeren nehezebb (<strong>-3</strong>) őrületet varázsolni.
      </p>
    </div>
  );
}
