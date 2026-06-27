import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { evaluate, buildContext } from '../../engine/reactive';
import { lookupFegyver } from '../../engine/helpers';
import { evaluateAlapesetek } from '../../engine/alapeset';
import { calcKétkezesHarc } from '../../engine/ketkezes';

export interface FegyverResult {
  fegyver_név: string;
  TÉ: number;
  VÉ: number;
  SP: number;
  támadások: number;
  harckeret: number;
  sebesség: number;
  pengehossz: number;
  sebzésmód: string;
  alap_TÉ: number;
  alap_VÉ: number;
}

export interface HarcComputed {
  ké: number;
  épValue: number;
  manöverPont: number;
  sfé_fizikai: number;
  sfé_energia: number;
  páncélLefedettség: number;
  taktikaMods: Record<string, number>;
  fortelyMods: Record<string, number>;
  fegyverResults: FegyverResult[];
  kétkezesResult: (FegyverResult & { sumPengehossz: number }) | null;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
  pajzsVÉ: number;
  belharciAktív: boolean;
  pajzsFegyverNév: string | null;
}

/** Taktika módosítók kiszámítása */
export function calcTaktikaMods(session: Session, data: GameData): Record<string, number> {
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      let fokDef = def.fokok.find(f => f.fok === at.fok);
      if (!fokDef && def.fortély_bővítés) {
        const utolsó = def.fokok[def.fokok.length - 1];
        const perFok: Record<string, number> = {};
        for (const [k, v] of Object.entries(utolsó)) { if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok; }
        fokDef = { fok: at.fok } as typeof utolsó;
        for (const [k, step] of Object.entries(perFok)) (fokDef as any)[k] = Math.round(step * at.fok);
      }
      if (fokDef) {
        if (fokDef.TÉ) mods['TÉ'] += fokDef.TÉ;
        if (fokDef.VÉ) mods['VÉ'] += fokDef.VÉ;
        if (fokDef.KÉ) mods['KÉ'] += fokDef.KÉ;
        if (fokDef.SP) mods['SP'] += fokDef.SP;
      }
    } else if (def.módosítók) {
      if (def.módosítók.TÉ) mods['TÉ'] += def.módosítók.TÉ;
      if (def.módosítók.VÉ) mods['VÉ'] += def.módosítók.VÉ;
      if (def.módosítók.KÉ) mods['KÉ'] += def.módosítók.KÉ;
      if (def.módosítók.SP) mods['SP'] += def.módosítók.SP;
    }
  }
  const véLimit = data.konstansok.taktika_vé_eltolás_limit;
  mods['VÉ'] = Math.max(-véLimit, Math.min(véLimit, mods['VÉ']));
  return mods;
}

