import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { lookupFegyver } from '../../engine/utils';
import { computeTÉ, computeVÉ } from './shared';

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
  const többTámTÉ = konstansok.több_támadás_TÉ_levonás;
  const véFlashClass = véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : '';
  const phBonusClass = fortelyMods['pengehossz'] ? 'ph-bonus' : undefined;
  const hasOverlayRow = !!(kétkezesResult || fogásResult);

  function getAktívFegyverNév(): string {
    if (session.aktív_fegyver_index === -2) return pajzsFegyverNév ?? '';
    const jobbFp = karakter.fegyverek[session.aktív_fegyver_index];
    return jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : 'Puszta kéz';
  }

  function renderRow(r: FegyverResult, opts: {
    veBónusz: number; téExtra: number; isOverlay: boolean; dimmed?: boolean;
    displayNév?: string; showPh2?: number;
  }) {
    const { veBónusz, téExtra, isOverlay, dimmed, displayNév, showPh2 } = opts;
    const té = computeTÉ(r.TÉ, téLevonás, taktikaMods['TÉ'], téExtra, r.támadások, többTámTÉ);
    const vé = computeVÉ(r.VÉ, veBónusz, taktikaMods['VÉ'], session.vé_csökkenés);
    const sp = r.SP + taktikaMods['SP'];
    const ph = r.pengehossz + (fortelyMods['pengehossz'] ?? 0);
    const pengeWarning = belharciAktív && r.pengehossz > 0;
    const név = displayNév ?? r.fegyver_név;

    return (
      <tr key={név + (isOverlay ? '-overlay' : '')}
        className={isOverlay ? 'harc-fegyver-active-row' : dimmed ? 'harc-row-dimmed' : undefined}>
        <td className={pengeWarning ? 'harc-belharc-warn' : undefined}>{név}</td>
        <td className="harc-tam-clickable" onClick={() => onTámInfoClick({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
        <td>{té}</td>
        <td className={véFlashClass}>{vé}</td>
        <td>{sp} {r.sebzésmód}</td>
        <td className={phBonusClass}>{showPh2 != null ? `${ph}(${showPh2 + (fortelyMods['pengehossz'] ?? 0)})` : ph}</td>
      </tr>
    );
  }

  function renderOverlayRow() {
    if (kétkezesResult) {
      return renderRow(kétkezesResult, {
        veBónusz: pajzsVÉ, téExtra: 0, isOverlay: true, showPh2: kétkezesResult.sumPengehossz,
      });
    }
    if (fogásResult) {
      const jobbNév = getAktívFegyverNév();
      const r = fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? fegyverResults[0];
      if (!r) return null;
      return renderRow(r, {
        veBónusz: fogásResult.VÉ_bónusz, téExtra: fogásResult.TÉ_büntetés,
        isOverlay: true, displayNév: fogásResult.név,
      });
    }
    return null;
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
        {renderOverlayRow()}
        {fegyverResults.map(r => renderRow(r, {
          veBónusz: fogásResult ? 0 : pajzsVÉ,
          téExtra: 0,
          isOverlay: false,
          dimmed: hasOverlayRow || r.fegyver_név !== getAktívFegyverNév(),
        }))}
      </tbody>
    </table>
  );
}
