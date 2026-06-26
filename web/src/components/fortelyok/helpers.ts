import type { FortelySummary } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';

export function displayName(f: Fortely): string {
  const base = f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név;
  if (f.kiérdemelt) return f.fok > 1 ? `${base} ⭐➕` : `${base} ⭐`;
  return base;
}

export function getFortelyokForCsoport(
  csoport: string,
  fortélyok: Fortely[],
  defsByGroup: Map<string, FortelySummary[]>,
  lockedSet: Set<string>
): Fortely[] {
  const csoportNevek = new Set((defsByGroup.get(csoport) || []).map(d => d.név));
  const items = fortélyok.filter(f => csoportNevek.has(f.név));
  items.sort((a, b) => {
    const aLocked = lockedSet.has(a.név);
    const bLocked = lockedSet.has(b.név);
    if (aLocked && !bLocked) return -1;
    if (bLocked && !aLocked) return 1;
    const nameComp = a.név.localeCompare(b.név);
    if (nameComp !== 0) return nameComp;
    return b.fok - a.fok;
  });
  return items;
}

export function calcNyelvPontKeret(nyelvtanulásSzint: number): number {
  return Math.max(0, (nyelvtanulásSzint - 3) * 3);
}

export function calcNyelvTúllépés(slotok: Fortely[], nyelvPontKeret: number): { túllépés: number; overSet: Set<Fortely> } {
  const nyelvismeretSlotok = slotok.filter(s => s.név === 'Nyelvismeret');
  const összFok = nyelvismeretSlotok.filter(s => !s.kiérdemelt).reduce((s, f) => s + f.fok, 0)
    + nyelvismeretSlotok.filter(s => !!s.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
  const túllépés = Math.max(0, összFok - nyelvPontKeret);

  let maradékTúl = túllépés;
  const overSet = new Set<Fortely>();
  const fizetősNyelvek = nyelvismeretSlotok.filter(s => !s.kiérdemelt || s.fok > 1);
  for (let j = fizetősNyelvek.length - 1; j >= 0 && maradékTúl > 0; j--) {
    overSet.add(fizetősNyelvek[j]);
    maradékTúl -= fizetősNyelvek[j].kiérdemelt ? fizetősNyelvek[j].fok - 1 : fizetősNyelvek[j].fok;
  }
  return { túllépés, overSet };
}

export function isSlotIngyenes(
  slot: Fortely,
  csoport: string,
  slotok: Fortely[],
  tsz: number,
  def?: FortelySummary
): boolean {
  if (csoport === 'szabad') {
    if (slot.kiérdemelt) return true;
    const nonKierdemeltIdx = slotok.filter(s => !s.kiérdemelt).indexOf(slot);
    return nonKierdemeltIdx < tsz;
  }
  if (def && def.ingyenes_perszint > 0) {
    const ingyenesDb = Math.floor((tsz + 1) / def.ingyenes_perszint);
    const sameTypeSlots = slotok.filter(s => s.név === def.név);
    const posInType = sameTypeSlots.indexOf(slot);
    return posInType < ingyenesDb;
  }
  return false;
}

export function buildDefsByGroup(fortelySummaries: FortelySummary[]): Map<string, FortelySummary[]> {
  const map = new Map<string, FortelySummary[]>();
  for (const d of fortelySummaries) {
    const vizCsoport = d.alcsoport === 'tavharc' ? 'távharc' : d.csoport;
    const arr = map.get(vizCsoport) || [];
    arr.push(d);
    map.set(vizCsoport, arr);
  }
  return map;
}
