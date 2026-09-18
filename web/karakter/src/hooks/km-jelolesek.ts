/**
 * KM (Kalandmester) harci jelölések: az NJK switcher sáv chipjeihez rendelt
 * színes betű-jelölés + szabad szöveges jegyzet. Tisztán KM helyi eszköz —
 * NEM része a karakter sémájának, NEM utazik URL-megosztásban vagy checkpointban.
 *
 * Tárolás: külön localStorage kulcs, uid → { betű, szín, jegyzet }. A szín NEM a betűből
 * számolódik, hanem FELVÉTELKOR dől el (`választSzínt`), hogy minden eltérő betű eltérő
 * színt kapjon, ezért tárolni kell.
 */

const KEY = 'szilank_km_jelolesek';

/** Egy NJK-hoz rendelt KM jelölés. */
export interface KmJelölés {
  betű: string;   // egyetlen A–Z betű
  szín: string;   // felvételkor választott szín (KM_JEL_SZÍNEK egyike)
  jegyzet: string; // KM szabad szövege (max MAX_KM_JEGYZET)
}

type KmJelölésTár = Record<string, KmJelölés>;

/** Beolvassa a teljes KM jelölés tárat. Hibás/hiányzó adatnál üres objektum. */
export function readKmJelölések(): KmJelölésTár {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Egy NJK jelölése, vagy null ha nincs. */
export function getKmJelölés(uid: string): KmJelölés | null {
  return readKmJelölések()[uid] ?? null;
}

/**
 * Jelölés beírása/frissítése. Ha `betű` üres ÉS `jegyzet` üres → a bejegyzés törlődik
 * (nincs értelme üres jelölést tárolni).
 */
export function writeKmJelölés(uid: string, jel: KmJelölés): void {
  const tár = readKmJelölések();
  if (!jel.betű && !jel.jegyzet) delete tár[uid];
  else tár[uid] = jel;
  localStorage.setItem(KEY, JSON.stringify(tár));
}

/** Egy NJK jelölésének törlése (pl. a slot törlésekor — ne maradjon árva bejegyzés). */
export function removeKmJelölés(uid: string): void {
  const tár = readKmJelölések();
  if (uid in tár) {
    delete tár[uid];
    localStorage.setItem(KEY, JSON.stringify(tár));
  }
}

/**
 * Szín választása egy betűhöz FELVÉTELKOR, a már használt színek ismeretében.
 * Cél: minden eltérő betű eltérő szín.
 *
 * 1. Ha ez a betű már szerepel valahol → ugyanazt a színt kapja (betű↔szín konzisztens).
 * 2. Különben a legkevésbé használt szabad színt választja (holtversenynél a paletta sorrendje dönt).
 *    ponytail: ha >12 eltérő betű van (paletta kimerül), a legritkábban használt szín ismétlődik —
 *    a KM-nek max 10 NJK-ja van, ez a gyakorlatban nem érhető el.
 *
 * @param betű a jelölő betű
 * @param tár a jelenlegi jelölés-tár (kizárható belőle a szerkesztett uid, ha kell)
 * @param paletta a választható színek
 */
export function választSzínt(betű: string, tár: KmJelölésTár, paletta: readonly string[]): string {
  const bejegyzések = Object.values(tár);
  const meglévő = bejegyzések.find(j => j.betű === betű);
  if (meglévő) return meglévő.szín;

  const használat = new Map<string, number>(paletta.map(sz => [sz, 0]));
  for (const j of bejegyzések) {
    if (használat.has(j.szín)) használat.set(j.szín, használat.get(j.szín)! + 1);
  }
  // A paletta sorrendjében az első minimum-használatú szín.
  let legjobb = paletta[0];
  let min = Infinity;
  for (const sz of paletta) {
    const n = használat.get(sz)!;
    if (n < min) { min = n; legjobb = sz; }
  }
  return legjobb;
}
