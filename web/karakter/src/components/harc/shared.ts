import type { Karakter } from '../../engine/types';
export { getMfBónusz, findMfFokByName } from '../../engine/mf-utils';

/** Idea-szint harcérték-hatása (a fegyver_idea_tabla egy sora). */
type IdeaHatás = { TÉ: number; VÉ: number; SP: number };
type IdeaTabla = Record<string, { TÉ: number; VÉ: number; SP: number; sebesség: number; súly: number }>;

/**
 * A felvett fegyverpéldány Idea-hatásának DELTÁJA a `idea_default`-hoz képest (Modell 2, §16).
 * A v2 harcértékek a `idea_default` hatását MÁR tartalmazzák, ezért csak a példány-Idea ettől való
 * ELTÉRÉSÉT adjuk hozzá: `IDEA[példány] − IDEA[default]` (TÉ/VÉ/SP). Default példánynál (idea =
 * idea_default) a delta 0. Ismeretlen szint → 0-hatás (a tábla tartományán kívül nincs módosító).
 */
export function ideaDelta(példányIdea: number, ideaDefault: number, tábla: IdeaTabla | undefined): IdeaHatás {
  if (!tábla) return { TÉ: 0, VÉ: 0, SP: 0 };
  const p = tábla[String(példányIdea)] ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const d = tábla[String(ideaDefault)] ?? { TÉ: 0, VÉ: 0, SP: 0 };
  return { TÉ: p.TÉ - d.TÉ, VÉ: p.VÉ - d.VÉ, SP: p.SP - d.SP };
}

/** Pajzs fegyver név összerakása a karakter pajzs méretéből. */
export function buildPajzsFegyverNév(karakter: Karakter): string | null {
  if (!karakter.pajzs?.méret) return null;
  return karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs';
}

/** Nagyobb/kisebb fegyver meghatározása fegyverhossz-kategória szerint. */
export function resolveNagyobbKisebb<T extends { fegyverhossz: number }>(
  jobbDef: T, balDef: T, jobbFp: { alap: string }, balFp: { alap: string },
): { nagyobb: T; kisebb: T; nagyobbFp: { alap: string }; kisebbFp: { alap: string }; jobbFh: number; balFh: number } {
  const jobbFh = jobbDef.fegyverhossz;
  const balFh = balDef.fegyverhossz;
  const jobbNagyobb = jobbFh >= balFh;
  return {
    nagyobb: jobbNagyobb ? jobbDef : balDef,
    kisebb: jobbNagyobb ? balDef : jobbDef,
    nagyobbFp: jobbNagyobb ? jobbFp : balFp,
    kisebbFp: jobbNagyobb ? balFp : jobbFp,
    jobbFh, balFh,
  };
}

/** Közös TÉ kalkuláció (alap + levonás + taktika + fogás + többtám). */
export function computeTÉ(baseTÉ: number, téLevonás: number, taktikaTÉ: number, fogásTÉ: number, támadások: number, többTámTÉ: number): number {
  return baseTÉ + téLevonás + taktikaTÉ + fogásTÉ + (támadások > 1 ? többTámTÉ : 0);
}

/** Közös VÉ kalkuláció (alap + bónusz + taktika - csökkenés, min 0). */
export function computeVÉ(baseVÉ: number, bónusz: number, taktikaVÉ: number, csökkenés: number): number {
  return Math.max(0, baseVÉ + bónusz + taktikaVÉ - csökkenés);
}

/**
 * VÉ veszteség szorzó az aktív harci helyzetekből ÉS státuszokból (pl. "Földön fekve",
 * "Helyhez kötve", "VÉ kiterjesztés", Fizikai státusz → duplázás, cél: vé_veszteség).
 * A halmozási szabály DATA-VEZÉRELT: a `hatas_operatorok.yaml` → `duplázás.halmozás` mezője dönt.
 * "legnagyobb" (md/081 "Nem halmozható") → a legnagyobb szorzó dominál; egyébként kumulál (szorzat).
 */
type DuplázásForrás = { név: string; hatások?: { operátor?: string; cél: string; érték?: number }[] };
type StatuszForrás = { név: string; fokok: { fok: number; hatások?: { operátor?: string; cél: string; érték?: number }[] }[] };

export function véVesztésSzorzó(
  aktívHelyzetek: string[],
  harciHelyzetek: DuplázásForrás[],
  aktívStátuszok: string[] = [],
  statuszok: StatuszForrás[] = [],
  hatasOperatorok: { id: string; halmozás?: string }[] = [],
): { szorzó: number; forrás: string } {
  // A halmozási szabály a data-ból: "legnagyobb" = nem kumulál, a max dominál.
  const halmozás = hatasOperatorok.find(o => o.id === 'duplázás')?.halmozás ?? 'legnagyobb';
  const kumulál = halmozás !== 'legnagyobb';

  let szorzó = 1;
  let forrás = '';
  const alkalmaz = (érték: number, név: string) => {
    if (kumulál) {
      szorzó *= érték;
      forrás = forrás ? `${forrás}, ${név}` : név;
    } else if (érték > szorzó) {
      szorzó = érték;
      forrás = név;
    }
  };

  // 1. Harci helyzetek
  for (const név of aktívHelyzetek) {
    const def = harciHelyzetek.find(h => h.név === név);
    for (const h of def?.hatások ?? []) {
      if (h.operátor === 'duplázás' && h.cél === 'vé_veszteség') alkalmaz(h.érték ?? 2, név);
    }
  }
  // 2. Státuszok ("Név (fok)")
  for (const entry of aktívStátuszok) {
    const match = entry.match(/^(.+?)\s*\((\d+)\)$/);
    if (!match) continue;
    const def = statuszok.find(s => s.név === match[1]);
    const fokDef = def?.fokok.find(f => f.fok === parseInt(match[2]));
    for (const h of fokDef?.hatások ?? []) {
      if (h.operátor === 'duplázás' && h.cél === 'vé_veszteség') alkalmaz(h.érték ?? 2, entry);
    }
  }
  return { szorzó, forrás };
}

/**
 * VÉ history bejegyzés felfűzése összevonással.
 * Ha az előző változás óta kevesebb mint `ablakMs` telt el ÉS az utolsó bejegyzés
 * azonos irányú (előjelű) mint az új delta, akkor összevonja őket (pl. -3, -1, -1 → -5).
 * Különben új bejegyzésként fűzi hozzá.
 *
 * @param history  eddigi bejegyzések (előjeles: csökkenés negatív, visszanyerés pozitív)
 * @param delta    az új változás előjeles értéke (nem lehet 0)
 * @param elapsedMs  az előző VÉ változás óta eltelt idő (ms); ha nincs korábbi, adj végtelent
 * @param ablakMs  összevonási ablak
 */
export function coalesceVéHistory(history: number[], delta: number, elapsedMs: number, ablakMs: number): number[] {
  const last = history[history.length - 1];
  const azonosIrány = last !== undefined && Math.sign(last) === Math.sign(delta);
  if (azonosIrány && elapsedMs < ablakMs) {
    return [...history.slice(0, -1), last + delta];
  }
  return [...history, delta];
}
