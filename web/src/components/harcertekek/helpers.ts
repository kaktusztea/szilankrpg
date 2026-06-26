import type { GameData } from '../../engine/data-loader';
import type { Karakter } from '../../engine/types';
import { lookupFegyver } from '../../engine/helpers';

// --- HM számítás ---

export function calcMaxHM(data: GameData, k: Karakter): number {
  const harcmodorok = getHarcmodorok(data);
  const harciFortelyNevek = new Set(
    data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.név)
  );
  const harciFokok = k.fortélyok
    .filter(f => harciFortelyNevek.has(f.név) && f.név !== 'Mesterfegyver')
    .reduce((s, f) => s + f.fok, 0);
  const harcmodorÖsszeg = harcmodorok.reduce(
    (s, n) => s + (k.képzettségek.find(kp => kp.név === n)?.szint ?? 0), 0
  );
  const alakzatharcSzint = k.képzettségek.find(kp => kp.név === 'Alakzatharc')?.szint ?? 0;
  return harciFokok + harcmodorÖsszeg + alakzatharcSzint;
}

export function calcMaxAszimmetria(data: GameData, tsz: number): number {
  return Math.floor(tsz / data.konstansok.hm_aszimmetria_osztó);
}

// --- Harcmodor nevek ---

export function getHarcmodorok(data: GameData): string[] {
  return [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])];
}

export function getKözelharciHmSet(data: GameData): Set<string> {
  return new Set(getHarcmodorok(data));
}

export function getTávharciHmSet(data: GameData): Set<string> {
  return new Set(
    data.kepzettsegDefs.find(d => d.név === 'Távolsági harcmodor')?.többszörös ?? []
  );
}

export function harciKepzDisplayName(data: GameData, név: string): string {
  if (getKözelharciHmSet(data).has(név)) return `Harcmodor: ${név}`;
  if (getTávharciHmSet(data).has(név)) return `Táv. harcmodor: ${név}`;
  return név;
}

// --- Mesterfegyver ---

export function getMfFok(data: GameData, k: Karakter, fegyverAlap: string): number {
  const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
  const displayName = fDef?.Alapnév || fegyverAlap;
  const entry = k.fortélyok.find(
    f => f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fegyverAlap)
  );
  return entry?.fok ?? 0;
}

export function mfKövetelményHiba(data: GameData, k: Karakter, fegyverAlap: string): boolean {
  const fok = getMfFok(data, k, fegyverAlap);
  if (fok === 0) return false;
  const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return false;
  const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
  const fegyverHarcmodor = fDef
    ? (data.konstansok.fegyver_kategória_harcmodor as Record<string, string>)[fDef.Kategória]
    : undefined;
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const szűrtNevek = fegyverHarcmodor
        ? [fegyverHarcmodor]
        : (Array.isArray(kov.név) ? kov.név : [kov.név]);
      if (!szűrtNevek.some(n =>
        (k.képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték
      )) return true;
    } else if (kov.típus === 'fortély') {
      const név = Array.isArray(kov.név) ? kov.név[0] : kov.név;
      if (!k.fortélyok.some(f => f.név.toLowerCase() === név.toLowerCase() && f.fok >= kov.érték)) return true;
    }
  }
  return false;
}

export function mfKövetelményText(data: GameData, k: Karakter, fegyverAlap: string): string {
  const fok = getMfFok(data, k, fegyverAlap);
  if (fok === 0) return '';
  const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return '';
  const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
  const fegyverHarcmodor = fDef
    ? (data.konstansok.fegyver_kategória_harcmodor as Record<string, string>)[fDef.Kategória]
    : undefined;
  const kov = fokDef.követelmények[0];
  if (kov.típus === 'képzettség') {
    const név = fegyverHarcmodor ?? (Array.isArray(kov.név) ? kov.név.join(' / ') : kov.név);
    return `⚠ ${név} ≥ ${kov.érték}`;
  }
  return '';
}

// --- Fegyver dropdown építése ---

export function buildFegyverByKat(
  data: GameData,
  felvettFegyverek: Set<string>
): Map<string, { id: string; label: string }[]> {
  const map = new Map<string, { id: string; label: string }[]>();
  for (const f of data.fegyverek) {
    if (f.MK_pár && f['Forgatás módja'] === 'kétkezes') continue;
    if (f.Kategória === 'pajzs') continue;
    if (felvettFegyverek.has(f.Fegyver.toLowerCase())) continue;
    const arr = map.get(f.Kategória) || [];
    arr.push({ id: f.Fegyver, label: f.Alapnév || f.Fegyver });
    map.set(f.Kategória, arr);
  }
  return map;
}

export const FEGYVER_KATEGORIAK = ['kardvívó', 'közelharci', 'romboló', 'lándzsavívó', 'ostorharc'];

// --- Harci képzettségek ---

export function getAllHarciNames(data: GameData): string[] {
  const harciDefs = data.kepzettsegDefs.filter(d => d.csoport === 'harci');
  const names: string[] = [];
  for (const d of harciDefs) {
    if (d.többszörös.length > 0 && d.többszörös[0] !== '*') {
      for (const sub of d.többszörös) names.push(sub);
    } else {
      names.push(d.név);
    }
  }
  return names;
}
