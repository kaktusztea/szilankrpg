import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { evaluate, buildContext } from '../../engine/reactive';
import { lookupFegyver } from '../../engine/helpers';
import { calcKétkezesHarc } from '../../engine/ketkezes';
import type { FegyverResult } from './types';

/** Fegyver sorok felépítése (karakter fegyverek + puszta kéz + MK párok + pajzs) */
export function buildFegyverRows(k: Karakter, data: GameData, pajzsFegyverNév: string | null) {
  const rows: { név: string; fDef: any; mfFok: number }[] = [];
  const pusztaKez = lookupFegyver(data.fegyverek, 'puszta kéz');
  if (pusztaKez) rows.push({ név: pusztaKez.Fegyver, fDef: pusztaKez, mfFok: 0 });
  for (const fp of k.fegyverek) {
    const fDef = lookupFegyver(data.fegyverek, fp.alap);
    if (!fDef) continue;
    const displayName = fDef.Alapnév || fDef.Fegyver;
    const mfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fp.alap));
    rows.push({ név: fDef.Fegyver, fDef, mfFok: mfEntry?.fok ?? 0 });
    if (fDef.MK_pár) {
      const párDef = lookupFegyver(data.fegyverek, fDef.MK_pár);
      if (párDef) rows.push({ név: párDef.Fegyver, fDef: párDef, mfFok: mfEntry?.fok ?? 0 });
    }
  }
  if (pajzsFegyverNév) {
    const pajzsDef = lookupFegyver(data.fegyverek, pajzsFegyverNév);
    if (pajzsDef) rows.push({ név: pajzsDef.Fegyver, fDef: pajzsDef, mfFok: 0 });
  }
  return rows;
}

/** Fegyver harcértékek kiszámítása reactive engine-nel */
export function calcFegyverResults(
  fegyverRows: { fDef: any; mfFok: number }[],
  k: Karakter, data: GameData,
  fortelyMods: Record<string, number>,
  merevvértFok: number,
  harcmodorÖsszeg: number,
  lookupArrays: Map<string, Record<string, number | string>[]>,
  stringCtx: Map<string, string>,
): FegyverResult[] {
  const { konstansok, harcmodorBonusz } = data;
  return fegyverRows.map(({ fDef, mfFok }) => {
    const kat = fDef.Kategória;
    const harcmodorNév = konstansok.fegyver_kategória_harcmodor[kat] ?? 'Közelharc';
    const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
    const hb = harcmodorBonusz.find((b: any) => b.szint === harcmodorSzint);
    const mf = konstansok.mesterfegyver_bónuszok.find((b: any) => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

    let alapSP = parseInt(fDef.SP) || 0;
    for (const kf of k.fortélyok) {
      const fDef2 = data.fortelySummaries.find(d => d.név === kf.név);
      if (!fDef2) continue;
      const fokDef2 = fDef2.fokok.find((fd: any) => fd.fok === kf.fok);
      if (!fokDef2?.módosítók) continue;
      for (const mod of fokDef2.módosítók) {
        if (mod.mód !== 'override' || mod.cél !== 'SP') continue;
        if (typeof mod.feltétel === 'string' && mod.feltétel.startsWith('fegyver:')) {
          if (fDef.Fegyver.toLowerCase() === mod.feltétel.slice('fegyver:'.length).toLowerCase()) alapSP = mod.érték;
        }
      }
    }

    const fCtx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
      HM_TÉ: k.HM_TÉ, HM_VÉ: k.HM_VÉ, felszerelés_mgt: 0,
      merevvért_fok: merevvértFok,
      páncél_van: k.páncél.alap ? 1 : 0, páncél_végtagvédettség: k.páncél.végtagvédettség,
      páncél_sisak: k.páncél.sisak ? 1 : 0, páncél_idea: k.páncél.idea, páncél_rongálódás: k.páncél.rongálódás,
      fegyver_harcmodor_TÉ: hb?.TÉ ?? 0, fegyver_harcmodor_VÉ: hb?.VÉ ?? 0, fegyver_harcmodor_szint: harcmodorSzint,
      fegyver_alap_TÉ: parseInt(fDef.TÉ) || 0, fegyver_alap_VÉ: parseInt(fDef.VÉ) || 0, fegyver_alap_SP: alapSP,
      fegyver_erőbónusz_limit: fDef['Erőbónusz limit'] !== '' ? parseInt(fDef['Erőbónusz limit']) : 99,
      fegyver_sebesség: parseInt(fDef.Sebesség) || 6,
      fegyver_mf_TÉ: mf.TÉ, fegyver_mf_VÉ: mf.VÉ, fegyver_mf_SP: mf.SP,
      fegyver_fortély_TÉ: fortelyMods['TÉ'], fegyver_fortély_VÉ: fortelyMods['VÉ'], fegyver_fortély_SP: fortelyMods['SP'],
      fegyver_fortély_harckeret: fortelyMods['harckeret'],
      harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: 0,
    });
    const fComp = evaluate(data.rules, fCtx, lookupArrays, stringCtx);
    return {
      fegyver_név: fDef.Fegyver,
      TÉ: fComp.get('fegyver_TÉ') ?? 0, VÉ: fComp.get('fegyver_VÉ') ?? 0, SP: fComp.get('fegyver_SP') ?? 0,
      támadások: fComp.get('fegyver_támadások') ?? 1, harckeret: fComp.get('fegyver_harckeret') ?? 0,
      sebesség: parseInt(fDef.Sebesség) || 6, pengehossz: parseFloat(fDef.Pengehossz) || 0,
      sebzésmód: fDef['Sebzés módja'], alap_TÉ: parseInt(fDef.TÉ) || 0, alap_VÉ: parseInt(fDef.VÉ) || 0,
    };
  });
}

