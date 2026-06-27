import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { calcReszletekData, type KétkezesBontás } from './harc-reszletek-calc';

interface Props {
  karakter: Karakter;
  session: Session;
  data: GameData;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  téLevonás: number;
  pajzsVÉ: number;
}

function fmtMod(val: number): string {
  return val > 0 ? `+${val}` : `${val}`;
}

/** Kétkezes fegyver+MF bontás egy harcértékhez (TÉ vagy VÉ). */
function renderKétkezesFegyverMf(
  kh: KétkezesBontás,
  értékMező: 'TÉ' | 'VÉ',
) {
  const nFegyver = kh.nagyobb[értékMező];
  const kFegyver = kh.kisebb[értékMező];
  const mfMező = értékMező === 'TÉ' ? 'mfTÉ' : 'mfVÉ';
  const nMf = kh.nagyobb[mfMező];
  const kMf = kh.kisebb[mfMező];
  return (<>
    {` · ${kh.nagyobb.név}: ${fmtMod(nFegyver)}`}
    {` · ${kh.kisebb.név}: ${fmtMod(kFegyver)}`}
    {(nMf !== 0 || kMf !== 0) && ` · MF(${kh.nagyobb.név}): +${nMf}`}
    {kMf !== 0 && ` · MF(${kh.kisebb.név}): +${kMf}`}
  </>);
}

export function HarcReszletek({ karakter, session, data, fegyverResults, kétkezesResult, fogásResult, taktikaMods, fortelyMods, téLevonás, pajzsVÉ }: Props) {
  const d = calcReszletekData(karakter, session, data, fegyverResults, kétkezesResult, fogásResult, taktikaMods, téLevonás, pajzsVÉ);
  if (!d) return null;

  const { konstansok } = data;
  const k = karakter;
  const r = d.result;

  return (
    <div className="harc-reszletek">
      <strong className="harc-reszletek-title">Részletes értékek</strong>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">Név: </span>
        <span>{d.fegyverNév} [{d.kategória}]</span>
      </div>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">Támadás/kör: {r.támadások}</span>
        <div className="harc-reszletek-indent">
          Harckeret: {r.harckeret} ({d.harcmodorNév} {d.harcmodorSzint} + Gyor {k.tulajdonságok.gyorsaság}{fortelyMods['harckeret'] ? ` + Fortély ${fmtMod(fortelyMods['harckeret'])}` : ''}) ÷ Sebesség: {r.sebesség}
        </div>
      </div>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">TÉ: {d.finalTÉ}</span>
        <div className="harc-reszletek-indent">
          Alap: {konstansok.harcérték_alap.TÉ} · Erő: {k.tulajdonságok.erő} · Ügy: {k.tulajdonságok.ügyesség} · Gyor: {k.tulajdonságok.gyorsaság} · HM: {k.HM_TÉ}
          {d.harcmodorTÉ !== 0 && ` · Harcmodor: ${fmtMod(d.harcmodorTÉ)}`}
          {d.kétkezes ? renderKétkezesFegyverMf(d.kétkezes, 'TÉ') : (<>
            {r.alap_TÉ !== 0 && ` · Fegyver: ${fmtMod(r.alap_TÉ)}`}
            {d.mfTÉ !== 0 && ` · MF: +${d.mfTÉ}`}
          </>)}
          {fortelyMods['TÉ'] !== 0 && ` · Fortély: ${fmtMod(fortelyMods['TÉ'])}`}
          {taktikaMods['TÉ'] !== 0 && ` · Taktika: ${fmtMod(taktikaMods['TÉ'])}`}
          {d.téFogásBüntetés !== 0 && ` · Fogás: ${d.téFogásBüntetés}`}
          {d.többTám !== 0 && ` · Több tám: ${d.többTám}`}
          {téLevonás !== 0 && ` · Sérülés: ${téLevonás}`}
        </div>
      </div>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">VÉ: {d.finalVÉ}</span>
        <div className="harc-reszletek-indent">
          Alap: {konstansok.harcérték_alap.VÉ} · Gyor: {k.tulajdonságok.gyorsaság} · Ügy: {k.tulajdonságok.ügyesség} · HM: {k.HM_VÉ}
          {d.harcmodorVÉ !== 0 && ` · Harcmodor: ${fmtMod(d.harcmodorVÉ)}`}
          {d.kétkezes ? renderKétkezesFegyverMf(d.kétkezes, 'VÉ') : (<>
            {r.alap_VÉ !== 0 && ` · Fegyver: ${fmtMod(r.alap_VÉ)}`}
            {d.mfVÉ !== 0 && ` · MF: +${d.mfVÉ}`}
          </>)}
          {fortelyMods['VÉ'] !== 0 && ` · Fortély: ${fmtMod(fortelyMods['VÉ'])}`}
          {d.véFogásBónusz !== 0 && ` · Fogás: +${d.véFogásBónusz}`}
          {pajzsVÉ !== 0 && !fogásResult && ` · Pajzs: +${pajzsVÉ}`}
          {taktikaMods['VÉ'] !== 0 && ` · Taktika: ${fmtMod(taktikaMods['VÉ'])}`}
          {session.vé_csökkenés !== 0 && ` · Csökkenés: -${session.vé_csökkenés}`}
        </div>
      </div>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">SP: {d.finalSP} {r.sebzésmód}</span>
        <div className="harc-reszletek-indent">
          Fegyver: {d.fegyverAlapSP} · Erőbónusz: {d.erőBónusz}{d.erőBónuszLimit < 99 && ` (limit: ${d.erőBónuszLimit})`}
          {d.kétkezes ? (<>
            {d.kétkezes.nagyobb.mfSP !== 0 && ` · MF(${d.kétkezes.nagyobb.név}): +${d.kétkezes.nagyobb.mfSP}`}
            {d.kétkezes.kisebb.mfSP !== 0 && ` · MF(${d.kétkezes.kisebb.név}): +${d.kétkezes.kisebb.mfSP}`}
          </>) : (<>
            {d.mfSP !== 0 && ` · MF: +${d.mfSP}`}
          </>)}
          {fortelyMods['SP'] !== 0 && ` · Fortély: ${fmtMod(fortelyMods['SP'])}`}
          {taktikaMods['SP'] !== 0 && ` · Taktika: ${fmtMod(taktikaMods['SP'])}`}
        </div>
      </div>

      <div className="harc-reszletek-section">
        <span className="harc-reszletek-label">Pengehossz: {r.pengehossz + (fortelyMods['pengehossz'] ?? 0)}</span>
        <div className="harc-reszletek-indent">
          Alap: {r.pengehossz}
          {(fortelyMods['pengehossz'] ?? 0) !== 0 && ` · Fortély: +${fortelyMods['pengehossz']}`}
          {d.sumPengehossz !== null && ` · Összpenge: ${d.sumPengehossz + (fortelyMods['pengehossz'] ?? 0)}`}
        </div>
      </div>
    </div>
  );
}
