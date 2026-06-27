import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';

export interface KpDetail { név: string; szint?: number; fok?: number; spec?: string; kp: number }

export interface PrimerKpData {
  kp_hm_cm: number;
  kp_harcmodor: number;
  kp_misztikus: number;
  kp_világi: number;
  kp_harci_fort: number;
  kp_miszt_fort: number;
  total: number;
  harcmodorDetails: KpDetail[];
  misztikusDetails: KpDetail[];
  világiDetails: KpDetail[];
  harcifortDetails: KpDetail[];
  misztfortDetails: KpDetail[];
}

export function calcPrimerKp(
  data: GameData,
  karakter: Karakter,
  képzettségek: { név: string; szint: number }[]
): PrimerKpData {
  const konstansok = data.konstansok;
  const kpTábla = data.kepzettsegKp;
  const kpCost = (szint: number) => kpTábla.filter(r => r.szint <= szint).reduce((s, r) => s + r.kp, 0);

  const harcmodorNevek = [...konstansok.harcmodorok.közelharci, ...konstansok.harcmodorok.távolsági];
  const misztikusNevek = data.kepzettsegDefs
    .filter(k => k.csoport === 'misztikus')
    .map(k => k.név.toLowerCase());

  const isMisztikus = (név: string) => {
    const lower = név.toLowerCase();
    return misztikusNevek.some(m => lower === m || lower.startsWith(m + ':'));
  };

  const primerKepzNevek = new Set(
    data.kepzettsegDefs.filter(k => k.primer).map(k => k.név.toLowerCase())
  );
  for (const nm of harcmodorNevek) primerKepzNevek.add(nm);

  const kp_hm_cm = (karakter.HM_TÉ + karakter.HM_VÉ) * konstansok.kp.hm + karakter.CM * konstansok.kp.cm;

  let kp_harcmodor = 0, kp_misztikus = 0, kp_világi = 0;
  const harcmodorDetails: KpDetail[] = [];
  const misztikusDetails: KpDetail[] = [];
  const világiDetails: KpDetail[] = [];

  for (const kp of képzettségek) {
    if (kp.szint <= 0) continue;
    const cost = kpCost(kp.szint);
    if (harcmodorNevek.includes(kp.név.toLowerCase())) {
      kp_harcmodor += cost;
      harcmodorDetails.push({ név: kp.név, szint: kp.szint, kp: cost });
    } else if (isMisztikus(kp.név)) {
      kp_misztikus += cost;
      misztikusDetails.push({ név: kp.név, szint: kp.szint, kp: cost });
    } else if (primerKepzNevek.has(kp.név.toLowerCase())) {
      kp_világi += cost;
      világiDetails.push({ név: kp.név, szint: kp.szint, kp: cost });
    }
  }

  let kp_harci_fort = 0, kp_miszt_fort = 0;
  const harcifortDetails: KpDetail[] = [];
  const misztfortDetails: KpDetail[] = [];

  for (const f of karakter.fortélyok) {
    if (!data.primerFortelyok.includes(f.név)) continue;
    const def = data.fortelySummaries.find(d => d.név === f.név);
    if (!def || def.kp_perfok === 0) continue;
    const cost = f.fok * def.kp_perfok;
    if (def.csoport === 'harci' || def.csoport === 'távharc') {
      kp_harci_fort += cost;
      harcifortDetails.push({ név: f.név, fok: f.fok, kp: cost, spec: f.spec_elem || '' });
    } else if (def.csoport === 'misztikus') {
      kp_miszt_fort += cost;
      misztfortDetails.push({ név: f.név, fok: f.fok, kp: cost, spec: f.spec_elem || '' });
    }
  }

  const total = kp_hm_cm + kp_harcmodor + kp_misztikus + kp_világi + kp_harci_fort + kp_miszt_fort;

  return {
    kp_hm_cm, kp_harcmodor, kp_misztikus, kp_világi, kp_harci_fort, kp_miszt_fort, total,
    harcmodorDetails, misztikusDetails, világiDetails, harcifortDetails, misztfortDetails
  };
}
