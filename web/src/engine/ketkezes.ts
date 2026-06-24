import type { FegyverAlap, Karakter } from './types';

interface KétkezesInput {
  jobbFp: { alap: string };
  balFp: { alap: string };
  fegyverek: FegyverAlap[];
  karakter: Karakter;
  konstansok: {
    kétkezes_harc_max_pengeméret: number;
    kétkezes_harc_pengelevonás_osztó: number;
    kétkezes_harc_bónuszok: { fok: number; harckeret: number; TÉ: number; VÉ: number; mindkét_fegyver_értékei: boolean; mf: string }[];
    mesterfegyver_bónuszok: { fok: number; TÉ: number; VÉ: number; SP: number }[];
    fegyver_kategória_harcmodor: Record<string, string>;
    harcérték_alap: { TÉ: number; VÉ: number };
  };
  harcmodorBonusz: { szint: number; TÉ: number; VÉ: number }[];
  fortelyMods: Record<string, number>;
}

export interface KétkezesResult {
  fegyver_név: string;
  TÉ: number;
  VÉ: number;
  SP: number;
  támadások: number;
  harckeret: number;
  sebesség: number;
  pengehossz: number;
  sumPengehossz: number;
  sebzésmód: string;
  alap_TÉ: number;
  alap_VÉ: number;
}

export function calcKétkezesHarc(input: KétkezesInput): KétkezesResult | null {
  const { jobbFp, balFp, fegyverek, karakter: k, konstansok, harcmodorBonusz, fortelyMods } = input;
  const jobbDef = fegyverek.find(f => f.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase());
  const balDef = fegyverek.find(f => f.Fegyver.toLowerCase() === balFp.alap.toLowerCase());
  if (!jobbDef || !balDef) return null;

  const jobbPenge = parseFloat(jobbDef.Pengehossz) || 0;
  const balPenge = parseFloat(balDef.Pengehossz) || 0;
  const sumPenge = jobbPenge + balPenge;
  if (sumPenge > konstansok.kétkezes_harc_max_pengeméret) return null;

  const khFok = k.fortélyok.find(f => f.név === 'Kétkezes harc')?.fok ?? 0;
  const nagyobb = jobbPenge >= balPenge ? jobbDef : balDef;
  const kisebb = jobbPenge >= balPenge ? balDef : jobbDef;
  const nagyobbFp = jobbPenge >= balPenge ? jobbFp : balFp;
  const kisebbFp = jobbPenge >= balPenge ? balFp : jobbFp;

  // Harcmodor: nagyobb fegyveré
  const harcmodorNév = konstansok.fegyver_kategória_harcmodor[nagyobb.Kategória] ?? 'Közelharc';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);

  // MF
  const nagyobbNév = nagyobb.Alapnév || nagyobb.Fegyver;
  const kisebbNév = kisebb.Alapnév || kisebb.Fegyver;
  const mfNagyobb = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === nagyobbNév || f.spec_elem === nagyobbFp.alap))?.fok ?? 0;
  const mfKisebb = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === kisebbNév || f.spec_elem === kisebbFp.alap))?.fok ?? 0;

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
  const alapTÉ = (parseInt(nagyobb.TÉ) || 0) + (khFokBónusz.mindkét_fegyver_értékei ? (parseInt(kisebb.TÉ) || 0) : 0);
  const alapVÉ = (parseInt(nagyobb.VÉ) || 0) + (khFokBónusz.mindkét_fegyver_értékei ? (parseInt(kisebb.VÉ) || 0) : 0);
  const TÉ = konstansok.harcérték_alap.TÉ + k.tulajdonságok.erő + k.tulajdonságok.ügyesség + k.tulajdonságok.gyorsaság
    + k.HM_TÉ + (hb?.TÉ ?? 0) + alapTÉ + mfTÉ + fortelyMods['TÉ'] + khFokBónusz.TÉ;
  const VÉ = konstansok.harcérték_alap.VÉ + k.tulajdonságok.gyorsaság + k.tulajdonságok.ügyesség
    + k.HM_VÉ + (hb?.VÉ ?? 0) + alapVÉ + mfVÉ + fortelyMods['VÉ'] + khFokBónusz.VÉ;

  // SP: jobb kéz sebez
  const erőbónusz = Math.min(k.tulajdonságok.erő, jobbDef['Erőbónusz limit'] !== '' ? parseInt(jobbDef['Erőbónusz limit']) : 99);
  const SP = (parseInt(jobbDef.SP) || 0) + erőbónusz + mfSP + fortelyMods['SP'];

  // Harckeret
  const pengelevonás = Math.floor(sumPenge / konstansok.kétkezes_harc_pengelevonás_osztó);
  const hk = Math.max(0, harcmodorSzint + k.tulajdonságok.gyorsaság + fortelyMods['harckeret'] + (khFok === 0 ? (khFokBónusz.harckeret ?? 0) : 0) - pengelevonás);
  const sebesség = parseInt(nagyobb.Sebesség) || 6;
  const támadások = 1 + Math.floor(hk / sebesség);

  return {
    fegyver_név: `${nagyobb.Alapnév || nagyobb.Fegyver} + ${kisebb.Alapnév || kisebb.Fegyver}`,
    TÉ, VÉ, SP, támadások, harckeret: hk, sebesség,
    pengehossz: Math.max(jobbPenge, balPenge),
    sumPengehossz: sumPenge,
    sebzésmód: jobbDef['Sebzés módja'],
    alap_TÉ: alapTÉ,
    alap_VÉ: alapVÉ,
  };
}
