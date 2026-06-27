import type { KepzettsegDef } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';

/**
 * Megjelenítési név: többszörös képzettségeknél "AlapNév: AlNév" formátum.
 */
export function getDisplayName(név: string, kepzettsegDefs: KepzettsegDef[]): string {
  if (név.startsWith('Tradíció: ')) return név;
  for (const d of kepzettsegDefs) {
    if (d.többszörös.length === 0) continue;
    if (d.többszörös[0] === '*') {
      if (név.startsWith(d.név + ':')) return név;
    } else {
      if (d.többszörös.includes(név)) return `${d.név}: ${név}`;
    }
  }
  return név;
}

/**
 * Def lookup: többszörös képzettségeknél az alap def-et adja vissza.
 */
export function findDef(név: string, kepzettsegDefs: KepzettsegDef[]): KepzettsegDef | undefined {
  if (név.startsWith('Tradíció: ')) return kepzettsegDefs.find(d => d.név === 'Tradíció');
  for (const d of kepzettsegDefs) {
    if (d.többszörös.length === 0) continue;
    if (d.többszörös[0] === '*' && név.startsWith(d.név + ':')) return d;
    if (d.többszörös.includes(név)) return d;
  }
  return kepzettsegDefs.find(d => d.név === név);
}

/**
 * Csoport elérhető neveinek generálása (többszörös kibontva).
 */
export function getAvailableNames(
  csoport: string,
  usedNames: string[],
  defsByGroup: Map<string, KepzettsegDef[]>
): { label: string; value: string }[] {
  const csoportDefs = defsByGroup.get(csoport) || [];
  const options: { label: string; value: string }[] = [];
  for (const d of csoportDefs) {
    if (d.név === 'Tradíció') {
      const hasTradicio = usedNames.some(n => n.startsWith('Tradíció: '));
      if (!hasTradicio) options.push({ label: 'Tradíció', value: '__tradicio' });
      continue;
    }
    if (d.többszörös.length > 0) {
      if (d.többszörös[0] === '*') {
        options.push({ label: `${d.név} (új)`, value: `__prompt:${d.név}` });
      } else {
        for (const sub of d.többszörös) {
          if (!usedNames.includes(sub)) {
            options.push({ label: `${d.név}: ${sub}`, value: `${d.név}:${sub}` });
          }
        }
      }
    } else {
      if (!usedNames.includes(d.név)) {
        options.push({ label: d.név, value: d.név });
      }
    }
  }
  return options.sort((a, b) => a.value === '__tradicio' ? -1 : b.value === '__tradicio' ? 1 : 0);
}

/**
 * Adott csoportba tartozó felvett képzettség slot-ok.
 */
export function getKepzettsegekForCsoport(
  csoport: string,
  képzettségek: KepzettsegSlot[],
  defsByGroup: Map<string, KepzettsegDef[]>
): KepzettsegSlot[] {
  const csoportDefs = defsByGroup.get(csoport) || [];
  const allValidNames = new Set<string>();
  const freeTextPrefixes: string[] = [];
  for (const d of csoportDefs) {
    if (d.név === 'Tradíció') {
      freeTextPrefixes.push('Tradíció: ');
      continue;
    }
    if (d.többszörös.length > 0) {
      if (d.többszörös[0] === '*') {
        freeTextPrefixes.push(d.név + ':');
      } else {
        for (const sub of d.többszörös) allValidNames.add(sub);
      }
    } else {
      allValidNames.add(d.név);
    }
  }
  return képzettségek.filter(k =>
    allValidNames.has(k.név) || freeTextPrefixes.some(p => k.név.startsWith(p))
  );
}

/**
 * Képzettség slot-ok rendezése csoporton belül.
 */
export function sortKepzettsegSlotok(slotok: KepzettsegSlot[]): KepzettsegSlot[] {
  return slotok.slice().sort((a, b) => {
    const aTrad = a.név.startsWith('Tradíció');
    const bTrad = b.név.startsWith('Tradíció');
    if (aTrad && !bTrad) return -1;
    if (bTrad && !aTrad) return 1;
    const aArk = a.név.startsWith('Arkánum');
    const bArk = b.név.startsWith('Arkánum');
    if (aArk && !bArk) return -1;
    if (bArk && !aArk) return 1;
    const aHm = a.név.startsWith('Harcmodor:');
    const bHm = b.név.startsWith('Harcmodor:');
    if (aHm && !bHm) return -1;
    if (bHm && !aHm) return 1;
    return a.név.localeCompare(b.név, 'hu');
  });
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