/** Páncél lookup táblák építése */
export function buildPancelLookups(konstansok: any): Map<string, Record<string, number | string>[]> {
  const lookupArrays = new Map<string, Record<string, number | string>[]>();
  const csatoltMgt = konstansok.páncél_csatolt_tag_mgt;
  lookupArrays.set('csatolt_mgt_merev', Object.entries(csatoltMgt.merevvért_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('csatolt_mgt_fém', Object.entries(csatoltMgt.hajlékonyvért_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('csatolt_mgt_nemfém', Object.entries(csatoltMgt.hajlékonyvért_nem_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('struktúrák', konstansok.páncél_struktúrák.map((s: any) => ({
    név: s.struktúra, mgt: s.mgt, sfé_fizikai: s.sfé_fizikai,
    sfé_energia: s.sfé_energia, merev: s.merev ? 1 : 0, fém: s.fém ? 1 : 0
  })));
  lookupArrays.set('fémalapanyagok', konstansok.páncél_fémalapanyagok.map((a: any) => ({ anyag: a.anyag, mgt: a.mgt, sfé_bónusz: a.sfé_bónusz })));
  lookupArrays.set('méret_tábla', [{ név: 'passzol', érték: 0 }, { név: 'nem passzol', érték: 3 }, { név: 'borzalmas', érték: 6 }]);
  lookupArrays.set('merevvért_tábla', konstansok.merevvértviselet_bónuszok.map((b: any) => ({ fok: b.fok, csökkentés: b.TÉ_büntetés_csökkentés })));
  return lookupArrays;
}

/** Fortély módosítók kiszámítása (§16) */
export function calcFortelyMods(
  k: Karakter, session: Session, data: GameData,
  aktívFeltételek: Set<string>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Record<string, number> {
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0, CÉ: 0, harckeret: 0, SFÉ: 0, pengehossz: 0, min_pengehossz: 0 };
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (!feltételTeljesül(mod.feltétel)) continue;
      if (def.session_toggle && (mod.cél === 'TÉ' || mod.cél === 'VÉ') && !(session as unknown as Record<string, unknown>)[kf.név.toLowerCase().replace(/ /g, '_')]) continue;
      if (mod.mód === 'flat') {
        mods[mod.cél] = (mods[mod.cél] ?? 0) + mod.érték;
      } else if (mod.mód === 'scaled' && mod.forrás) {
        const forrásÉrték = k.képzettségek.find(kp => kp.név.toLowerCase() === mod.forrás)?.szint ?? 0;
        mods[mod.cél] = (mods[mod.cél] ?? 0) + Math.floor(forrásÉrték * mod.arány);
      }
    }
  }
  for (const ae of evaluateAlapesetek(data.fortelySummaries as any, k, session, aktívFeltételek)) {
    for (const mod of ae.módosítók) {
      if (mod.mód === 'flat' && mod.cél in mods) {
        mods[mod.cél] = (mods[mod.cél] ?? 0) + mod.érték;
      }
    }
  }
  return mods;
}

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
export function calcKétkezes(
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
  // Apply overrides
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

/** Pajzs és Hárítófegyver VÉ + Fogás összesítő */
export function calcFogás(k: Karakter, session: Session, data: GameData, fortelyMods: Record<string, number>): {
  pajzsVÉ: number;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
} {
  const { konstansok } = data;
  const PAJZS_MÉRET_NÉV: Record<string, string> = { kis: 'Kis Pajzs', közepes: 'Közepes Pajzs', nagy: 'Nagy Pajzs' };
  const pajzsDef = (session.aktív_pajzs || session.fegyverfogás === 'fegyver_pajzs') && k.pajzs.méret
    ? data.pajzsok.find(p => p.Pajzs === PAJZS_MÉRET_NÉV[k.pajzs.méret]) : null;
  const pajzsVÉ = pajzsDef ? parseInt(pajzsDef.VÉ) || 0 : 0;

  let pajzsTÉBüntetés = 0;
  if (session.fegyverfogás === 'fegyver_pajzs' && k.pajzs.méret) {
    const entry = konstansok.pajzs_TÉ_büntetés?.find((e: any) => e.méret === k.pajzs.méret);
    const mérséklés = fortelyMods['pajzs_TÉ_mérséklés'] ?? 0;
    pajzsTÉBüntetés = Math.min(0, (entry?.büntetés ?? 0) + mérséklés);
  }

  let hárítóVÉ = 0;
  let hárítóNév = '';
  const hasHárítóFortély = k.fortélyok.some(f => f.név === 'Hárítófegyver használat');
  if (session.fegyverfogás === 'fegyver_hárító' && session.aktív_fegyver_bal_index >= 0 && hasHárítóFortély) {
    const hFp = k.fegyverek[session.aktív_fegyver_bal_index];
    if (hFp) {
      const hDef = lookupFegyver(data.fegyverek, hFp.alap);
      if (hDef?.Hárító === '1') {
        hárítóVÉ = parseInt(hDef.VÉ) || 0;
        hárítóNév = hFp.alap;
        const hDisplayName = hDef.Alapnév || hDef.Fegyver;
        const hMfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === hDisplayName || f.spec_elem === hFp.alap));
        if (hMfEntry) {
          const hMf = konstansok.mesterfegyver_bónuszok.find((b: any) => b.fok === hMfEntry.fok);
          if (hMf) hárítóVÉ += hMf.VÉ;
        }
      }
    }
  }

  let fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null = null;
  if (session.fegyverfogás === 'fegyver_pajzs' && pajzsVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + Pajzs', VÉ_bónusz: pajzsVÉ, TÉ_büntetés: pajzsTÉBüntetés };
  } else if (session.fegyverfogás === 'fegyver_hárító' && hárítóVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + ' + hárítóNév, VÉ_bónusz: hárítóVÉ, TÉ_büntetés: 0 };
  }

  return { pajzsVÉ, fogásResult };
}

/** Fájdalomtűrés enyhítés lookup */
export function calcFtEnyhítés(képzettségek: { név: string; szint: number }[], ftTable: { szint: number; enyhítés: number }[]): number {
  const ftSzint = képzettségek.find(kp => kp.név === 'Fájdalomtűrés')?.szint ?? 0;
  let enyhítés = 0;
  for (const row of ftTable) {
    if (ftSzint >= row.szint) enyhítés = row.enyhítés;
  }
  return enyhítés;
}
