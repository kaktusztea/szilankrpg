import type { Kepzettseg } from '../../engine/types';
import { képzettségNév, isHarcmodorId } from '../../engine/azonosito';
import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';

export interface KpDetail { név: string; szint?: number; fok?: number; spec?: string; kp: number }

interface PrimerKpData {
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
  képzettségek: Kepzettseg[]
): PrimerKpData {
  const konstansok = data.konstansok;
  const kpTábla = data.kepzettsegKp;
  const kpCost = (szint: number) => kpTábla.filter(r => r.szint <= szint).reduce((s, r) => s + r.kp, 0);

  const defOf = (id: string) => data.kepzettsegDefs.find(d => d.id === id);
  const név = (kp: Kepzettseg) => képzettségNév(kp, data);

  const kp_hm_cm = (karakter.HM_TÉ + karakter.HM_VÉ) * konstansok.kp.hm + karakter.CM * konstansok.kp.cm;

  let kp_harcmodor = 0, kp_misztikus = 0, kp_világi = 0;
  const harcmodorDetails: KpDetail[] = [];
  const misztikusDetails: KpDetail[] = [];
  const világiDetails: KpDetail[] = [];

  for (const kp of képzettségek) {
    if (kp.szint <= 0) continue;
    const cost = kpCost(kp.szint);
    if (isHarcmodorId(kp.id)) {
      kp_harcmodor += cost;
      harcmodorDetails.push({ név: név(kp), szint: kp.szint, kp: cost });
    } else if (defOf(kp.id)?.csoport === 'misztikus') {
      kp_misztikus += cost;
      misztikusDetails.push({ név: név(kp), szint: kp.szint, kp: cost });
    } else if (defOf(kp.id)?.primer) {
      kp_világi += cost;
      világiDetails.push({ név: név(kp), szint: kp.szint, kp: cost });
    }
  }

  let kp_harci_fort = 0, kp_miszt_fort = 0;
  const harcifortDetails: KpDetail[] = [];
  const misztfortDetails: KpDetail[] = [];

  for (const f of karakter.fortélyok) {
    if (!data.primerFortelyok.includes(f.id)) continue;
    const def = data.fortelySummaries.find(d => d.id === f.id);
    if (!def || def.kp_perfok === 0) continue;
    const cost = f.fok * def.kp_perfok;
    if (def.csoport === 'harci' || def.csoport === 'távharc') {
      kp_harci_fort += cost;
      harcifortDetails.push({ név: def.név, fok: f.fok, kp: cost, spec: f.elem || '' });
    } else if (def.csoport === 'misztikus') {
      kp_miszt_fort += cost;
      misztfortDetails.push({ név: def.név, fok: f.fok, kp: cost, spec: f.elem || '' });
    }
  }

  const total = kp_hm_cm + kp_harcmodor + kp_misztikus + kp_világi + kp_harci_fort + kp_miszt_fort;

  return {
    kp_hm_cm, kp_harcmodor, kp_misztikus, kp_világi, kp_harci_fort, kp_miszt_fort, total,
    harcmodorDetails, misztikusDetails, világiDetails, harcifortDetails, misztfortDetails
  };
}
