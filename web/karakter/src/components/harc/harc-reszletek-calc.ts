import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { lookupFegyver } from '../../engine/helpers';

export interface ReszletekData {
  fegyverNév: string;
  kategória: string;
  harcmodorNév: string;
  harcmodorSzint: number;
  harcmodorTÉ: number;
  harcmodorVÉ: number;
  mfTÉ: number;
  mfVÉ: number;
  mfSP: number;
  erőBónusz: number;
  erőBónuszLimit: number;
  fegyverAlapSP: number;
  result: FegyverResult;
  finalTÉ: number;
  finalVÉ: number;
  finalSP: number;
  többTám: number;
  téFogásBüntetés: number;
  véFogásBónusz: number;
  sumPengehossz: number | null;
}

export function calcReszletekData(
  karakter: Karakter, session: Session, data: GameData,
  fegyverResults: FegyverResult[],
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null,
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null,
  taktikaMods: Record<string, number>,
  téLevonás: number,
  pajzsVÉ: number,
): ReszletekData | null {
  const k = karakter;
  const { konstansok, harcmodorBonusz } = data;
  const többTámTÉ = konstansok.több_támadás_TÉ_levonás;

  // Determine active fegyver result
  let aktívResult: FegyverResult | null = null;
  if (kétkezesResult) {
    aktívResult = kétkezesResult;
  } else {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    const pajzsFegyverNév = k.pajzs?.méret ? (k.pajzs.méret.charAt(0).toUpperCase() + k.pajzs.méret.slice(1) + ' Pajzs') : null;
    const jobbNév = session.aktív_fegyver_index === -2
      ? (pajzsFegyverNév ?? '')
      : jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : 'Puszta kéz';
    aktívResult = fegyverResults.find(r => r.fegyver_név === jobbNév) ?? fegyverResults[0] ?? null;
  }

  if (!aktívResult) return null;
  const r = aktívResult;

  // Lookup fegyver def
  const fDef = lookupFegyver(data.fegyverek, r.fegyver_név);
  const kat = fDef?.Kategória ?? 'közelharci';
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[kat] ?? 'Közelharc';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const hb = harcmodorBonusz.find((b: any) => b.szint === harcmodorSzint);
  const mfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === (fDef?.Alapnév || fDef?.Fegyver) || f.spec_elem === r.fegyver_név));
  const mfFok = mfEntry?.fok ?? 0;
  const mf = konstansok.mesterfegyver_bónuszok.find((b: any) => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const erőBónuszLimit = fDef && fDef['Erőbónusz limit'] !== '' ? parseInt(fDef['Erőbónusz limit']) : 99;
  const erőBónusz = Math.min(k.tulajdonságok.erő, erőBónuszLimit);

  const véFogásBónusz = fogásResult ? fogásResult.VÉ_bónusz : 0;
  const téFogásBüntetés = fogásResult ? fogásResult.TÉ_büntetés : 0;
  const többTám = r.támadások > 1 ? többTámTÉ : 0;
  const finalTÉ = r.TÉ + téLevonás + taktikaMods['TÉ'] + téFogásBüntetés + többTám;
  const finalVÉ = Math.max(0, r.VÉ + (kétkezesResult ? pajzsVÉ : fogásResult ? fogásResult.VÉ_bónusz : pajzsVÉ) + taktikaMods['VÉ'] - session.vé_csökkenés);
  const finalSP = r.SP + taktikaMods['SP'];

  return {
    fegyverNév: r.fegyver_név,
    kategória: kat,
    harcmodorNév,
    harcmodorSzint,
    harcmodorTÉ: hb?.TÉ ?? 0,
    harcmodorVÉ: hb?.VÉ ?? 0,
    mfTÉ: mf.TÉ,
    mfVÉ: mf.VÉ,
    mfSP: mf.SP,
    erőBónusz,
    erőBónuszLimit,
    fegyverAlapSP: fDef ? (parseInt(fDef.SP) || 0) : 0,
    result: r,
    finalTÉ,
    finalVÉ,
    finalSP,
    többTám,
    téFogásBüntetés,
    véFogásBónusz,
    sumPengehossz: kétkezesResult ? kétkezesResult.sumPengehossz : null,
  };
}
