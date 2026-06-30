import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult } from './types';
import { lookupFegyver } from '../../engine/utils';
import { findMfFok, getMfBónusz, resolveNagyobbKisebb, buildPajzsFegyverNév } from './shared';

export interface KétkezesBontás {
  nagyobb: { név: string; TÉ: number; VÉ: number; mfTÉ: number; mfVÉ: number; mfSP: number };
  kisebb: { név: string; TÉ: number; VÉ: number; mfTÉ: number; mfVÉ: number; mfSP: number };
}

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
  kétkezes: KétkezesBontás | null;
  páncélMGT: number;
}

const MF_ZERO = { TÉ: 0, VÉ: 0, SP: 0 };

interface KétkezesMfResult {
  TÉ: number; VÉ: number; SP: number;
  nagyobb: { TÉ: number; VÉ: number; SP: number };
  kisebb: { TÉ: number; VÉ: number; SP: number };
}

/** Kétkezes MF bónusz a khFok mf szabálya alapján ("nincs"/"nagyobb"/"mindkettő").
 *  A nagyobb/kisebb a pengehossz szerinti sorrend (konzisztens a kétkezesBontás-sal). */
function calcKétkezesMf(
  k: Karakter, session: Session, data: GameData,
  _jobbMfFok: number,
): KétkezesMfResult {
  const { konstansok } = data;
  const khFok = k.fortélyok.find(f => f.név === 'Kétkezes harc')?.fok ?? 0;
  const khFokEntry = konstansok.kétkezes_harc_bónuszok?.find((b: any) => b.fok === khFok);
  const mfMode: string = khFokEntry?.mf ?? 'nincs';

  if (mfMode === 'nincs') return { ...MF_ZERO, nagyobb: MF_ZERO, kisebb: MF_ZERO };

  const jobbFp = k.fegyverek[session.aktív_fegyver_index];
  const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
  const jobbDef = jobbFp ? lookupFegyver(data.fegyverek, jobbFp.alap) : null;
  const balDef = balFp ? lookupFegyver(data.fegyverek, balFp.alap) : null;
  if (!jobbDef || !balDef) return { ...MF_ZERO, nagyobb: MF_ZERO, kisebb: MF_ZERO };

  const { nagyobb: nagyobbDef, kisebb: kisebbDef, nagyobbFp, kisebbFp } = resolveNagyobbKisebb(jobbDef, balDef, jobbFp, balFp);

  const nagyobbNév = nagyobbDef.Alapnév || nagyobbDef.Fegyver || '';
  const nagyobbMfFok = findMfFok(k, nagyobbNév, nagyobbFp.alap);
  const mfN = getMfBónusz(konstansok, nagyobbMfFok);

  if (mfMode !== 'mindkettő') return { ...mfN, nagyobb: mfN, kisebb: MF_ZERO };

  const kisebbNév = kisebbDef.Alapnév || kisebbDef.Fegyver || '';
  const kisebbMfFok = findMfFok(k, kisebbNév, kisebbFp.alap);
  const mfK = getMfBónusz(konstansok, kisebbMfFok);
  return { TÉ: mfN.TÉ + mfK.TÉ, VÉ: mfN.VÉ + mfK.VÉ, SP: mfN.SP + mfK.SP, nagyobb: mfN, kisebb: mfK };
}

export function calcReszletekData(
  karakter: Karakter, session: Session, data: GameData,
  fegyverResults: FegyverResult[],
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null,
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null,
  taktikaMods: Record<string, number>,
  téLevonás: number,
  pajzsVÉ: number,
  páncélMGT: number,
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
    const pajzsFegyverNév = buildPajzsFegyverNév(k);
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
  const mfResult = kétkezesResult
    ? calcKétkezesMf(k, session, data, mfFok)
    : null;
  const mf = mfResult ?? getMfBónusz(konstansok, mfFok);

  // Kétkezes bontás adatok
  let kétkezesBontás: KétkezesBontás | null = null;
  if (kétkezesResult) {
    const jobbFp2 = k.fegyverek[session.aktív_fegyver_index];
    const balFp2 = k.fegyverek[session.aktív_fegyver_bal_index];
    const jobbDef2 = jobbFp2 ? lookupFegyver(data.fegyverek, jobbFp2.alap) : null;
    const balDef2 = balFp2 ? lookupFegyver(data.fegyverek, balFp2.alap) : null;
    if (jobbDef2 && balDef2) {
      const { nagyobb: nDef, kisebb: kDef } = resolveNagyobbKisebb(jobbDef2, balDef2, jobbFp2, balFp2);
      kétkezesBontás = {
        nagyobb: {
          név: nDef.Alapnév || nDef.Fegyver || '',
          TÉ: parseInt(nDef.TÉ ?? '0') || 0,
          VÉ: parseInt(nDef.VÉ ?? '0') || 0,
          mfTÉ: mfResult?.nagyobb.TÉ ?? 0,
          mfVÉ: mfResult?.nagyobb.VÉ ?? 0,
          mfSP: mfResult?.nagyobb.SP ?? 0,
        },
        kisebb: {
          név: kDef.Alapnév || kDef.Fegyver || '',
          TÉ: parseInt(kDef.TÉ ?? '0') || 0,
          VÉ: parseInt(kDef.VÉ ?? '0') || 0,
          mfTÉ: mfResult?.kisebb.TÉ ?? 0,
          mfVÉ: mfResult?.kisebb.VÉ ?? 0,
          mfSP: mfResult?.kisebb.SP ?? 0,
        },
      };
    }
  }

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
    kétkezes: kétkezesBontás,
    páncélMGT,
  };
}
