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

const MF_ZERO = { TÉ: 0, VÉ: 0, SP: 0 };

/** Mesterfegyver fok keresés fegyver alapján (case-insensitive). */
function findMfFok(k: Karakter, fegyverNév: string, fegyverAlap: string): number {
  const entry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (
    f.spec_elem?.toLowerCase() === fegyverNév.toLowerCase() ||
    f.spec_elem?.toLowerCase() === fegyverAlap.toLowerCase()
  ));
  return entry?.fok ?? 0;
}

/** MF bónusz lookup fokszám alapján. */
function getMfBónusz(konstansok: any, fok: number): { TÉ: number; VÉ: number; SP: number } {
  return konstansok.mesterfegyver_bónuszok.find((b: any) => b.fok === fok) ?? MF_ZERO;
}

/** Kétkezes MF bónusz a khFok mf szabálya alapján ("nincs"/"nagyobb"/"mindkettő"). */
function calcKétkezesMf(
  k: Karakter, session: Session, data: GameData,
  jobbMfFok: number,
): { TÉ: number; VÉ: number; SP: number } {
  const { konstansok } = data;
  const khFok = k.fortélyok.find(f => f.név === 'Kétkezes harc')?.fok ?? 0;
  const khFokEntry = konstansok.kétkezes_harc_bónuszok?.find((b: any) => b.fok === khFok);
  const mfMode: string = khFokEntry?.mf ?? 'nincs';

  if (mfMode === 'nincs') return MF_ZERO;

  const mfN = getMfBónusz(konstansok, jobbMfFok);
  if (mfMode !== 'mindkettő') return mfN;

  // "mindkettő": jobb + bal kéz MF összege
  const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
  if (!balFp) return mfN;
  const balDef = lookupFegyver(data.fegyverek, balFp.alap);
  const balNév = balDef?.Alapnév || balDef?.Fegyver || '';
  const balMfFok = findMfFok(k, balNév, balFp.alap);
  const mfK = getMfBónusz(konstansok, balMfFok);
  return { TÉ: mfN.TÉ + mfK.TÉ, VÉ: mfN.VÉ + mfK.VÉ, SP: mfN.SP + mfK.SP };
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

  // Aktív fegyver result meghatározása
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

  // Fegyver def lookup — kétkezesnél a jobb kéz (ügyesebb) fegyverét használjuk
  const fDefLookupNév = kétkezesResult
    ? (k.fegyverek[session.aktív_fegyver_index]?.alap ?? r.fegyver_név)
    : r.fegyver_név;
  const fDef = lookupFegyver(data.fegyverek, fDefLookupNév);

  // Harcmodor
  const kat = fDef?.Kategória ?? 'közelharci';
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[kat] ?? 'Közelharc';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const hb = harcmodorBonusz.find((b: any) => b.szint === harcmodorSzint);

  // Mesterfegyver bónusz
  const fNév = fDef?.Alapnév || fDef?.Fegyver || '';
  const mfFok = findMfFok(k, fNév, fDefLookupNév);
  const mf = kétkezesResult
    ? calcKétkezesMf(k, session, data, mfFok)
    : getMfBónusz(konstansok, mfFok);

  // Erőbónusz
  const erőBónuszLimit = fDef && fDef['Erőbónusz limit'] !== '' ? parseInt(fDef['Erőbónusz limit']) : 99;
  const erőBónusz = Math.min(k.tulajdonságok.erő, erőBónuszLimit);

  // Végső értékek
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
