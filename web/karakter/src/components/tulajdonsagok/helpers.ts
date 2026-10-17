import type { KepzettsegDef } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import { bontKépzKulcs, képzettségNév, isHarcmodorId, HARCMODOR_ID, TÁVOLSÁGI_HARCMODOR_ID, TRADÍCIÓ_ID } from '../../engine/azonosito';

/**
 * Megjelenítési név egy képzettség hivatkozási kulcsából ("lexikum", "harcmodor/kardvívás", "tradíció/Vulgármágia").
 * Harcmodornál az elem neve ("Kardvívás" - a karakterlapon így áll), egyéb többszörösnél "AlapNév: elem".
 */
export function getDisplayName(kulcs: string, kepzettsegDefs: KepzettsegDef[]): string {
  const { id, elem } = bontKépzKulcs(kulcs);
  if (elem && isHarcmodorId(id)) return `${kepzettsegDefs.find(d => d.id === id)?.név ?? id}: ${képzettségNév(kulcs, { kepzettsegDefs })}`;
  return képzettségNév(kulcs, { kepzettsegDefs });
}

/** Def lookup kulcs alapján (többszörösnél az alap def). */
export function findDef(kulcs: string, kepzettsegDefs: KepzettsegDef[]): KepzettsegDef | undefined {
  const { id } = bontKépzKulcs(kulcs);
  return kepzettsegDefs.find(d => d.id === id);
}

/**
 * Csoport felvehető képzettségei (többszörös kibontva). `value` = hivatkozási kulcs; szabad szöveges
 * többszörösnél `__prompt:<id>`, Tradíciónál `__tradicio`.
 */
export function getAvailableNames(
  csoport: string,
  usedKeys: string[],
  defsByGroup: Map<string, KepzettsegDef[]>
): { label: string; value: string }[] {
  const csoportDefs = defsByGroup.get(csoport) || [];
  const options: { label: string; value: string }[] = [];
  for (const d of csoportDefs) {
    if (d.id === TRADÍCIÓ_ID) {
      if (!usedKeys.some(k => k.startsWith(`${TRADÍCIÓ_ID}/`))) options.push({ label: d.név, value: '__tradicio' });
      continue;
    }
    if (d.többszörös.length > 0) {
      if (d.többszörös[0] === '*') {
        options.push({ label: `${d.név} (új)`, value: `__prompt:${d.id}` });
      } else {
        for (const sub of d.többszörös) {
          const kulcs = `${d.id}/${isHarcmodorId(d.id) ? sub.toLowerCase() : sub}`;   // harcmodor-elem = konstansok.harcmodorok (kisbetűs)
          if (!usedKeys.includes(kulcs)) options.push({ label: `${d.név}: ${sub}`, value: kulcs });
        }
      }
    } else if (!usedKeys.includes(d.id)) {
      options.push({ label: d.név, value: d.id });
    }
  }
  return options.sort((a, b) => a.value === '__tradicio' ? -1 : b.value === '__tradicio' ? 1 : 0);
}

/** Adott csoportba tartozó felvett képzettség slot-ok (a def csoportja szerint). */
export function getKepzettsegekForCsoport(
  csoport: string,
  képzettségek: KepzettsegSlot[],
  defsByGroup: Map<string, KepzettsegDef[]>
): KepzettsegSlot[] {
  const idk = new Set((defsByGroup.get(csoport) || []).map(d => d.id));
  return képzettségek.filter(k => idk.has(k.id));
}

/**
 * Képzettség slot-ok rendezése csoporton belül: Tradíció, Arkánumok, közelharci, távolsági harcmodorok,
 * majd név szerint.
 */
export function sortKepzettsegSlotok(slotok: KepzettsegSlot[], kepzettsegDefs: KepzettsegDef[] = []): KepzettsegSlot[] {
  const rang = (k: KepzettsegSlot) => k.id === TRADÍCIÓ_ID ? 0 : k.id.startsWith('arkánum_') ? 1
    : k.id === HARCMODOR_ID ? 2 : k.id === TÁVOLSÁGI_HARCMODOR_ID ? 3 : 4;
  const név = (k: KepzettsegSlot) => képzettségNév(k, { kepzettsegDefs });
  return slotok.slice().sort((a, b) => (rang(a) - rang(b)) || név(a).localeCompare(név(b), 'hu'));
}

/**
 * defsByGroup Map-et épít a KepzettsegDef listából.
 */
export function buildDefsByGroup(kepzettsegDefs: KepzettsegDef[]): Map<string, KepzettsegDef[]> {
  const map = new Map<string, KepzettsegDef[]>();
  for (const d of kepzettsegDefs) {
    const arr = map.get(d.csoport) || [];
    arr.push(d);
    map.set(d.csoport, arr);
  }
  return map;
}
