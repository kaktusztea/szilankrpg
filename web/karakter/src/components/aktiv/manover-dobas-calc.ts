// Manőver dobás popup — pure (render-mentes) logika.
// Kiemelve a ManoverDobasPopup.tsx-ből (2026-09-11 refaktor): a komponens csak a
// dobás-folyamat state-jét és JSX-ét tartja, minden számítás/feltétel ide kerül.
// Ezekre a fn-ekre írt tesztek: Manover{Kovetelmeny,TeBontas,FazisFelirat,EredmenyHatas}.test.ts
import type { Karakter } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { ModositoTabla, ManoverKövetelmény } from '../../engine/data-types';

export type Mód = 'aktív' | 'passzív';
export type FázisEredmény = 'pending' | 'igen' | 'nem';

export interface ManőverDef {
  név: string;
  nehézség: number;
  fázisok: string;
  fázis_info: Record<string, string>;
  fázis_cselekvő: Record<string, 'én' | 'ellenfél'>;
  ellenpróba_bünteti: boolean;
  típus: string;
  hatás: string[];
  végrehajtás_té_módosító: number;
  követelmények: ManoverKövetelmény[];
  helyzetfüggő_módosítók: ModositoTabla[];
}

/** Egy harcmodor-képzettség szintje-e, ill. bármely harcmodor max szintje ("Harcmodor"). */
function harcmodorMaxSzint(karakter: Karakter, data: GameData): number {
  const nevek = new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[]);
  return Math.max(0, ...karakter.képzettségek.filter(k => nevek.has(k.név)).map(k => k.szint));
}

/**
 * Gépi (auto-kiértékelt) követelmény teljesül-e a karakter alapján.
 * Informatív ('egyéb') követelményt NEM lehet gépileg értékelni → null (a játékos dönt).
 */
export function követelményTeljesül(köv: ManoverKövetelmény, karakter: Karakter, data: GameData): boolean | null {
  if (köv.típus === 'egyéb') return null;
  const küszöb = köv.érték ?? 0;
  if (köv.típus === 'képzettség') {
    const szint = köv.név === 'Harcmodor'
      ? harcmodorMaxSzint(karakter, data)
      : (karakter.képzettségek.find(k => k.név === köv.név)?.szint ?? 0);
    return szint >= küszöb;
  }
  // fortély: a felvett (max) fok
  const fok = Math.max(0, ...karakter.fortélyok.filter(f => f.név === köv.név).map(f => f.fok));
  return fok >= küszöb;
}

/**
 * A gépi követelmények kiértékelése egy manőverre.
 * - `erősHiány`: van hiányzó gépi Erős követelmény → auto-kudarc (nem dobható).
 * - `normálHiány`: van hiányzó gépi Normál követelmény → a "Teljesül mind" gomb tiltandó.
 */
export function gépiKövetelményStátusz(
  követelmények: ManoverKövetelmény[], karakter: Karakter, data: GameData,
): { erősHiány: boolean; normálHiány: boolean } {
  let erősHiány = false, normálHiány = false;
  for (const köv of követelmények) {
    const teljesül = követelményTeljesül(köv, karakter, data);
    if (teljesül === false) {
      if (köv.erősség === 'erős') erősHiány = true;
      else normálHiány = true;
    }
  }
  return { erősHiány, normálHiány };
}

/** Parse fázisok string (e.g. "M,V,E" or "E (M*)") into phase list, PRESERVING the
 *  order of appearance in the string (the `fázisok:` field encodes the intended order).
 *  A `*` marker (conditional phase) is ignored; duplicates removed. */
export function parseFázisok(s: string): ('M' | 'V' | 'E')[] {
  const result: ('M' | 'V' | 'E')[] = [];
  for (const ch of s) {
    if ((ch === 'M' || ch === 'V' || ch === 'E') && !result.includes(ch)) {
      result.push(ch);
    }
  }
  return result;
}

export function calcManőverPont(karakter: Karakter, data: GameData): number {
  const { képzettségek, tsz } = karakter;
  const harcmodorNevek = [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])];
  const összeg = harcmodorNevek.reduce((s, n) => s + (képzettségek.find(k => k.név === n)?.szint ?? 0), 0);
  return Math.ceil(összeg * 2 / (tsz || 1));
}

export function getBelharcFok(karakter: Karakter): number {
  const f = karakter.fortélyok.find(f => f.név === 'Belharc');
  return f?.fok ?? 0;
}

interface TéBontásSor { forrás: string; érték: number }

