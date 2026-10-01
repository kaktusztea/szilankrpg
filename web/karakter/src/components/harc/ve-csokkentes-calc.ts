/**
 * Sikertelen támadás VÉ csökkentésének kalkulációja (harcszimulacio.spec.md §5.3).
 *
 * VÉ csökkentés = Fegyverviszony bázisérték + k20P(a Támadó dobás k20-ja).
 * A k20P mindig a már eldobott támadó k20-ból jön (közös kocka, §13.1 - 2026-09-26 döntés),
 * nincs külön dobás.
 */
import { k20P } from '../../engine/dice';

export type Fegyverviszony = 'fegyverhátrány' | 'fegyverazonosság' | 'fegyverelőny';

export interface VéCsökkentésEredmény {
  fegyverviszony: Fegyverviszony;
  bázis: number;
  k20: number;
  k20p: number;
  /** Taktika-eredetű szorzó (pl. Roham/Öngyilkos roham: 2x) - 1, ha nincs ilyen hatás. */
  szorzó: number;
  végső: number;
}

/**
 * @param fegyverviszony a választott Fegyverviszony (Fegyverhátrány/Fegyverazonosság/Fegyverelőny)
 * @param k20 a Támadó dobás k20 eredménye (1-20), amiből a k20P adódik
 * @param alapTáblázat a konstansok.yaml `vé_csökkentés_alap` táblája
 * @param szorzó taktika-eredetű szorzó (pl. Roham/Öngyilkos roham: 2) - alapértelmezetten 1
 */
export function calcVéCsökkentés(
  fegyverviszony: Fegyverviszony,
  k20: number,
  alapTáblázat: Record<Fegyverviszony, number>,
  szorzó = 1,
): VéCsökkentésEredmény {
  const bázis = alapTáblázat[fegyverviszony];
  const k20p = k20P(k20);
  return { fegyverviszony, bázis, k20, k20p, szorzó, végső: (bázis + k20p) * szorzó };
}

// ─────────────────────────────────────────────────────────────────────────────
// Taktika-alapú (nem Fegyverviszony-alapú) VÉ csökkentés - pl. Fárasztás (md/065_02).
// Nincs Támadó dobás/k20P: a taktika `hatások` tömbje adja a fix bázist, amit a karakter
// aktív fortélyainak feltételes `vé_csökkentés` cél-ú módosítói bővíthetnek.
// ─────────────────────────────────────────────────────────────────────────────

export interface TaktikaHatás {
  hatás?: string;
  érték?: number;
  cél: string;
  megjegyzés?: string;
  feltétel?: string;
}

/**
 * Egy taktika `hatások` tömbjéből a `vé_csökkentés` célú "szorzó" hatás kinyerése (pl. Roham/Öngyilkos
 * roham: VÉ csökkentés duplán) - a Fegyverviszony-alapú (bázis+k20P) eredményre alkalmazandó.
 * Több `szorzó` elem esetén összeszorzódnak; nincs ilyen hatás → 1.
 */
export function calcVéCsökkentésSzorzó(hatások: TaktikaHatás[] | undefined): number {
  let szorzó = 1;
  for (const h of hatások ?? []) {
    if (h.cél !== 'vé_csökkentés' || h.hatás !== 'szorzó') continue;
    szorzó *= h.érték ?? 1;
  }
  return szorzó;
}

export interface FortélyMódosítóBontás {
  forrás: string;
  érték: number;
  megjegyzés?: string;
}

export interface TaktikaVéCsökkentésEredmény {
  /** A taktika `hatások` tömbjéből, SORRENDBEN akkumulálva (override felülír, flat hozzáad) - l. schemas/taktika.yaml. */
  taktikaBázis: number;
  /** Fortély-eredetű flat bővítések (feltételesen aktívak), forrás-bontással. */
  fortélyBővítések: FortélyMódosítóBontás[];
  végső: number;
}

/**
 * Egy taktika `hatások` tömbjének `vé_csökkentés` célú elemeit SORRENDBEN (balról jobbra)
 * akkumulálja: "override" felülírja az addig összegyűjtött értéket, "flat" hozzáadja.
 * (KONVENCIÓ: ez NEM a §42.3 mód-kategória precedencia-motor - l. schemas/taktika.yaml komment.)
 */
export function calcTaktikaVéCsökkentésBázis(
  hatások: TaktikaHatás[] | undefined,
  feltételTeljesül: (feltétel: string) => boolean,
): number {
  let érték = 0;
  for (const h of hatások ?? []) {
    if (h.cél !== 'vé_csökkentés') continue;
    if (h.feltétel && !feltételTeljesül(h.feltétel)) continue;
    if (h.hatás === 'override') érték = h.érték ?? 0;
    else if (h.hatás === 'flat') érték += h.érték ?? 0;
  }
  return érték;
}

/**
 * Teljes Fárasztás-jellegű VÉ csökkentés: taktika bázis (override+flat sorrendben) + a karakter
 * aktív fortélyainak feltételes `vé_csökkentés` cél-ú flat módosítói (pl. Fárasztás fortély +1).
 */
export function calcTaktikaVéCsökkentés(
  taktikaHatások: TaktikaHatás[] | undefined,
  fortélyModosítók: { forrás: string; módosítók: { cél: string; érték: number; mód: string; feltétel?: string }[] }[],
  feltételTeljesül: (feltétel: string) => boolean,
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
  const végső = taktikaBázis + fortélyBővítések.reduce((sum, f) => sum + f.érték, 0);
  return { taktikaBázis, fortélyBővítések, végső };
}
