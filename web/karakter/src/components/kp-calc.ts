import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { evaluate, buildContext, buildArrayContext } from '../engine/reactive';

export interface KpDetails {
  maradékKp: number;
  primerMaradt: number;
  összesKp: number;
  szekunderKp: number;
  specKp: number;
  kpKépzettségek: number;
  kpFortélyok: number;
  kpHm: number;
  kpCm: number;
  kiemeltKp: number;
  elköltöttKp: number;
  primerKöltés: number;
  primerKeret: number;
}

/** Compute all KP breakdown values from karakter + gameData. */
export function calcKpDetails(data: GameData, karakter: Karakter): KpDetails {
  const { tulajdonságok, képzettségek, fortélyok } = karakter;
  const spec = karakter.fortélyok_speciális;
  const tsz = karakter.tsz;

  const harcmodorÖsszeg = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])]
    .reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
  const alakzatharcSzint = képzettségek.find(k => k.név === 'Alakzatharc')?.szint ?? 0;

  const ctx = buildContext(tulajdonságok, tsz, data.konstansok, {
    spec_tartós_sérülés_fok: spec.tartós_sérülés_fok,
    HM_TÉ: karakter.HM_TÉ, HM_VÉ: karakter.HM_VÉ, CM: karakter.CM,
    harcmodor_összeg: harcmodorÖsszeg, alakzatharc_szint: alakzatharcSzint,
    felszerelés_terhelés: 0, páncél_van: 0, páncél_végtagvédettség: 0,
    páncél_sisak: 0, páncél_idea: 0, páncél_rongálódás: 0, merevvért_fok: 0,
  });

  const fortelyKpMap = new Map(data.fortelySummaries.map(d => [d.név, d.ingyenes_perszint > 0 ? 0 : d.kp_perfok]));
  const harciFortelyNevek = new Set(data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név));

  const primerKepNevek = new Set(data.kepzettsegDefs.filter(d => d.primer).map(d => d.név));
  const harcmodorDef = data.kepzettsegDefs.find(d => d.név === 'Harcmodor');
  if (harcmodorDef?.többszörös) for (const a of harcmodorDef.többszörös) primerKepNevek.add(a);
  const távHarcmodorDef = data.kepzettsegDefs.find(d => d.név === 'Távolsági harcmodor');
  if (távHarcmodorDef?.többszörös) for (const a of távHarcmodorDef.többszörös) primerKepNevek.add(a);
  for (const k of képzettségek) {
    const colonIdx = k.név.indexOf(':');
    if (colonIdx > 0) {
      const base = k.név.slice(0, colonIdx).trim();
      if (primerKepNevek.has(base)) primerKepNevek.add(k.név);
    }
  }

  const ingyenesFortelyok = data.fortelySummaries.filter(d => d.ingyenes_perszint > 0);
  const arrays = buildArrayContext(képzettségek, fortélyok, data.kepzettsegKp, fortelyKpMap, harciFortelyNevek, {
    tsz,
    ingyenesFortelyok,
    primerKepNevek,
    primerFortNevek: new Set(data.primerFortelyok),
    szabadFortelyNevek: new Set(data.fortelySummaries.filter(d => d.csoport === 'szabad').map(d => d.név)),
  });

  const computed = evaluate(data.rules, ctx, arrays);

  return {
    maradékKp: computed.get('maradék_kp') ?? 0,
    primerMaradt: computed.get('primer_keret') ?? 0,
    összesKp: computed.get('összes_kp') ?? 0,
    szekunderKp: computed.get('összes_szekunder_kp') ?? 0,
    specKp: computed.get('spec_kp') ?? 0,
    kpKépzettségek: computed.get('kp_képzettségek') ?? 0,
    kpFortélyok: computed.get('kp_fortélyok') ?? 0,
    kpHm: computed.get('kp_hm') ?? 0,
    kpCm: computed.get('kp_cm') ?? 0,
    kiemeltKp: computed.get('kiemelt_kp') ?? 0,
    elköltöttKp: computed.get('elköltött_kp') ?? 0,
    primerKöltés: computed.get('primer_költés') ?? 0,
    primerKeret: (computed.get('összes_kp') ?? 0) + (computed.get('spec_kp') ?? 0),
  };
}
