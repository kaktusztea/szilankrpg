import type { Tulajdonsagok, FegyverAlap, HarcertekAlap, MesterfegyverBonusz, FegyverHarcertekek } from './types';

export function calcFegyverHarcertekek(
  tul: Tulajdonsagok,
  hmTÉ: number,
  hmVÉ: number,
  harcmodorSzint: number,
  harcmodorBonusz: { TÉ: number; VÉ: number },
  fegyver: FegyverAlap,
  mfFok: number,
  mfBonuszok: MesterfegyverBonusz[],
  alap: HarcertekAlap,
  fortelyTÉ: number,
  fortelyVÉ: number,
  fortélySP: number,
  fortelyHarckeret: number,
  páncélMGT: number,
  felszerelésMGT: number,
): FegyverHarcertekek {
  const mf = mfBonuszok.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

  const TÉ = alap.TÉ + tul.erő + tul.ügyesség + tul.gyorsaság + hmTÉ
    + harcmodorBonusz.TÉ + parseInt(fegyver.TÉ) + mf.TÉ + fortelyTÉ;

  const VÉ = alap.VÉ + tul.gyorsaság + tul.ügyesség + hmVÉ
    + harcmodorBonusz.VÉ + parseInt(fegyver.VÉ) + mf.VÉ + fortelyVÉ;

  const erőbónuszLimit = parseInt(fegyver['Erőbónusz limit']) || 99;
  const erőbónusz = Math.min(tul.erő, erőbónuszLimit);
  const SP = parseInt(fegyver.SP) + erőbónusz + mf.SP + fortélySP;

  const sebesség = parseInt(fegyver.Sebesség) || 6;
  const harckeret = Math.max(0, harcmodorSzint + tul.gyorsaság - páncélMGT - felszerelésMGT + fortelyHarckeret);
  const támadások = 1 + Math.floor(harckeret / sebesség);

  return {
    fegyver_név: fegyver.Fegyver,
    TÉ,
    VÉ,
    CÉ: 0,
    SP,
    támadások,
    pengehossz: parseFloat(fegyver.Pengehossz) || 0,
    sebzésmód: fegyver['Sebzés módja'],
  };
}
