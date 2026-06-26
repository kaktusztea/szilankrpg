import { useMemo } from 'react';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { evaluate, buildContext, buildArrayContext } from '../engine/reactive';

interface Props {
  data: GameData;
  karakter: Karakter;
}

export function KpBar({ data, karakter }: Props) {
  const kpBar = useMemo(() => {
    const { tulajdonságok, képzettségek, fortélyok } = karakter;
    const spec = karakter.fortélyok_speciális;
    const tsz = karakter.tsz;
    const harcmodorÖsszeg = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])]
      .reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
    const alakzatharcSzint = képzettségek.find(k => k.név === 'Alakzatharc')?.szint ?? 0;
    const kpCtx = buildContext(tulajdonságok, tsz, data.konstansok, {
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
      if (colonIdx > 0) { const base = k.név.slice(0, colonIdx).trim(); if (primerKepNevek.has(base)) primerKepNevek.add(k.név); }
    }
    const ingyenesFortelyok = data.fortelySummaries.filter(d => d.ingyenes_perszint > 0);
    const arrays = buildArrayContext(képzettségek, fortélyok, data.kepzettsegKp, fortelyKpMap, harciFortelyNevek, {
      tsz, ingyenesFortelyok, primerKepNevek,
      primerFortNevek: new Set(data.primerFortelyok),
      szabadFortelyNevek: new Set(data.fortelySummaries.filter(d => d.csoport === 'szabad').map(d => d.név)),
    });
    const kpComputed = evaluate(data.rules, kpCtx, arrays);
    const maradékKp = kpComputed.get('maradék_kp') ?? 0;
    const primerMaradt = kpComputed.get('primer_keret') ?? 0;
    return { maradékKp, primerMaradt };
  }, [data, karakter]);

  return (
    <div className="kp-bar">
      <span className={kpBar.maradékKp < 0 ? 'kp-section-neg' : 'kp-section-ok'}>Maradt KP: {kpBar.maradékKp}</span>
      <span className={kpBar.primerMaradt < 0 ? 'kp-section-neg' : 'kp-section-ok'}>Primer keret: {kpBar.primerMaradt}</span>
    </div>
  );
}
