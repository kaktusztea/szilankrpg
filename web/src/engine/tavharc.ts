export interface TavharcSzorzok {
  célpont_mozgás: number;
  lövész_mozgás: number;
  célpont_méret: number;
  észlelhetőség: number;
  szél: number;
}

export function calcTavharcVE(távolság: number, fegyverOsztó: number, szorzók: TavharcSzorzok): number {
  const cella = Math.ceil(távolság / fegyverOsztó);
  const szorzó = szorzók.célpont_mozgás + szorzók.lövész_mozgás + szorzók.célpont_méret
    + szorzók.észlelhetőség + szorzók.szél;

  if (szorzó >= 1) {
    return szorzó * cella;
  } else {
    return cella - Math.abs(szorzó);
  }
}

export function calcTalálatiEsély(CÉ: number, célVÉ: number): number {
  return Math.max(0, Math.min(100, ((21 - (célVÉ - CÉ)) / 20) * 100));
}
