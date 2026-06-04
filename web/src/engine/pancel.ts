import type { PancelPeldany, PancelStruktura, PancelFemalapanyag, PancelErtekek } from './types';

export interface CsatoltTagMgt {
  hajlékonyvért_nem_fém: Record<string, number>;
  hajlékonyvért_fém: Record<string, number>;
  merevvért_fém: Record<string, number>;
}

export function calcPancel(
  páncél: PancelPeldany,
  struktúrák: PancelStruktura[],
  fémalapanyagok: PancelFemalapanyag[],
  csatoltTagMgt: CsatoltTagMgt,
  merevvértvisFok: number,
  merevvértvisBonuszok: { fok: number; TÉ_büntetés_csökkentés: number }[],
  erő: number,
): PancelErtekek {
  const struktúra = struktúrák.find(s => s.struktúra === páncél.alap);
  if (!struktúra) return { sfé_fizikai: 0, sfé_energia: 0, MGT: 0, merevvért_TÉ_büntetés: 0, lefedettség: 50 };

  const alapanyag = fémalapanyagok.find(a => a.anyag === páncél.fémalapanyag);
  const sfé_bónusz = alapanyag?.sfé_bónusz ?? 0;
  const alapanyag_mgt = alapanyag?.mgt ?? 0;

  // SFÉ
  const sfé_fizikai = struktúra.sfé_fizikai + sfé_bónusz + páncél.idea - páncél.rongálódás;
  const sfé_energia = struktúra.sfé_energia + sfé_bónusz + páncél.idea - páncél.rongálódás;

  // MGT
  let tagMgtPerDb: number;
  if (struktúra.merev) {
    tagMgtPerDb = csatoltTagMgt.merevvért_fém[páncél.kidolgozottság] ?? 2;
  } else if (struktúra.fém) {
    tagMgtPerDb = csatoltTagMgt.hajlékonyvért_fém[páncél.kidolgozottság] ?? 1;
  } else {
    tagMgtPerDb = csatoltTagMgt.hajlékonyvért_nem_fém[páncél.kidolgozottság] ?? 0.5;
  }

  const csatoltDb = páncél.végtagvédettség + (páncél.sisak ? 1 : 0);
  const csatoltMgt = csatoltDb * tagMgtPerDb;

  const méretMgt: Record<string, number> = { passzoló: 0, közepesen_más: 3, nagyon_más: 6 };
  const méret = méretMgt[páncél.méret_illeszkedés] ?? 0;

  const MGT = Math.max(0, struktúra.mgt + alapanyag_mgt + csatoltMgt + méret - erő);

  // Merevvért TÉ büntetés
  let merevvért_TÉ_büntetés = 0;
  if (struktúra.merev) {
    const csökkentés = merevvértvisBonuszok.find(b => b.fok === merevvértvisFok)?.TÉ_büntetés_csökkentés ?? 0;
    merevvért_TÉ_büntetés = Math.max(0, MGT - csökkentés);
  }

  // Lefedettség
  const lefedettség = 50 + páncél.végtagvédettség * 10 + (páncél.sisak ? 10 : 0);

  return { sfé_fizikai, sfé_energia, MGT, merevvért_TÉ_büntetés, lefedettség };
}
