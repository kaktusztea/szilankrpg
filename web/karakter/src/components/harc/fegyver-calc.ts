import type { Karakter, Session, FegyverAlap, FegyverMod } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { evaluate, buildContext, filterFegyverRules, type Rule } from '../../engine/reactive';
import { lookupFegyver } from '../../engine/utils';
import { képzettségSzint } from '../../engine/azonosito';
import { findMfFok } from '../../engine/mf-utils';
import { calcKétkezesHarc } from '../../engine/ketkezes';
import { ideaDelta } from './shared';
import { tiltásokFegyverre, fegyverOverrideÉrtékek } from '../../engine/effekt';
import { alkalmazEffektek } from './extrak-effekt';
import type { ExtraHatás } from '../../engine/data-types';
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
 * `md/fortelyok.harci/termeszetes_fegyver.md`). Ad-hoc speciális eset, mert a generátor `ököl` aktora a
 * bázisértéket adja, ezt a fortély módosítja tovább. Elsőbbsége van a helyzet/extra alap-override-dal szemben
 * (Belharc: SP 0, de Természetes fegyverrel 1 - 2026-10-16 döntés).
 */
function calcSpOverride(fegyverNév: string, karakter: Karakter): number | null {
  if (fegyverNév.toLowerCase() !== 'puszta kéz') return null;
  if (!karakter.fortélyok.some(kf => kf.id === 'természetes_fegyver')) return null;
  return 1;
}

