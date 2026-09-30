import type { Karakter, Session, FegyverAlap, FegyverMod } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { evaluate, buildContext, filterFegyverRules, type Rule } from '../../engine/reactive';
import { lookupFegyver } from '../../engine/utils';
import { calcKétkezesHarc } from '../../engine/ketkezes';
import { ideaDelta } from './shared';
import type { FegyverResult, FegyverResultMód } from './types';

/** Cached filtered fegyver rules (keyed by rules array reference). */
const _fegyverRulesCache = new WeakMap<Rule[], Rule[]>();
function getFegyverRules(allRules: Rule[]): Rule[] {
  let cached = _fegyverRulesCache.get(allRules);
  if (!cached) {
    cached = filterFegyverRules(allRules);
    _fegyverRulesCache.set(allRules, cached);
  }
  return cached;
}

/**
 * SP override fortély-alapú felülírás (Természetes fegyver → Puszta kéz sebzése, l.
 * `md/fortelyok.harci/termeszetes_fegyver.md`). Ad-hoc speciális eset, mert a generátor
 * `ököl`/`ököl-belharc` aktora a bázisértéket adja, ezt a fortély módosítja tovább.
 */
function calcSpOverride(fegyverNév: string, karakter: Karakter): number | null {
  if (fegyverNév.toLowerCase() !== 'puszta kéz') return null;
  if (!karakter.fortélyok.some(kf => kf.név === 'Természetes fegyver')) return null;
  return 1;
}

/** Fegyver sorok felépítése (karakter fegyverek + puszta kéz + pajzs) */
export function buildFegyverRows(k: Karakter, data: GameData, pajzsFegyverNév: string | null): { név: string; fDef: FegyverAlap; mfFok: number; ideaHatás: { TÉ: number; VÉ: number; SP: number } }[] {
  const NULLA = { TÉ: 0, VÉ: 0, SP: 0 };
  const rows: { név: string; fDef: FegyverAlap; mfFok: number; ideaHatás: { TÉ: number; VÉ: number; SP: number } }[] = [];
  const pusztaKez = lookupFegyver(data.fegyverek, 'puszta kéz');
  if (pusztaKez) rows.push({ név: pusztaKez.név, fDef: pusztaKez, mfFok: 0, ideaHatás: NULLA });
  for (const fp of k.fegyverek) {
    const fDef = lookupFegyver(data.fegyverek, fp.alap);
    if (!fDef) continue;
    const mfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === fDef.név || f.spec_elem === fp.alap));
    // Példány-Idea delta a idea_default-hoz képest (Modell 2, §16); a v2 harcérték a default-ot már tartalmazza.
    const ideaHatás = ideaDelta(fp.idea, fDef.idea_default, data.fegyverIdeaTabla);
    rows.push({ név: fDef.név, fDef, mfFok: mfEntry?.fok ?? 0, ideaHatás });
  }
  if (pajzsFegyverNév) {
    const pajzsDef = lookupFegyver(data.fegyverek, pajzsFegyverNév);
    if (pajzsDef) rows.push({ név: pajzsDef.név, fDef: pajzsDef, mfFok: 0, ideaHatás: NULLA });
  }
  return rows;
}

/** Az elsődleges sebzéstípusú mód (a táblázat/harcérték-fejléc ezt mutatja alapból). */
export function elsődlegesMód(fDef: FegyverAlap): FegyverMod {
  return fDef.módok.find(m => m.sebzéstípus === 'elsődleges') ?? fDef.módok[0];
}

/** Egy mód TÉ/VÉ/SP/harckeret kiszámítása reactive engine-nel, a megosztott baseCtx-en. */
function calcModResult(
  mód: FegyverMod, fDef: FegyverAlap, k: Karakter, data: GameData,
  baseCtx: Map<string, number>, fegyverRules: Rule[], mfFok: number,
): FegyverResultMód {
  const { konstansok, harcmodorBonusz } = data;
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[fDef.kategória] ?? 'Közelharc';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
  const mf = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

  let alapSP = mód.SP;
  const spOvr = calcSpOverride(fDef.név, k);
  if (spOvr !== null) alapSP = spOvr;

  const fCtx = new Map(baseCtx);
  fCtx.set('fegyver_harcmodor_TÉ', hb?.TÉ ?? 0);
  fCtx.set('fegyver_harcmodor_VÉ', hb?.VÉ ?? 0);
  fCtx.set('fegyver_harcmodor_szint', harcmodorSzint);
  fCtx.set('fegyver_alap_TÉ', mód.TÉ);
  fCtx.set('fegyver_alap_VÉ', mód.VÉ);
  fCtx.set('fegyver_alap_SP', alapSP);
  fCtx.set('fegyver_erőbónusz_limit', mód.Erőlimit);
  fCtx.set('fegyver_sebesség', mód.Sebesség ?? 6);
  fCtx.set('fegyver_mf_TÉ', mf.TÉ);
  fCtx.set('fegyver_mf_VÉ', mf.VÉ);
  fCtx.set('fegyver_mf_SP', mf.SP);

  const fComp = evaluate(fegyverRules, fCtx);
  return {
    aktor: mód.aktor, jelleg: mód.jelleg, sebzéstípus: mód.sebzéstípus,
    TÉ: fComp.get('fegyver_TÉ') ?? 0, VÉ: fComp.get('fegyver_VÉ') ?? 0, SP: fComp.get('fegyver_SP') ?? 0,
    Átütés: mód.Átütés,
    támadások: fComp.get('fegyver_támadások') ?? 1, harckeret: fComp.get('fegyver_harckeret') ?? 0,
    sebesség: mód.Sebesség ?? 6, alap_TÉ: mód.TÉ, alap_VÉ: mód.VÉ,
    hk_harcmodor: harcmodorSzint,
    hk_gyorsaság: fCtx.get('tulajdonságok.gyorsaság') ?? 0,
    hk_mgt: fCtx.get('páncél_MGT') ?? 0,
    hk_felszerelés_mgt: fCtx.get('felszerelés_mgt') ?? 0,
    hk_fortély: 0,  // pótolva a hívó oldalon (harckeret fortély-mod nem mód-specifikus)
  };
}

