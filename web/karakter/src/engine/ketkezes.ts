import type { FegyverAlap, Karakter } from './types';
import type { KonstansokRaw, GameData } from './data-types';
import type { FegyverResultMód } from '../components/harc/types';
import { ideaDelta } from '../components/harc/shared';

interface KétkezesInput {
  jobbFp: { alap: string; idea: number };
  balFp: { alap: string; idea: number };
  fegyverek: FegyverAlap[];
  karakter: Karakter;
  konstansok: Pick<KonstansokRaw,
    'kétkezes_harc_max_fegyverméret' | 'kétkezes_harc_max_egy_fegyver' | 'kétkezes_harc_fegyverlevonás_osztó' | 'kétkezes_harc_bónuszok'
    | 'mesterfegyver_bónuszok' | 'fegyver_kategória_harcmodor' | 'harcérték_alap'>;
  harcmodorBonusz: { szint: number; TÉ: number; VÉ: number }[];
  fortelyMods: Record<string, number>;
  /** Idea szint→hatás tábla a példány-Idea delta számításához (Modell 2). */
  fegyverIdeaTabla: GameData['fegyverIdeaTabla'];
  páncélMGT?: number;
  merevvértBüntetés?: number;
}

export interface KétkezesResult extends FegyverResultMód {
  fegyver_név: string;
  fegyverhossz: number;
  sumFegyverhossz: number;
  módok: FegyverResultMód[];
}