/** Fegyver override helyzetek alapján (pl. Belharc: fegyver TÉ/VÉ=0 ha pengehossz>0) */
export function applyFegyverOverrides(
  results: FegyverResult[], session: Session, data: GameData,
  feltételTeljesül: (feltétel: unknown) => boolean,
) {
  for (const helyzetNév of session.aktív_helyzetek) {
    const hDef = data.harciHelyzetek.find(h => h.név === helyzetNév);
    if (!hDef?.fegyver_override) continue;
    if (!feltételTeljesül(hDef.fegyver_override.feltétel)) continue;
    for (const mod of hDef.fegyver_override.módosítók) {
      for (const r of results) {
        if (mod.cél === 'fegyver_TÉ' && mod.mód === 'override') r.TÉ -= r.alap_TÉ;
        if (mod.cél === 'fegyver_VÉ' && mod.mód === 'override') r.VÉ -= r.alap_VÉ;
      }
    }
  }
}

/** Kétkezes harc + override */
export function calcKetkezes(
  k: Karakter, session: Session, data: GameData,
  fortelyMods: Record<string, number>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): (FegyverResult & { sumPengehossz: number }) | null {
  if (!session.kétkezes_harc || session.aktív_fegyver_bal_index < 0) return null;
  const jobbFp = k.fegyverek[session.aktív_fegyver_index];
  const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
  if (!jobbFp || !balFp) return null;
  const result = calcKétkezesHarc({
    jobbFp, balFp, fegyverek: data.fegyverek, karakter: k,
    konstansok: data.konstansok, harcmodorBonusz: data.harcmodorBonusz, fortelyMods,
  });
  if (!result) return null;
  for (const helyzetNév of session.aktív_helyzetek) {
    const hDef = data.harciHelyzetek.find(h => h.név === helyzetNév);
    if (!hDef?.fegyver_override) continue;
    if (!feltételTeljesül(hDef.fegyver_override.feltétel)) continue;
    for (const mod of hDef.fegyver_override.módosítók) {
      if (mod.cél === 'fegyver_TÉ' && mod.mód === 'override') result.TÉ -= result.alap_TÉ;
      if (mod.cél === 'fegyver_VÉ' && mod.mód === 'override') result.VÉ -= result.alap_VÉ;
    }
  }
  return result;
}
