import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';

export function PrimerKpBox({ data, karakter, képzettségek }: {
  data: GameData;
  karakter: Karakter;
  képzettségek: { név: string; szint: number }[];
}) {
  const konstansok = data.konstansok;
  const kpTábla = data.kepzettsegKp;
  const kpCost = (szint: number) => kpTábla.filter(r => r.szint <= szint).reduce((s, r) => s + r.kp, 0);
  const harcmodorNevek = [...konstansok.harcmodorok.közelharci, ...konstansok.harcmodorok.távolsági];
  const misztikusNevek = data.kepzettsegDefs.filter((k: any) => k.csoport === 'misztikus').map((k: any) => k.név.toLowerCase());
  const isMisztikus = (név: string) => {
    const lower = név.toLowerCase();
    return misztikusNevek.some(m => lower === m || lower.startsWith(m + ':'));
  };
  const primerKepzNevek = new Set(data.kepzettsegDefs.filter((k: any) => k.primer).map((k: any) => k.név.toLowerCase()));
  for (const nm of harcmodorNevek) primerKepzNevek.add(nm);

  let kp_hm_cm = (karakter.HM_TÉ + karakter.HM_VÉ) * konstansok.kp.hm + karakter.CM * konstansok.kp.cm;
  let kp_harcmodor = 0, kp_misztikus = 0, kp_világi = 0;
  const harcmodorDetails: { név: string; szint: number; kp: number }[] = [];
  const misztikusDetails: { név: string; szint: number; kp: number }[] = [];
  const világiDetails: { név: string; szint: number; kp: number }[] = [];
  for (const kp of képzettségek) {
    if (kp.szint <= 0) continue;
    const cost = kpCost(kp.szint);
    if (harcmodorNevek.includes(kp.név.toLowerCase())) { kp_harcmodor += cost; harcmodorDetails.push({ név: kp.név, szint: kp.szint, kp: cost }); }
    else if (isMisztikus(kp.név)) { kp_misztikus += cost; misztikusDetails.push({ név: kp.név, szint: kp.szint, kp: cost }); }
    else if (!primerKepzNevek.has(kp.név.toLowerCase())) continue;
    else { kp_világi += cost; világiDetails.push({ név: kp.név, szint: kp.szint, kp: cost }); }
  }
  let kp_harci_fort = 0, kp_miszt_fort = 0;
  const harcifortDetails: { név: string; fok: number; kp: number; spec: string }[] = [];
  const misztfortDetails: { név: string; fok: number; kp: number; spec: string }[] = [];
  for (const f of karakter.fortélyok) {
    if (!data.primerFortelyok.includes(f.név)) continue;
    const def = data.fortelySummaries.find(d => d.név === f.név);
    if (!def || def.kp_perfok === 0) continue;
    const cost = f.fok * def.kp_perfok;
    if (def.csoport === 'harci' || def.csoport === 'távharc') { kp_harci_fort += cost; harcifortDetails.push({ név: f.név, fok: f.fok, kp: cost, spec: f.spec_elem || '' }); }
    else if (def.csoport === 'misztikus') { kp_miszt_fort += cost; misztfortDetails.push({ név: f.név, fok: f.fok, kp: cost, spec: f.spec_elem || '' }); }
  }
  const total = kp_hm_cm + kp_harcmodor + kp_misztikus + kp_világi + kp_harci_fort + kp_miszt_fort;
  const pct = (v: number) => total > 0 ? Math.round(v / total * 100) : 0;
  const row = (label: string, val: number) => <div>{label}: {val} KP ({pct(val)}%)</div>;

  return (
    <div style={{ marginTop: '16px', padding: '10px', border: '1px dashed #666', borderRadius: '6px', fontSize: '12px', color: '#aaa' }}>
      <strong style={{ color: '#e53935' }}>Primer KP bontás</strong>
      {row('HM + CM', kp_hm_cm)}
      {row('Harcmodor képzettségek', kp_harcmodor)}
      {harcmodorDetails.map(d => <div key={d.név} style={{ paddingLeft: '10px' }}>· {d.név} ({d.szint}.sz): {d.kp} KP</div>)}
      {row('Misztikus képzettségek', kp_misztikus)}
      {misztikusDetails.map(d => <div key={d.név} style={{ paddingLeft: '10px' }}>· {d.név} ({d.szint}.sz): {d.kp} KP</div>)}
      {row('Primer világi képzettségek', kp_világi)}
      {világiDetails.map(d => <div key={d.név} style={{ paddingLeft: '10px' }}>· {d.név} ({d.szint}.sz): {d.kp} KP</div>)}
      {row('Harci fortélyok', kp_harci_fort)}
      {harcifortDetails.map((d, i) => <div key={i} style={{ paddingLeft: '10px' }}>· {d.név}{d.spec ? `: ${d.spec}` : ''} ({d.fok}.fok): {d.kp} KP</div>)}
      {row('Misztikus fortélyok', kp_miszt_fort)}
      {misztfortDetails.map((d, i) => <div key={i} style={{ paddingLeft: '10px' }}>· {d.név}{d.spec ? `: ${d.spec}` : ''} ({d.fok}.fok): {d.kp} KP</div>)}
      <div style={{ borderTop: '1px solid #555', marginTop: '4px', paddingTop: '4px' }}><strong>Össz primer: {total} KP</strong></div>
    </div>
  );
}