/** Fegyver sorok felépítése (karakter fegyverek + puszta kéz + pajzs) */
export function buildFegyverRows(k: Karakter, data: GameData, pajzsFegyverNév: string | null): { név: string; becenév?: string; fDef: FegyverAlap; mfFok: number; ideaHatás: { TÉ: number; VÉ: number; SP: number } }[] {
  const NULLA = { TÉ: 0, VÉ: 0, SP: 0 };
  const rows: { név: string; becenév?: string; fDef: FegyverAlap; mfFok: number; ideaHatás: { TÉ: number; VÉ: number; SP: number } }[] = [];
  const pusztaKez = lookupFegyver(data.fegyverek, 'puszta kéz');
  if (pusztaKez) rows.push({ név: pusztaKez.név, fDef: pusztaKez, mfFok: 0, ideaHatás: NULLA });
  for (const fp of k.fegyverek) {
    const fDef = lookupFegyver(data.fegyverek, fp.alap);
    if (!fDef) continue;
    // Mesterfegyver fok: kis/nagybetű-FÜGGETLEN egyeztetés (findMfFok → toLowerCase), hogy a karakter
    // `alap` és a fortély `spec_elem` eltérő betűzése se veszítse el a bónuszt.
    const mfFok = findMfFok(k, data.fegyverek, fp.alap);
    // Példány-Idea delta a idea_default-hoz képest (Modell 2, §16); a v2 harcérték a default-ot már tartalmazza.
    const ideaHatás = ideaDelta(fp.idea, fDef.idea_default, data.fegyverIdeaTabla);
    // Példány-becenév (fp.név): a megjelenítésben felülírja a fegyver-def nevét (lookup/egyeztetés marad fDef.név).
    rows.push({ név: fDef.név, becenév: fp.név || undefined, fDef, mfFok, ideaHatás });
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
  alapOvr?: Map<string, number>,
): FegyverResultMód {
  const { konstansok, harcmodorBonusz } = data;
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[fDef.kategória] ?? 'közelharc';
  const harcmodorSzint = képzettségSzint(k.képzettségek, `harcmodor/${harcmodorNév}`);
  const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
  const mf = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

  // §42.3 bázis-csere (helyzet / extra, alcél felszerelés:fegyver), a fortély SP-override utána felülírhatja.
  const alapTÉ = alapOvr?.get('TÉ') ?? mód.TÉ;
  const alapVÉ = alapOvr?.get('VÉ') ?? mód.VÉ;
  let alapSP = alapOvr?.get('SP') ?? mód.SP;
  const spOvr = calcSpOverride(fDef.név, k);
  if (spOvr !== null) alapSP = spOvr;

  const fCtx = new Map(baseCtx);
  fCtx.set('fegyver_harcmodor_TÉ', hb?.TÉ ?? 0);
  fCtx.set('fegyver_harcmodor_VÉ', hb?.VÉ ?? 0);
  fCtx.set('fegyver_harcmodor_szint', harcmodorSzint);
  fCtx.set('fegyver_alap_TÉ', alapTÉ);
  fCtx.set('fegyver_alap_VÉ', alapVÉ);
  fCtx.set('fegyver_alap_SP', alapSP);
  fCtx.set('fegyver_erőbónusz_limit', mód.Erőlimit);
  fCtx.set('fegyver_sebesség', mód.Sebesség ?? 6);
  fCtx.set('fegyver_mf_TÉ', mf.TÉ);
  fCtx.set('fegyver_mf_VÉ', mf.VÉ);
  fCtx.set('fegyver_mf_SP', mf.SP);

  const fComp = evaluate(fegyverRules, fCtx);
  return {
    aktor: mód.aktor, jelleg: mód.jelleg, sebzéstípus: mód.sebzéstípus, Forgatás: mód.Forgatás,
    TÉ: fComp.get('fegyver_TÉ') ?? 0, VÉ: fComp.get('fegyver_VÉ') ?? 0, SP: fComp.get('fegyver_SP') ?? 0,
    Átütés: mód.Átütés,
    támadások: fComp.get('fegyver_támadások') ?? 1, harckeret: fComp.get('fegyver_harckeret') ?? 0,
    sebesség: mód.Sebesség ?? 6, alap_TÉ: alapTÉ, alap_VÉ: alapVÉ,
    mf_TÉ: mf.TÉ, mf_VÉ: mf.VÉ,
    // A rules.json fegyver_SP erőbónusz-tagja (ugyanazokból a ctx-értékekből) - csak a bontás-felirathoz.
    sp_erőbónusz: Math.floor(Math.min(fCtx.get('tulajdonságok.erő') ?? 0, mód.Erőlimit) * (1 + (fCtx.get('fegyver_fortély_SP_erőbónusz_arány') ?? 0))),
    sp_mf: mf.SP,
    hk_harcmodor: harcmodorSzint,
    hk_gyorsaság: fCtx.get('tulajdonságok.gyorsaság') ?? 0,
    hk_mgt: fCtx.get('páncél_MGT') ?? 0,
    hk_fortély: 0,  // pótolva a hívó oldalon (harckeret fortély-mod nem mód-specifikus)
  };
}

/** Fegyver harcértékek kiszámítása reactive engine-nel - minden módra (Aktoronként). */
export function calcFegyverResults(
  fegyverRows: { fDef: FegyverAlap; mfFok: number; ideaHatás?: { TÉ: number; VÉ: number; SP: number }; becenév?: string }[],
  k: Karakter, data: GameData,
  fortelyMods: Record<string, number>,
  merevvértFok: number,
  harcmodorÖsszeg: number,
  lookupArrays: Map<string, Record<string, number | string>[]>,
  stringCtx: Map<string, string>,
  precomputedPáncélMGT?: number,
  precomputedMerevvértBüntetés?: number,
  /** Fegyverenkénti alapérték-csere (helyzet fegyver_override + extrák, §42.3/§42.4) - pl. fegyverOverrideÉrtékek. */
  alapOverride?: (fDef: FegyverAlap) => Map<string, number>,
  /** Fegyverenkénti fortély-módosítók (a sor saját fegyver-feltételeivel); hiányában a globális `fortelyMods`. */
  fortélyModsSorra?: (fDef: FegyverAlap) => Record<string, number>,
  /** Fegyverenkénti fegyver-járulék (alap+MF+Idea) szorzó/override hatások célonként (Beszorítva, §065_03_03). */
  járulékHatásSorra?: (fDef: FegyverAlap) => Map<string, ExtraHatás[]>,
): FegyverResult[] {
  const { konstansok } = data;
  const fegyverRules = getFegyverRules(data.rules);

  const baseCtx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
    HM_TÉ: k.HM_TÉ, HM_VÉ: k.HM_VÉ,
    merevvért_fok: merevvértFok,
    páncél_van: k.páncél.alap ? 1 : 0, páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0, páncél_idea: k.páncél.idea, páncél_rongálódás: k.páncél.rongálódás,
    fegyver_fortély_TÉ: fortelyMods['TÉ'], fegyver_fortély_VÉ: fortelyMods['VÉ'], fegyver_fortély_SP: fortelyMods['SP'],
    fegyver_fortély_SP_erőbónusz_arány: fortelyMods['SP_erőbónusz_arány'] ?? 0,
    fegyver_fortély_harckeret: fortelyMods['harckeret'],
    harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: 0,
  });

  if (precomputedPáncélMGT !== undefined) {
    baseCtx.set('páncél_MGT', precomputedPáncélMGT);
    baseCtx.set('merevvért_TÉ_büntetés', precomputedMerevvértBüntetés ?? 0);
  } else {
    const fullComp = evaluate(data.rules, new Map(baseCtx), lookupArrays, stringCtx);
    baseCtx.set('páncél_MGT', fullComp.get('páncél_MGT') ?? 0);
    baseCtx.set('merevvért_TÉ_büntetés', fullComp.get('merevvért_TÉ_büntetés') ?? 0);
  }

  return fegyverRows.map(({ fDef, mfFok, ideaHatás, becenév }) => {
    const ovr = alapOverride?.(fDef);
    const fm = fortélyModsSorra?.(fDef) ?? fortelyMods;
    const sorCtx = new Map(baseCtx);
    sorCtx.set('fegyver_fortély_TÉ', fm['TÉ'] ?? 0); sorCtx.set('fegyver_fortély_VÉ', fm['VÉ'] ?? 0); sorCtx.set('fegyver_fortély_SP', fm['SP'] ?? 0);
    sorCtx.set('fegyver_fortély_SP_erőbónusz_arány', fm['SP_erőbónusz_arány'] ?? 0);
    sorCtx.set('fegyver_fortély_harckeret', fm['harckeret'] ?? 0);
    const módok = fDef.módok.map(m => calcModResult(m, fDef, k, data, sorCtx, fegyverRules, mfFok, ovr));
    const ih = ideaHatás ?? { TÉ: 0, VÉ: 0, SP: 0 };
    const járulék = járulékHatásSorra?.(fDef);
    for (const m of módok) {
      m.hk_fortély = fm['harckeret'] ?? 0;
      // Példány-Idea delta (Modell 2): a idea_default-tól való eltérés TÉ/VÉ/SP-hatása. Default példány → 0.
      m.TÉ += ih.TÉ; m.VÉ += ih.VÉ; m.SP += ih.SP;
      // Fegyver-járulék post-szorzó (Beszorítva, md/065_03_03): a fegyver TÁRGY-járuléka (alap hossz-járulék
      // + Mesterfegyver + Idea) feleződik/nullázódik; a karakter-rész (bázis + tulajdonság + HM + harcmodor-szint
      // + harci fortélyok) érintetlen. FLOOR (§42.3). A járulékot kivonjuk, módosítjuk, visszaadjuk.
      if (járulék?.size) {
        for (const [cél, mező, ideaTag] of [['TÉ', 'mf_TÉ', ih.TÉ], ['VÉ', 'mf_VÉ', ih.VÉ]] as const) {
          const hatások = járulék.get(cél);
          if (!hatások?.length) continue;
          const rész = (cél === 'TÉ' ? m.alap_TÉ : m.alap_VÉ) + (m[mező] as number) + ideaTag;
          const mód = m as unknown as Record<string, number>;
          mód[cél] = m[cél] - rész + alkalmazEffektek(rész, hatások);
        }
      }
    }
    const elsődleges = módok.find(m => m.sebzéstípus === 'elsődleges') ?? módok[0];
    return { fegyver_név: fDef.név, becenév, fegyverhossz: fDef.fegyverhossz, módok, ...elsődleges, fortély: fm };
  });
}

/**
 * Fegyversoronkénti aktív tiltások jelölése (§42.4; pl. Belharc: túl hosszú / nem Közelharc) - a fegyvertábla ⚠
 * jelzéséhez. Az ÉRTÉKEK alapérték-cseréje a calcFegyverResults `alapOverride`-jában történik (fegyverOverrideÉrtékek).
 */
export function jelölFegyverTiltások(
  results: FegyverResult[], session: Session, data: GameData, aktívFeltételek: Set<string>,
) {
  for (const r of results) {
    const fDef = lookupFegyver(data.fegyverek, r.fegyver_név);
    r.tiltások = fDef ? tiltásokFegyverre(fDef, session, data, aktívFeltételek).map(t => t.id) : [];
  }
}

/** Kétkezes harc + override */
export function calcKetkezes(
  k: Karakter, session: Session, data: GameData,
  fortelyMods: Record<string, number>,
  aktívFeltételek: Set<string>,
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
    // Kezenkénti override (pl. Belharc): mindkét fegyver a SAJÁT hossza / extrái szerint (§42.4).
    alapOverride: fDef => fegyverOverrideÉrtékek(fDef, session, data, aktívFeltételek),
  });
  if (!result) return null;
  return result;
}