/**
 * A Manőver popup közelítő TÉ-bontása (a HarcScreen `baseTÉ` képletének EGYETLEN forrása).
 * A HarcScreen ennek az összegét használja — így a bontás és az összeg sosem driftel szét.
 * ponytail: közelítő (per-fegyver módosítók nélkül), ahogy a `baseTÉ` komment is jelzi.
 */
export function téBontás(karakter: Karakter, data: GameData): TéBontásSor[] {
  const t = karakter.tulajdonságok;
  return [
    { forrás: 'Alap TÉ', érték: data.konstansok.harcérték_alap?.TÉ ?? 0 },
    { forrás: 'Erő', érték: t.erő },
    { forrás: 'Ügyesség', érték: t.ügyesség },
    { forrás: 'Gyorsaság', érték: t.gyorsaság },
    { forrás: 'Harcmodor (HM)', érték: karakter.HM_TÉ },
  ];
}

export function téBontásÖsszeg(karakter: Karakter, data: GameData): number {
  return téBontás(karakter, data).reduce((s, r) => s + r.érték, 0);
}

/**
 * Ki a cselekvő az adott fázisban (az ALKALMAZÓ szemszögéből, aktív mód).
 * Default: M → ellenfél (ő akaszt), V/E → én. A manőver `fázis_cselekvő` felülírhatja
 * (pl. Távoltartás M → én).
 */
export function fázisCselekvő(
  fázis: 'M' | 'V' | 'E', cselekvők: Record<string, 'én' | 'ellenfél'> | undefined,
): 'én' | 'ellenfél' {
  const override = cselekvők?.[fázis];
  if (override) return override;
  return fázis === 'M' ? 'ellenfél' : 'én';
}

/**
 * Egy fázis eredménye a MANŐVER szempontjából sikeres-e.
 * A CSELEKVŐ éri-e el a célját: ha a cselekvő = én → találat/elérés (`igen`) a jó;
 * ha a cselekvő = ellenfél (megakaszt) → a hibázása (`nem`) a jó a manővernek.
 */
export function fázisSikeres(eredmény: FázisEredmény, cselekvő: 'én' | 'ellenfél'): boolean {
  if (eredmény === 'pending') return false;
  return cselekvő === 'én' ? eredmény === 'igen' : eredmény === 'nem';
}

/**
 * Fázis gomb-feliratok a KONKRÉT dobás alapján. A cselekvő (én/ellenfél) + a mód
 * együtt adja, hogy a képernyő előtt ülő dob-e: tényleges = cselekvő XOR (passzív).
 * A `siker`/`kudarc` a MANŐVER-siker felé mutató, ill. attól elvezető dobás-eredmény.
 */
export function getFázisFelirat(
  fázis: 'M' | 'V' | 'E', mód: Mód, cselekvő: 'én' | 'ellenfél',
): { siker: string; kudarc: string } {
  // A képernyő előtt ülő az adott fázisban maga dob-e?
  const énDobok = (cselekvő === 'én') === (mód === 'aktív');
  if (fázis === 'M' && cselekvő === 'ellenfél') {
    // Megakasztó az ellenfél — a manőver-siker = a megakasztás NEM talál.
    return énDobok
      ? { siker: 'Elhibáztam', kudarc: 'Eltaláltam' }
      : { siker: 'Elhibázta', kudarc: 'Eltalált' };
  }
  // Cselekvő = én-típusú akció (V, E, vagy én-Megakasztás mint Távoltartás):
  // a cselekvő találata/elérése a manőver-siker.
  if (fázis === 'E') {
    return énDobok
      ? { siker: 'Elértem', kudarc: 'Nem értem el' }
      : { siker: 'Elérte', kudarc: 'Nem érte el' };
  }
  // M (én-cselekvő, pl. Távoltartás) vagy V — támadás/találat
  return énDobok
    ? { siker: 'Talált', kudarc: 'Nem talált' }
    : { siker: 'Eltalált', kudarc: 'Nem talált' };
}

/**
 * A "Manőver sikeres" boxban megjelenő hatás-sorok: a `hatás`-ból kiszűrjük a
 * kudarc-jellegű ("Sikertelen:" / "Kudarc:") és a feltétel/meta ("Feltétel:") sorokat —
 * ezek a SIKERES kontextusban félrevezetők/feleslegesek (a teljes `hatás` a pickerben látszik).
 * C2 (ponytail: prefix-alapú szűrés).
 */
export function eredményHatás(hatás: string[]): string[] {
  return hatás.filter(s => !/^\s*(sikertelen|kudarc|feltétel)\b/i.test(s));
}
