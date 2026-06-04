export interface EpResult {
  ÉP: number;
  S1_max: number;
  S2_max: number;
  S3_max: number;
  S4_max: number;
}

export function calcEp(edzettség: number): EpResult {
  const ÉP = 28 + edzettség * 4;
  return {
    ÉP,
    S1_max: ÉP / 4,
    S2_max: ÉP / 2,
    S3_max: (ÉP * 3) / 4,
    S4_max: ÉP,
  };
}