/** Fegyver harcértékek kiszámítása reactive engine-nel - minden módra (Aktoronként). */
export function calcFegyverResults(
  fegyverRows: { fDef: FegyverAlap; mfFok: number; ideaHatás?: { TÉ: number; VÉ: number; SP: number } }[],
  k: Karakter, data: GameData,
  fortelyMods: Record<string, number>,
  merevvértFok: number,
  harcmodorÖsszeg: number,
  lookupArrays: Map<string, Record<string, number | string>[]>,
  stringCtx: Map<string, string>,
  precomputedPáncélMGT?: number,
  precomputedMerevvértBüntetés?: number,
): FegyverResult[] {
  const { konstansok } = data;
  const fegyverRules = getFegyverRules(data.rules);

  const baseCtx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
    HM_TÉ: k.HM_TÉ, HM_VÉ: k.HM_VÉ,
    merevvért_fok: merevvértFok,
    páncél_van: k.páncél.alap ? 1 : 0, páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0, páncél_idea: k.páncél.idea, páncél_rongálódás: k.páncél.rongálódás,
    fegyver_fortély_TÉ: fortelyMods['TÉ'], fegyver_fortély_VÉ: fortelyMods['VÉ'], fegyver_fortély_SP: fortelyMods['SP'],
    fegyver_fortély_harckeret: fortelyMods['harckeret'],
    harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: 0,
  });

  if (precomputedPáncélMGT !== undefined) {
    baseCtx.set('páncél_MGT', precomputedPáncélMGT);
    baseCtx.set('felszerelés_mgt', 0);
    baseCtx.set('merevvért_TÉ_büntetés', precomputedMerevvértBüntetés ?? 0);
  } else {
    const fullComp = evaluate(data.rules, new Map(baseCtx), lookupArrays, stringCtx);
    baseCtx.set('páncél_MGT', fullComp.get('páncél_MGT') ?? 0);
    baseCtx.set('felszerelés_mgt', fullComp.get('felszerelés_mgt') ?? 0);
    baseCtx.set('merevvért_TÉ_büntetés', fullComp.get('merevvért_TÉ_büntetés') ?? 0);
  }

  return fegyverRows.map(({ fDef, mfFok, ideaHatás }) => {
    const módok = fDef.módok.map(m => calcModResult(m, fDef, k, data, baseCtx, fegyverRules, mfFok));
    const ih = ideaHatás ?? { TÉ: 0, VÉ: 0, SP: 0 };
    for (const m of módok) {
      m.hk_fortély = fortelyMods['harckeret'] ?? 0;
      // Példány-Idea delta (Modell 2): a idea_default-tól való eltérés TÉ/VÉ/SP-hatása. Default példány → 0.
      m.TÉ += ih.TÉ; m.VÉ += ih.VÉ; m.SP += ih.SP;
    }
    const elsődleges = módok.find(m => m.sebzéstípus === 'elsődleges') ?? módok[0];
    return { fegyver_név: fDef.név, fegyverhossz: fDef.fegyverhossz, módok, ...elsődleges };
  });
}

/** Fegyver override helyzetek alapján (pl. Belharc: fegyver TÉ/VÉ=0 ha fegyverhossz>0) */
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
        for (const m of r.módok) {
          if (mod.cél === 'fegyver_TÉ' && mod.mód === 'override') m.TÉ -= m.alap_TÉ;
          if (mod.cél === 'fegyver_VÉ' && mod.mód === 'override') m.VÉ -= m.alap_VÉ;
        }
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
  páncélMGT?: number,
  merevvértBüntetés?: number,
): (FegyverResult & { sumFegyverhossz: number }) | null {
  if (!session.kétkezes_harc || session.aktív_fegyver_bal_index < 0) return null;
  const jobbFp = k.fegyverek[session.aktív_fegyver_index];
  const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
  if (!jobbFp || !balFp) return null;
  const result = calcKétkezesHarc({
    jobbFp, balFp, fegyverek: data.fegyverek, karakter: k,
    konstansok: data.konstansok, harcmodorBonusz: data.harcmodorBonusz, fortelyMods,
    fegyverIdeaTabla: data.fegyverIdeaTabla,
    páncélMGT, merevvértBüntetés,
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
