import type { Karakter, KpConfig, FortelyokSpecialis } from './types';

export interface KpBonusz {
  analfabéta: number;
  apró_méretű_lény: number;
  süketség: number;
  vakság: number;
  tartós_sérülés_per_fok: number;
}

export interface KpResult {
  összes_kp: number;
  összes_szekunder_kp: number;
  spec_kp: number;
  elköltött_kp: number;
  kp_szekunder_költött: number;
  maradék_kp: number;
  primer_limit: number;
  valid: boolean;
  errors: string[];
}

export function calcSpecKp(spec: FortelyokSpecialis, bonusz: KpBonusz): number {
  let kp = 0;
  if (spec.analfabéta) kp += bonusz.analfabéta;
  if (spec.apró_méretű_lény) kp += bonusz.apró_méretű_lény;
  if (spec.süketség) kp += bonusz.süketség;
  if (spec.vakság) kp += bonusz.vakság;
  kp += spec.tartós_sérülés_fok * bonusz.tartós_sérülés_per_fok;
  return kp;
}

export function calcKp(
  karakter: Karakter,
  kpConfig: KpConfig,
  kpBonusz: KpBonusz,
  kepzettsegKpTable: { szint: number; kp: number }[],
  primerKepzettsegek: Set<string>,
  primerFortelyGroups: Set<string>,
  fortelyKpMap?: Map<string, number>,
): KpResult {
  const { tsz, tulajdonságok } = karakter;

  const összes_kp = tsz * (kpConfig.perszint + tulajdonságok.intelligencia);
  const összes_szekunder_kp = tsz * (kpConfig.szekunder_perszint + tulajdonságok.emlékezet);
  const spec_kp = calcSpecKp(karakter.fortélyok_speciális, kpBonusz);

  // Képzettségek KP
  let kp_képzettségek = 0;
  let kp_szekunder_képzettségek = 0;
  for (const k of karakter.képzettségek) {
    const entry = kepzettsegKpTable.find(e => e.szint === k.szint);
    const cost = entry ? entry.kp : 0;
    kp_képzettségek += cost;
    if (!primerKepzettsegek.has(k.név)) {
      kp_szekunder_képzettségek += cost;
    }
  }

  // Fortélyok KP
  let kp_fortélyok = 0;
  let kp_szekunder_fortélyok = 0;
  for (const f of karakter.fortélyok) {
    // Multi-instance fortélyok: "Kultúrkör - elar" → lookup "Kultúrkör"
    const baseName = f.név.includes(' - ') ? f.név.split(' - ')[0] : f.név;
    const perFok = fortelyKpMap?.get(f.név) ?? fortelyKpMap?.get(baseName) ?? kpConfig.fortélyfok;
    const cost = f.fok * perFok;
    if (cost <= 0) continue; // ingyenes vagy KP-t adó fortélyok nem számítanak költésbe
    kp_fortélyok += cost;
    if (!primerFortelyGroups.has(f.név)) {
      kp_szekunder_fortélyok += cost;
    }
  }

  // HM / CM
  const kp_hm = (karakter.HM_TÉ + karakter.HM_VÉ) * kpConfig.hm;
  const kp_cm = karakter.CM * kpConfig.cm;

  const elköltött_kp = kp_képzettségek + kp_fortélyok + kp_hm + kp_cm;
  const kp_szekunder_költött = kp_szekunder_képzettségek + kp_szekunder_fortélyok;
  const primer_limit = összes_kp + spec_kp;
  const maradék_kp = (összes_kp + spec_kp + összes_szekunder_kp) - elköltött_kp;

  const errors: string[] = [];
  if (maradék_kp < 0) errors.push('Nincs elég KP (túlköltés).');
  if ((elköltött_kp - kp_szekunder_költött) > primer_limit) errors.push('Primer költés túllépi a normál KP keretet.');

  return {
    összes_kp,
    összes_szekunder_kp,
    spec_kp,
    elköltött_kp,
    kp_szekunder_költött,
    maradék_kp,
    primer_limit,
    valid: errors.length === 0,
    errors,
  };
}
