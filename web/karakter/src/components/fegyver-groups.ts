import type { GameData } from '../engine/data-loader';
import type { PickerItem } from './SpecPicker';

/** Fegyverkategória-sorrend a csoportosított pickerekben. */
export const FEGYVER_KATEGORIAK = ['kardvívó', 'közelharci', 'romboló', 'lándzsavívó', 'ostorharc'];

/**
 * Fegyverek kategóriánként csoportosítva, a `getValue` a picker-érték előállítója:
 * - Harcértékek: teljes `név` (több variáns megkülönböztetéséhez)
 * - Fortély (Mesterfegyver): `név` (spec_elem szemantika - a generátor modellben nincs
 *   külön 1K/2K rekord/Alapnév, egy fegyvernek egy neve van, a `módok[]` tartja a variánsokat)
 *
 * @param felvett  Kihagyandó értékek (getValue kimenete, lowercase-elve hasonlítva).
 */
export function buildFegyverGroups(
  data: GameData,
  getValue: (f: GameData['fegyverek'][number]) => string,
  felvett: Set<string>,
): { label: string; items: PickerItem[] }[] {
  const map = new Map<string, PickerItem[]>();
  const seen = new Set<string>();
  for (const f of data.fegyverek) {
    if (f.kategória === 'pajzs') continue;
    const value = getValue(f);
    if (felvett.has(value.toLowerCase())) continue;
    if (seen.has(value.toLowerCase())) continue;
    seen.add(value.toLowerCase());
    const arr = map.get(f.kategória) || [];
    arr.push({ value, label: f.név });
    map.set(f.kategória, arr);
  }
  return FEGYVER_KATEGORIAK.filter(kat => map.has(kat)).map(kat => ({ label: kat, items: map.get(kat)! }));
}
