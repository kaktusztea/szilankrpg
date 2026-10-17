import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
/**
 * Sikertelen támadás VÉ csökkentésének kalkulációja (harcszimulacio.spec.md §5.3).
 *
 * VÉ csökkentés = Fegyverviszony bázisérték + k20P(a Támadó dobás k20-ja).
 * A k20P mindig a már eldobott támadó k20-ból jön (közös kocka, §13.1 - 2026-09-26 döntés),
 * nincs külön dobás.
 */
import { k20P } from '../../engine/dice';
import { alkalmazEffektek } from './extrak-effekt';

export type Fegyverviszony = 'fegyverhátrány' | 'fegyverazonosság' | 'fegyverelőny';

export interface VéCsökkentésEredmény {
  fegyverviszony: Fegyverviszony;
  bázis: number;
  k20: number;
  k20p: number;
  /** Taktika-eredetű szorzó (pl. Roham/Öngyilkos roham: 2x) - 1, ha nincs ilyen hatás. */
  szorzó: number;
  /** Helyzet-eredetű additív bővítés (pl. Meglepetés +2) - a szorzó ELŐTT adódik hozzá (§42.3). */
  flat: number;
  végső: number;
}

/**
 * @param fegyverviszony a választott Fegyverviszony (Fegyverhátrány/Fegyverazonosság/Fegyverelőny)
 * @param k20 a Támadó dobás k20 eredménye (1-20), amiből a k20P adódik
 * @param alapTáblázat a konstansok.yaml `vé_csökkentés_alap` táblája
 * @param szorzó taktika-eredetű szorzó (pl. Roham/Öngyilkos roham: 2) - alapértelmezetten 1
 * @param flat helyzet-eredetű additív bővítés (pl. Meglepetés +2) - (bázis + k20P + flat) × szorzó, §42.3
 */
export function calcVéCsökkentés(
  fegyverviszony: Fegyverviszony,
  k20: number,
  alapTáblázat: Record<Fegyverviszony, number>,
  szorzó = 1,
  flat = 0,
): VéCsökkentésEredmény {
  const bázis = alapTáblázat[fegyverviszony];
  const k20p = k20P(k20);
  const végső = alkalmazEffektek(bázis + k20p, [{ cél: 'vé_csökkentés', mód: 'flat', érték: flat }, { cél: 'vé_csökkentés', mód: 'szorzó', érték: szorzó }]);
  return { fegyverviszony, bázis, k20, k20p, szorzó, flat, végső };
}

// ─────────────────────────────────────────────────────────────────────────────
// Taktika-alapú (nem Fegyverviszony-alapú) VÉ csökkentés - pl. Fárasztás (md/065_02).
// Nincs Támadó dobás/k20P: a taktika `hatások` tömbje adja a fix bázist, amit a karakter
// aktív fortélyainak feltételes `vé_csökkentés` cél-ú módosítói bővíthetnek.
// ─────────────────────────────────────────────────────────────────────────────

export interface TaktikaHatás {
  mód?: string;
  érték?: number;
  cél: string;
  megjegyzés?: string;
  feltétel?: string;
}

/**
 * Egy taktika `hatások` tömbjéből a `vé_csökkentés` célú "szorzó" hatás kinyerése (pl. Roham/Öngyilkos
 * roham: VÉ csökkentés duplán) - a Fegyverviszony-alapú (bázis+k20P) eredményre alkalmazandó.
 * Több `szorzó` elem esetén a legnagyobb számít (§42.3: oldalon belül nem kumulál); nincs ilyen hatás → 1.
 */
export function calcVéCsökkentésSzorzó(hatások: TaktikaHatás[] | undefined): number {
  let szorzó = 1;
  for (const h of hatások ?? []) {
    if (h.cél !== 'vé_csökkentés' || h.mód !== 'szorzó') continue;
    szorzó = Math.max(szorzó, h.érték ?? 1);
  }
  return szorzó;
}

export interface FortélyMódosítóBontás {
  forrás: string;
  érték: number;
  megjegyzés?: string;
}

export interface TaktikaVéCsökkentésEredmény {
  /** A taktika `hatások` tömbjéből, a §42.3 motorral (override = bázis, flat hozzáad). */
  taktikaBázis: number;
  /** Fortély-eredetű flat bővítések (feltételesen aktívak), forrás-bontással. */
  fortélyBővítések: FortélyMódosítóBontás[];
  /** Harci helyzet-eredetű flat bővítések (pl. Meglepetés +2), forrás-bontással. */
  helyzetBővítések: FortélyMódosítóBontás[];
  végső: number;
}

/**
 * Egy taktika `hatások` tömbjének (teljesült feltételű) `vé_csökkentés` célú elemei a közös §42.3 motorral
 * (override = bázis-csere, utána flat): pl. Fárasztás [override 3, flat +1 fegyverelőnyben] → 3 / 4.
 * A szorzó (Roham) NEM ide tartozik: az a Fegyverviszony-ágon hat (calcVéCsökkentésSzorzó).
 */