export function calcKétkezesHarc(input: KétkezesInput): KétkezesResult | null {
  const { jobbFp, balFp, fegyverek, karakter: k, konstansok, harcmodorBonusz, fortelyMods } = input;
  const jobbDef = fegyverek.find(f => f.név.toLowerCase() === jobbFp.alap.toLowerCase());
  const balDef = fegyverek.find(f => f.név.toLowerCase() === balFp.alap.toLowerCase());
  if (!jobbDef || !balDef) return null;

  const jobbFh = jobbDef.fegyverhossz;
  const balFh = balDef.fegyverhossz;
  const sumFh = jobbFh + balFh;
  // Kétkezes limit: (1) egyik fegyver sem lehet nagyobb a per-fegyver maxnál, (2) az összeg sem a max-nál.
  if (jobbFh > konstansok.kétkezes_harc_max_egy_fegyver || balFh > konstansok.kétkezes_harc_max_egy_fegyver) return null;
  if (sumFh > konstansok.kétkezes_harc_max_fegyverméret) return null;

  const khFok = k.fortélyok.find(f => f.név === 'Kétkezes harc')?.fok ?? 0;
  const nagyobb = jobbFh >= balFh ? jobbDef : balDef;
  const kisebb = jobbFh >= balFh ? balDef : jobbDef;
  const nagyobbFp = jobbFh >= balFh ? jobbFp : balFp;
  const kisebbFp = jobbFh >= balFh ? balFp : jobbFp;

  const nagyobbElsődleges = nagyobb.módok.find(m => m.sebzéstípus === 'elsődleges') ?? nagyobb.módok[0];
  const kisebbElsődleges = kisebb.módok.find(m => m.sebzéstípus === 'elsődleges') ?? kisebb.módok[0];
  const jobbElsődleges = jobbFh >= balFh ? nagyobbElsődleges : kisebbElsődleges;

  // Harcmodor: nagyobb fegyveré
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[nagyobb.kategória] ?? 'Közelharc';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);

  // MF
  const mfNagyobb = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === nagyobb.név || f.spec_elem === nagyobbFp.alap))?.fok ?? 0;
  const mfKisebb = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === kisebb.név || f.spec_elem === kisebbFp.alap))?.fok ?? 0;

  const khBónusz = konstansok.kétkezes_harc_bónuszok;
  const khFokEntry = khBónusz?.find(b => b.fok === khFok);
  const khFokBónusz = khFok === 0
    ? (khFokEntry ?? { harckeret: 0, TÉ: 0, VÉ: 0, mindkét_fegyver_értékei: false, mf: 'nincs' })
    : { harckeret: 0, TÉ: 0, VÉ: 0, mindkét_fegyver_értékei: khFokEntry?.mindkét_fegyver_értékei ?? false, mf: khFokEntry?.mf ?? 'nincs' };

  // MF bónuszok
  let mfTÉ = 0, mfVÉ = 0, mfSP = 0;
  if (khFokBónusz.mf === 'mindkettő') {
    const mfN = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfNagyobb) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    const mfK = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfKisebb) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    mfTÉ = mfN.TÉ + mfK.TÉ; mfVÉ = mfN.VÉ + mfK.VÉ; mfSP = mfN.SP + mfK.SP;
  } else if (khFokBónusz.mf === 'nagyobb') {
    const mfN = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfNagyobb) ?? { TÉ: 0, VÉ: 0, SP: 0 };
    mfTÉ = mfN.TÉ; mfVÉ = mfN.VÉ; mfSP = mfN.SP;
  }

  // Harcértékek
  const alapTÉ = nagyobbElsődleges.TÉ + (khFokBónusz.mindkét_fegyver_értékei ? kisebbElsődleges.TÉ : 0);
  const alapVÉ = nagyobbElsődleges.VÉ + (khFokBónusz.mindkét_fegyver_értékei ? kisebbElsődleges.VÉ : 0);

  // Példány-Idea delta (Modell 2): CSAK a beszámító fegyver Ideája hat. A nagyobb TÉ/VÉ mindig
  // számít; a kisebbé csak `mindkét_fegyver_értékei` mellett; az SP-t kizárólag a jobb kéz sebzi.
  const tábla = input.fegyverIdeaTabla;
  const nagyobbIdea = ideaDelta(nagyobbFp.idea, nagyobb.idea_default, tábla);
  const kisebbIdea = ideaDelta(kisebbFp.idea, kisebb.idea_default, tábla);
  const jobbIdea = ideaDelta(jobbFp.idea, jobbDef.idea_default, tábla);
  const ideaTÉ = nagyobbIdea.TÉ + (khFokBónusz.mindkét_fegyver_értékei ? kisebbIdea.TÉ : 0);
  const ideaVÉ = nagyobbIdea.VÉ + (khFokBónusz.mindkét_fegyver_értékei ? kisebbIdea.VÉ : 0);
  const ideaSP = jobbIdea.SP;

  const TÉ = konstansok.harcérték_alap.TÉ + k.tulajdonságok.erő + k.tulajdonságok.ügyesség + k.tulajdonságok.gyorsaság
    + k.HM_TÉ + (hb?.TÉ ?? 0) + alapTÉ + mfTÉ + fortelyMods['TÉ'] + khFokBónusz.TÉ + ideaTÉ - (input.merevvértBüntetés ?? 0);
  const VÉ = konstansok.harcérték_alap.VÉ + k.tulajdonságok.gyorsaság + k.tulajdonságok.ügyesség
    + k.HM_VÉ + (hb?.VÉ ?? 0) + alapVÉ + mfVÉ + fortelyMods['VÉ'] + khFokBónusz.VÉ + ideaVÉ;

  // SP: jobb kéz sebez (elsődleges módja)
  const erőbónusz = Math.min(k.tulajdonságok.erő, jobbElsődleges.Erőlimit);
  const SP = jobbElsődleges.SP + erőbónusz + mfSP + fortelyMods['SP'] + ideaSP;

  // Harckeret
  const fhLevonás = Math.floor(sumFh / konstansok.kétkezes_harc_fegyverlevonás_osztó);
  const mgt = input.páncélMGT ?? 0;
  const hk = Math.max(0, harcmodorSzint + k.tulajdonságok.gyorsaság + fortelyMods['harckeret'] + (khFok === 0 ? (khFokBónusz.harckeret ?? 0) : 0) - mgt - fhLevonás);
  const sebesség = nagyobbElsődleges.Sebesség ?? 6;
  const támadások = 1 + Math.floor(hk / sebesség);

  const módEredmény: FegyverResultMód = {
    aktor: jobbElsődleges.aktor, jelleg: jobbElsődleges.jelleg, sebzéstípus: 'elsődleges',
    TÉ, VÉ, SP, Átütés: jobbElsődleges.Átütés, támadások, harckeret: hk, sebesség,
    alap_TÉ: alapTÉ, alap_VÉ: alapVÉ,
    hk_harcmodor: harcmodorSzint, hk_gyorsaság: k.tulajdonságok.gyorsaság,
    hk_mgt: mgt, hk_felszerelés_mgt: 0, hk_fortély: fortelyMods['harckeret'] ?? 0,
  };

  return {
    fegyver_név: `${nagyobb.név} + ${kisebb.név}`,
    ...módEredmény,
    fegyverhossz: Math.max(jobbFh, balFh),
    sumFegyverhossz: sumFh,
    módok: [módEredmény],
  };
}
