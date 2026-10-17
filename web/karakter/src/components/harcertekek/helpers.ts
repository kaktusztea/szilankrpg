import type { GameData } from '../../engine/data-loader';
import { bontKépzKulcs, képzettségNév, harcmodorNév, HARCMODOR_ID, TÁVOLSÁGI_HARCMODOR_ID, képzettségSzint } from '../../engine/azonosito';
import type { Karakter } from '../../engine/types';
import { lookupFegyver, harcmodorÖsszeg as calcHarcmodorÖsszeg } from '../../engine/utils';
import { findMfFok as findMfFokCanonical } from '../../engine/mf-utils';
import { evaluate, buildContext } from '../../engine/reactive';

// --- HM számítás ---

export function calcMaxHM(data: GameData, k: Karakter): number {
  const harcmodorok = getHarcmodorok(data);
  const harciFortelyNevek = new Set(
    data.fortelySummaries.filter(d => d.csoport === 'harci').map(d => d.id)
  );
  const harciFokok = k.fortélyok
    .filter(f => harciFortelyNevek.has(f.id) && f.id !== 'mesterfegyver')
    .reduce((s, f) => s + f.fok, 0);
  const harcmodorÖsszeg = calcHarcmodorÖsszeg(k, harcmodorok);
  const alakzatharcSzint = képzettségSzint(k.képzettségek, 'alakzatharc');
  return harciFokok + harcmodorÖsszeg + alakzatharcSzint;
}

/**
 * Max HM aszimmetria (§18): a formula a `rules.json`-ban él (`max_HM_aszimmetria`),
 * itt csak kiértékeljük - így az osztó (`konstansok.hm_aszimmetria_osztó`) egy helyen van.
 */
export function calcMaxAszimmetria(data: GameData, tsz: number): number {
  const rules = data.rules.filter(r => r.id === 'max_HM_aszimmetria');
  const computed = evaluate(rules, buildContext({}, tsz, data.konstansok));
  return computed.get('max_HM_aszimmetria') ?? 0;
}

// --- Harcmodor nevek ---

export function getHarcmodorok(data: GameData): string[] {
  return [...new Set(Object.values(data.konstansok.fegyver_kategória_harcmodor) as string[])];
}

/** Távolsági harcmodor-kulcsok ("távolsági_harcmodor/íjászat"). */
function getTávharciHmSet(data: GameData): Set<string> {
  return new Set(
    (data.kepzettsegDefs.find(d => d.id === TÁVOLSÁGI_HARCMODOR_ID)?.többszörös ?? []).map(n => `${TÁVOLSÁGI_HARCMODOR_ID}/${n.toLowerCase()}`)
  );
}

/** Harci képzettség felirata kulcsból ("harcmodor/kardvívás" → "Harcmodor: Kardvívás"). */
export function harciKepzDisplayName(data: GameData, kulcs: string): string {
  const { id } = bontKépzKulcs(kulcs);
  if (id === HARCMODOR_ID) return `Harcmodor: ${képzettségNév(kulcs, data)}`;
  if (id === TÁVOLSÁGI_HARCMODOR_ID) return `Táv. harcmodor: ${képzettségNév(kulcs, data)}`;
  return képzettségNév(kulcs, data);
}

// --- Mesterfegyver ---

export function getMfFok(data: GameData, k: Karakter, fegyverAlap: string): number {
  return findMfFokCanonical(k, data.fegyverek, fegyverAlap);
}

export function mfKövetelményHiba(data: GameData, k: Karakter, fegyverAlap: string): boolean {
  const fok = getMfFok(data, k, fegyverAlap);
  if (fok === 0) return false;
  const mfDef = data.fortelySummaries.find(d => d.id === 'mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return false;
  const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
  const fegyverHarcmodor = fDef
    ? (data.konstansok.fegyver_kategória_harcmodor as Record<string, string>)[fDef.kategória]
    : undefined;
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const refek = fegyverHarcmodor
        ? [`${HARCMODOR_ID}/${fegyverHarcmodor}`]
        : (Array.isArray(kov.név) ? kov.név : [kov.név]);
      if (!refek.some(r => képzettségSzint(k.képzettségek, r) >= kov.érték)) return true;
    } else if (kov.típus === 'fortély') {
      const id = Array.isArray(kov.név) ? kov.név[0] : kov.név;
      if (!k.fortélyok.some(f => f.id === id && f.fok >= kov.érték)) return true;
    }
  }
  return false;
}

export function mfKövetelményText(data: GameData, k: Karakter, fegyverAlap: string): string {
  const fok = getMfFok(data, k, fegyverAlap);
  if (fok === 0) return '';
  const mfDef = data.fortelySummaries.find(d => d.id === 'mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return '';
  const fDef = lookupFegyver(data.fegyverek, fegyverAlap);
  const fegyverHarcmodor = fDef
    ? (data.konstansok.fegyver_kategória_harcmodor as Record<string, string>)[fDef.kategória]
    : undefined;
  const kov = fokDef.követelmények[0];
  if (kov.típus === 'képzettség') {
    const név = fegyverHarcmodor ? harcmodorNév(fegyverHarcmodor, data)
      : (Array.isArray(kov.név) ? kov.név : [kov.név]).map(r => képzettségNév(r, data)).join(' / ');
    return `⚠ ${név} ≥ ${kov.érték}`;
  }
  return '';
}

// --- Fegyver dropdown építése ---

// --- Harci képzettségek ---

function getAllHarciNames(data: GameData): string[] {
  const harciDefs = data.kepzettsegDefs.filter(d => d.csoport === 'harci');
  const names: string[] = [];
  for (const d of harciDefs) {
    if (d.többszörös.length > 0 && d.többszörös[0] !== '*') {
      for (const sub of d.többszörös) names.push(`${d.id}/${sub.toLowerCase()}`);
    } else {
      names.push(d.id);
    }
  }
  return names;
}

/** Csak távharci harcmodor-kulcsok ("távolsági_harcmodor/íjászat", …) */
export function getAllTávharciNames(data: GameData): string[] {
  return [...getTávharciHmSet(data)];
}

/** Közelharci harcmodorok + egyéb harci képzettségek kulcsai (távharci NÉLKÜL) */
export function getAllKözelharciNames(data: GameData): string[] {
  const távharci = getTávharciHmSet(data);
  return getAllHarciNames(data).filter(n => !távharci.has(n));
}