export function calcTaktikaVéCsökkentésBázis(
  hatások: TaktikaHatás[] | undefined,
  feltételTeljesül: (feltétel: string) => boolean,
): number {
  const aktív = (hatások ?? []).filter(h =>
    h.cél === 'vé_csökkentés' && (h.mód === 'override' || h.mód === 'flat') && (!h.feltétel || feltételTeljesül(h.feltétel)));
  return alkalmazEffektek(0, aktív.map(h => ({ cél: h.cél, mód: h.mód!, érték: h.érték ?? 0 })));
}

/**
 * Teljes Fárasztás-jellegű VÉ csökkentés: taktika bázis (override+flat sorrendben) + a karakter
 * aktív fortélyainak feltételes `vé_csökkentés` cél-ú flat módosítói (pl. Fárasztás fortély +1).
 */
export function calcTaktikaVéCsökkentés(
  taktikaHatások: TaktikaHatás[] | undefined,
  fortélyModosítók: { forrás: string; módosítók: { cél: string; érték: number; mód: string; feltétel?: string }[] }[],
  feltételTeljesül: (feltétel: string) => boolean,
  helyzetBővítések: FortélyMódosítóBontás[] = [],
): TaktikaVéCsökkentésEredmény {
  const taktikaBázis = calcTaktikaVéCsökkentésBázis(taktikaHatások, feltételTeljesül);
  const fortélyBővítések: FortélyMódosítóBontás[] = [];
  for (const { forrás, módosítók } of fortélyModosítók) {
    for (const mod of módosítók) {
      if (mod.cél !== 'vé_csökkentés' || mod.mód !== 'flat') continue;
      if (mod.feltétel && !feltételTeljesül(mod.feltétel)) continue;
      fortélyBővítések.push({ forrás, érték: mod.érték });
    }
  }
  const végső = taktikaBázis + [...fortélyBővítések, ...helyzetBővítések].reduce((sum, f) => sum + f.érték, 0);
  return { taktikaBázis, fortélyBővítések, helyzetBővítések, végső };
}

/** Taktika-név → definíció (a session a taktikát név szerint tárolja). */
const taktikaDef = (data: GameData, név: string) => data.taktikak.find(t => t.név === név);

/**
 * A Harc fül taktika-függő VÉ-csökkentés állapota (md/065_02):
 * - Fárasztás: a TÉ chip direktben a VÉ csökkentés popupot nyitja (taktika-override + fortély-bővítés);
 * - Roham / Öngyilkos roham: a Fegyverviszony-alapú VÉ csökkentés szorzója (oldalon belül a legnagyobb, §42.3),
 *   a szorzót adó taktikák nevével (bontás-felirat);
 * - Teljes Védekezés: nem támad - a TÉ chip info popupot nyit.
 */
export function taktikaVéCsökkentésÁllapot(
  data: GameData, karakter: Karakter, session: Session,
  feltételTeljesül: (feltétel: string) => boolean, helyzetVéCsökkentés: FortélyMódosítóBontás[],
) {
  const aktív = (név: string) => session.aktív_taktikák.some(t => t.név === név);
  const fárasztásDef = aktív(FÁRASZTÁS) ? taktikaDef(data, FÁRASZTÁS) : undefined;
  const fortélyModosítók = karakter.fortélyok.flatMap(kf => {
    const def = data.fortelySummaries.find(d => d.id === kf.id);
    const módosítók = def?.fokok.find(f => f.fok === kf.fok)?.módosítók;
    return def && módosítók?.length ? [{ forrás: def.név, módosítók }] : [];
  });
  const fárasztásEredmény = fárasztásDef
    ? calcTaktikaVéCsökkentés(fárasztásDef.hatások, fortélyModosítók, feltételTeljesül, helyzetVéCsökkentés)
    : null;

  const szorzóForrások: string[] = [];
  const szorzó = session.aktív_taktikák.reduce((max, t) => {
    const sz = calcVéCsökkentésSzorzó(taktikaDef(data, t.név)?.hatások);
    if (sz !== 1) szorzóForrások.push(t.név);
    return Math.max(max, sz);
  }, 1);

  return {
    fárasztásDef, fárasztásEredmény,
    véCsökkentésSzorzó: szorzó,
    véCsökkentésSzorzóForrás: szorzóForrások.join(', ') || undefined,
    teljesVédekezésDef: aktív(TELJES_VÉDEKEZÉS) ? taktikaDef(data, TELJES_VÉDEKEZÉS) : undefined,
  };
}

/** Taktika-nevek, amelyekhez a Harc fül TÉ chip-je eltérő viselkedést kapcsol. */
const FÁRASZTÁS = 'Fárasztás';
const TELJES_VÉDEKEZÉS = 'Teljes Védekezés';
