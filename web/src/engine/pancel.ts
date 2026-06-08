import type { PancelPeldany, PancelStruktura, PancelFemalapanyag } from './types';

export interface CsatoltTagMgt {
  hajlékonyvért_nem_fém: Record<string, number>;
  hajlékonyvért_fém: Record<string, number>;
  merevvért_fém: Record<string, number>;
}

/** Intermediate páncél values for reactive engine context */
export interface PancelContextInputs {
  páncél_struktúra_mgt: number;
  páncél_alapanyag_mgt: number;
  páncél_csatolt_mgt: number;
  páncél_méret_mgt: number;
  páncél_merev: number;
  merevvért_csökkentés: number;
  páncél_struktúra_sfé_fizikai: number;
  páncél_struktúra_sfé_energia: number;
  páncél_alapanyag_sfé_bónusz: number;
  páncél_idea: number;
  páncél_rongálódás: number;
  páncél_lefedettség: number;
}

export function calcPancelInputs(
  páncél: PancelPeldany,
  struktúrák: PancelStruktura[],
  fémalapanyagok: PancelFemalapanyag[],
  csatoltTagMgt: CsatoltTagMgt,
  merevvértvisFok: number,
  merevvértvisBonuszok: { fok: number; TÉ_büntetés_csökkentés: number }[],
): PancelContextInputs {
  const struktúra = struktúrák.find(s => s.struktúra === páncél.alap);
  if (!struktúra) return { páncél_struktúra_mgt: 0, páncél_alapanyag_mgt: 0, páncél_csatolt_mgt: 0, páncél_méret_mgt: 0, páncél_merev: 0, merevvért_csökkentés: 0, páncél_struktúra_sfé_fizikai: 0, páncél_struktúra_sfé_energia: 0, páncél_alapanyag_sfé_bónusz: 0, páncél_idea: 0, páncél_rongálódás: 0, páncél_lefedettség: 50 };

  const alapanyag = fémalapanyagok.find(a => a.anyag === páncél.fémalapanyag);
  const alapanyag_mgt = alapanyag?.mgt ?? 0;
  const sfé_bónusz = alapanyag?.sfé_bónusz ?? 0;

  let tagMgtPerDb: number;
  if (struktúra.merev) {
    tagMgtPerDb = csatoltTagMgt.merevvért_fém[páncél.kidolgozottság] ?? 2;
  } else if (struktúra.fém) {
    tagMgtPerDb = csatoltTagMgt.hajlékonyvért_fém[páncél.kidolgozottság] ?? 1;
  } else {
    tagMgtPerDb = csatoltTagMgt.hajlékonyvért_nem_fém[páncél.kidolgozottság] ?? 0.5;
  }

  const csatoltDb = páncél.végtagvédettség + (páncél.sisak ? 1 : 0);
  const méretMgt: Record<string, number> = { 'passzol': 0, 'nem passzol': 3, 'borzalmas': 6 };

  const csökkentés = merevvértvisBonuszok.find(b => b.fok === merevvértvisFok)?.TÉ_büntetés_csökkentés ?? 0;

  return {
    páncél_struktúra_mgt: struktúra.mgt,
    páncél_alapanyag_mgt: alapanyag_mgt,
    páncél_csatolt_mgt: csatoltDb * tagMgtPerDb,
    páncél_méret_mgt: méretMgt[páncél.méret_illeszkedés] ?? 0,
    páncél_merev: struktúra.merev ? 1 : 0,
    merevvért_csökkentés: csökkentés,
    páncél_struktúra_sfé_fizikai: struktúra.sfé_fizikai,
    páncél_struktúra_sfé_energia: struktúra.sfé_energia,
    páncél_alapanyag_sfé_bónusz: sfé_bónusz,
    páncél_idea: páncél.idea,
    páncél_rongálódás: páncél.rongálódás,
    páncél_lefedettség: 50 + páncél.végtagvédettség * 10 + (páncél.sisak ? 10 : 0),
  };
}
