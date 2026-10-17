/**
 * Fortély / képzettség azonosítás (2026-10-17, id-átállás F3-F4).
 *
 * A karakter `képzettségek: [{id, elem, szint}]` és `fortélyok: [{id, elem, fok, …}]` alakban tárol; a data layer
 * id-vel hivatkozik (l. data/gen/hivatkozas.py). Képzettségnél a hivatkozási KULCS: `<id>/<elem>` többszörösnél
 * (pl. "harcmodor/kardvívás", "ősi_nyelv_ismerete/Kyr", "tradíció/Vulgármágia"), egyébként `<id>`.
 * Megjelenítéshez EGY helyen oldjuk fel a nevet (képzettségNév / fortélyNév).
 */
import type { GameData } from './data-loader';

/** Képzettség-id-k, amelyek eleme harcmodor (konstansok.harcmodorok) - a megjelenített név maga az elem. */
export const HARCMODOR_ID = 'harcmodor';
export const TÁVOLSÁGI_HARCMODOR_ID = 'távolsági_harcmodor';
export const TRADÍCIÓ_ID = 'tradíció';
export const EGYEDI_FORTÉLY_ID = 'egyedi';

type KépzRef = { id: string; elem?: string };

/** Képzettség hivatkozási kulcsa: "<id>/<elem>" vagy "<id>". */
export function képzKulcs(kp: KépzRef): string {
  return kp.elem ? `${kp.id}/${kp.elem}` : kp.id;
}

/** Kulcs → {id, elem}. */
export function bontKépzKulcs(kulcs: string): { id: string; elem: string } {
  const i = kulcs.indexOf('/');
  return i < 0 ? { id: kulcs, elem: '' } : { id: kulcs.slice(0, i), elem: kulcs.slice(i + 1) };
}

export const isHarcmodorId = (id: string) => id === HARCMODOR_ID || id === TÁVOLSÁGI_HARCMODOR_ID;

/** Harcmodor-elem (pl. "kardvívás") megjelenített neve: a Harcmodor-def `többszörös` listájából ("Kardvívás"). */
export function harcmodorNév(elem: string, data?: Pick<GameData, 'kepzettsegDefs'>): string {
  for (const d of data?.kepzettsegDefs ?? []) {
    if (!isHarcmodorId(d.id)) continue;
    const hit = d.többszörös.find(n => n.toLowerCase() === elem);
    if (hit) return hit;
  }
  return elem.charAt(0).toUpperCase() + elem.slice(1);
}

/**
 * Képzettség megjelenített neve. Harcmodor: az elem neve ("Kardvívás"); egyéb többszörös / Tradíció:
 * "Alapnév: elem"; egyszerű: a def neve. Ismeretlen id → maga a kulcs (nem dob).
 */
export function képzettségNév(ref: KépzRef | string, data: Pick<GameData, 'kepzettsegDefs'>): string {
  const { id, elem } = typeof ref === 'string' ? bontKépzKulcs(ref) : { id: ref.id, elem: ref.elem ?? '' };
  if (elem && isHarcmodorId(id)) return harcmodorNév(elem, data);
  const név = data.kepzettsegDefs.find(d => d.id === id)?.név ?? id;
  return elem ? `${név}: ${elem}` : név;
}

/** Fortély megjelenített neve (egyedi fortélynál az elem). */
export function fortélyNév(f: { id: string; elem?: string } | string, data: Pick<GameData, 'fortelySummaries'>): string {
  const id = typeof f === 'string' ? f : f.id;
  if (typeof f !== 'string' && id === EGYEDI_FORTÉLY_ID) return f.elem ?? '';
  return data.fortelySummaries.find(d => d.id === id)?.név ?? id;
}

/** A karakter adott képzettségének szintje (kulcs szerint; 0, ha nincs). */
export function képzettségSzint(képzettségek: readonly (KépzRef & { szint: number })[], kulcs: string): number {
  return képzettségek.find(kp => képzKulcs(kp) === kulcs)?.szint ?? 0;
}

/** A karakter adott fortélyának legmagasabb foka (több példánynál a max; 0, ha nincs). */
export function fortélyFok(fortélyok: readonly { id: string; fok: number }[], id: string): number {
  return fortélyok.reduce((m, f) => (f.id === id && f.fok > m ? f.fok : m), 0);
}
