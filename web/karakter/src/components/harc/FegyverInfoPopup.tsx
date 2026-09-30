import { PopupOverlay } from '../PopupOverlay';
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { buildFegyverInfó } from './fegyver-info-calc';

interface Props {
  result: FegyverResult;
  karakter: Karakter;
  data: GameData;
  onClose: () => void;
}

/**
 * Fegyver infó overlay: a fegyvertábla névre kattintva nyílik. Részletes, statikus adatok:
 * harcértékek aktoronként (csak fegyver-harcérték), extrák, anyag, Idea, harcmodor szint.
 */
export function FegyverInfoPopup({ result, karakter, data, onClose }: Props) {
  const info = buildFegyverInfó(result, karakter, data);
  const ideaSzöveg = info.idea !== null
    ? (info.idea === info.ideaDefault ? String(info.idea) : `${info.idea} (alap: ${info.ideaDefault})`)
    : null;

  return (
    <PopupOverlay onClose={onClose} className="kep-prompt fi-popup">
      <div className="ke-dobas-header">{info.név}</div>

      <div className="fi-meta">
        <div className="fi-meta-row">
          <span className="fi-meta-label">Harcmodor</span>
          <span className="fi-meta-value">{info.harcmodorNév}: {info.harcmodorSzint}. szint</span>
        </div>
        {info.anyag !== null && (
          <div className="fi-meta-row">
            <span className="fi-meta-label">Anyag</span>
            <span className="fi-meta-value">{info.anyag}</span>
          </div>
        )}
        {ideaSzöveg !== null && (
          <div className="fi-meta-row">
            <span className="fi-meta-label">Idea</span>
            <span className="fi-meta-value">{ideaSzöveg}</span>
          </div>
        )}
        {info.extrák.length > 0 && (
          <div className="fi-meta-row">
            <span className="fi-meta-label">Extrák</span>
            <span className="fi-meta-value">{info.extrák.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="fi-modok-cim">Harcértékek aktoronként</div>
      <table className="fi-modok-table">
        <thead>
          <tr>
            <th>Aktor</th>
            <th>TÉ</th>
            <th>VÉ</th>
            <th>SP</th>
            <th>Át</th>
            <th>Tám</th>
          </tr>
        </thead>
        <tbody>
          {info.módok.map((m, i) => (
            <tr key={m.aktor + i} className={m.sebzéstípus === 'elsődleges' ? 'fi-mod-elsodleges' : 'fi-mod-masodlagos'}>
              <td className="fi-mod-aktor">
                {m.aktor}
                <span className="fi-mod-tipus">{m.sebzéstípus === 'elsődleges' ? 'elsődleges' : 'másodlagos'}</span>
              </td>
              <td>{m.TÉ}</td>
              <td>{m.VÉ}</td>
              <td className="fi-mod-sp">
                {m.SP}
                <span className="fi-mod-jelleg">{m.jelleg}</span>
              </td>
              <td>{m.Átütés}</td>
              <td>{m.támadások}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PopupOverlay>
  );
}
