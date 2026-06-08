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
  páncél_csatolt_db: number;
  páncél_méret_mgt: number;
  páncél_merev: number;
  páncél_fém: number;
  merevvért_csökkentés: number;
  páncél_struktúra_sfé_fizikai: number;
  páncél_struktúra_sfé_energia: number;
  páncél_alapanyag_sfé_bónusz: number;
  páncél_idea: number;
  páncél_rongálódás: number;
  páncél_lefedettség: number;
}

/** String context values for reactive engine (string-keyed lookups) */
export interface PancelStringInputs {
  páncél_kidolgozottság: string;
}

export function calcPancelInputs(
  páncél: PancelPeldany,
  struktúrák: PancelStruktura[],
  fémalapanyagok: PancelFemalapanyag[],
  merevvértvisFok: number,
  merevvértvisBonuszok: { fok: number; TÉ_büntetés_csökkentés: number }[],
): { numeric: PancelContextInputs; strings: PancelStringInputs } {
  const struktúra = struktúrák.find(s => s.struktúra === páncél.alap);
  if (!struktúra) return {
    numeric: { páncél_struktúra_mgt: 0, páncél_alapanyag_mgt: 0, páncél_csatolt_db: 0, páncél_méret_mgt: 0, páncél_merev: 0, páncél_fém: 0, merevvért_csökkentés: 0, páncél_struktúra_sfé_fizikai: 0, páncél_struktúra_sfé_energia: 0, páncél_alapanyag_sfé_bónusz: 0, páncél_idea: 0, páncél_rongálódás: 0, páncél_lefedettség: 0 },
    strings: { páncél_kidolgozottság: '' },
  };

  const alapanyag = fémalapanyagok.find(a => a.anyag === páncél.fémalapanyag);
  const méretMgt: Record<string, number> = { 'passzol': 0, 'nem passzol': 3, 'borzalmas': 6 };
  const csökkentés = merevvértvisBonuszok.find(b => b.fok === merevvértvisFok)?.TÉ_büntetés_csökkentés ?? 0;

  return {
    numeric: {
      páncél_struktúra_mgt: struktúra.mgt,
      páncél_alapanyag_mgt: alapanyag?.mgt ?? 0,
      páncél_csatolt_db: páncél.végtagvédettség + (páncél.sisak ? 1 : 0),
      páncél_méret_mgt: méretMgt[páncél.méret_illeszkedés] ?? 0,
      páncél_merev: struktúra.merev ? 1 : 0,
      páncél_fém: struktúra.fém ? 1 : 0,
      merevvért_csökkentés: csökkentés,
      páncél_struktúra_sfé_fizikai: struktúra.sfé_fizikai,
      páncél_struktúra_sfé_energia: struktúra.sfé_energia,
      páncél_alapanyag_sfé_bónusz: alapanyag?.sfé_bónusz ?? 0,
      páncél_idea: páncél.idea,
      páncél_rongálódás: páncél.rongálódás,
      páncél_lefedettség: 50 + páncél.végtagvédettség * 10 + (páncél.sisak ? 10 : 0),
    },
    strings: {
      páncél_kidolgozottság: páncél.kidolgozottság,
    },
  };
}
