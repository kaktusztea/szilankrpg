import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from '../HarcCalc';
import { lookupFegyver } from '../../engine/helpers';

interface HarcFegyverTableProps {
  karakter: Karakter;
  session: Session;
  data: GameData;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  pajzsVÉ: number;
  pajzsFegyverNév: string | null;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  téLevonás: number;
  belharciAktív: boolean;
  véFlash: '' | 'down' | 'up';
  onTámInfoClick: (info: { név: string; sebesség: number; harckeret: number }) => void;
}

export function HarcFegyverTable({
  karakter, session, data, fegyverResults, kétkezesResult, fogásResult,
  pajzsVÉ, pajzsFegyverNév, taktikaMods, fortelyMods,
  téLevonás, belharciAktív, véFlash, onTámInfoClick,
}: HarcFegyverTableProps) {
  const { konstansok } = data;
  const k = karakter;
  const többTámTÉ = konstansok.több_támadás_TÉ_levonás;
  const véFlashClass = véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : '';
  const phBonusClass = fortelyMods['pengehossz'] ? 'ph-bonus' : undefined;

  function renderKétkezes() {
    if (!kétkezesResult) return null;
    const r = kétkezesResult;
    return (
      <tr style={{ border: '2px solid #90caf9' }}>
        <td style={belharciAktív && r.sumPengehossz > 0 ? { color: '#e53935' } : undefined}>{r.fegyver_név}</td>
        <td className="harc-tam-clickable" onClick={() => onTámInfoClick({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
        <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + (r.támadások > 1 ? többTámTÉ : 0)}</td>
        <td className={véFlashClass}>{Math.max(0, r.VÉ + pajzsVÉ + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
        <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
        <td className={phBonusClass}>{r.pengehossz + fortelyMods['pengehossz']}({r.sumPengehossz + fortelyMods['pengehossz']})</td>
      </tr>
    );
  }

  function renderFogás() {
    if (kétkezesResult || !fogásResult) return null;
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    const jobbNév = jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : '';
    const r = fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? fegyverResults[0];
    if (!r) return null;
    return (
      <tr style={{ border: '2px solid #90caf9' }}>
        <td>{fogásResult.név}</td>
        <td className="harc-tam-clickable" onClick={() => onTámInfoClick({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
        <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + fogásResult.TÉ_büntetés + (r.támadások > 1 ? többTámTÉ : 0)}</td>
        <td className={véFlashClass}>{Math.max(0, r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
        <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
        <td className={phBonusClass}>{r.pengehossz + fortelyMods['pengehossz']}</td>
      </tr>
    );
  }

  function getRowOpacity(r: FegyverResult): React.CSSProperties | undefined {
    if (kétkezesResult || fogásResult) return { opacity: 0.4 };
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    const jobbNév = session.aktív_fegyver_index === -2
      ? (pajzsFegyverNév ?? '')
      : jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : 'Puszta kéz';
    if (r.fegyver_név !== jobbNév) return { opacity: 0.4 };
    return undefined;
  }

  return (
    <table className="harc-table">
      <thead>
        <tr>
          <th>{belharciAktív ? <span className="harc-belharc-label">BELHARC</span> : 'Fegyver'}</th>
          <th>Tám</th><th className="te-col">TÉ</th><th className="ve-col">VÉ</th><th>SP</th><th>Ph</th>
        </tr>
      </thead>
      <tbody>
        {renderKétkezes()}
        {renderFogás()}
        {fegyverResults.map((r, i) => (
          <tr key={i} style={getRowOpacity(r)}>
            <td style={belharciAktív && r.pengehossz > 0 ? { color: '#e53935' } : undefined}>{r.fegyver_név}</td>
            <td className="harc-tam-clickable" onClick={() => onTámInfoClick({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
            <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + (r.támadások > 1 ? többTámTÉ : 0)}</td>
            <td className={véFlashClass}>{Math.max(0, r.VÉ + (fogásResult ? 0 : pajzsVÉ) + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
            <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
            <td className={phBonusClass}>{r.pengehossz + fortelyMods['pengehossz']}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
