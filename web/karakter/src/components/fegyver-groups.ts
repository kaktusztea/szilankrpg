import type { GameData } from '../engine/data-loader';
import type { PickerItem } from './SpecPicker';

/** Fegyverkategória-sorrend a csoportosított pickerekben. */
export const FEGYVER_KATEGORIAK = ['kardvívó', 'közelharci', 'romboló', 'lándzsavívó', 'ostorharc'];

/**
 * Fegyverek kategóriánként csoportosítva, a `getValue` a picker-érték előállítója:
 * - Harcértékek: teljes `Fegyver` név (több variáns megkülönböztetéséhez)
 * - Fortély (Mesterfegyver): `Alapnév` (spec_elem szemantika)
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
    if (f.MK_pár && f['Forgatás módja'] === 'kétkezes') continue;
    if (f.Kategória === 'pajzs') continue;
    const value = getValue(f);
    if (felvett.has(value.toLowerCase())) continue;
    if (seen.has(value.toLowerCase())) continue; // dedup (Alapnév-alapú érték több sorra eshet)
    seen.add(value.toLowerCase());
    const arr = map.get(f.Kategória) || [];
    arr.push({ value, label: f.Alapnév || f.Fegyver });
    map.set(f.Kategória, arr);
  }
  return FEGYVER_KATEGORIAK.filter(kat => map.has(kat)).map(kat => ({ label: kat, items: map.get(kat)! }));
}
