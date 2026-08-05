/**
 * Test-only GameData loader — mirrors engine/data-loader.ts::loadGameData but
 * reads the generated table JSONs from disk (vitest runs in node, no fetch).
 * Keep the assembly in sync with loadGameData if the table set changes.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';

const DATA_ROOT = resolve(__dirname, '../../../../data');
const j = <T>(p: string): T => JSON.parse(readFileSync(resolve(DATA_ROOT, p), 'utf-8'));

export function loadGameDataSync(): GameData {
  const kepzettsegKpRaw = j<{ 'Képzettség Szint': string; 'KP igény': string }[]>('tables/kepzettseg_kp.json');
  const harcmodorRaw = j<{ 'Harcmodor Szint': string; 'TÉ': string; 'VÉ': string; 'CÉ': string }[]>('tables/harcmodor_kepzettsegek_bonuszok.json');

  return {
    konstansok: j('tables/konstansok.json'),
    fegyverek: j('tables/fegyverek.json'),
    tavfegyverek: j('tables/tavfegyverek.json'),
    tavharcSzorzok: j('tables/tavharc_szorzok.json'),
    pajzsok: j('tables/pajzsok.json'),
    kepzettsegKp: kepzettsegKpRaw.map(e => ({ szint: parseInt(e['Képzettség Szint']), kp: parseInt(e['KP igény']) })),
    harcmodorBonusz: harcmodorRaw.map(e => ({ szint: parseInt(e['Harcmodor Szint']), TÉ: parseInt(e['TÉ']), VÉ: parseInt(e['VÉ']), CÉ: parseInt(e['CÉ']) })),
    kepzettsegDefs: j('tables/kepzettsegek.json'),
    kiterjesztesek: j('tables/kiterjesztesek.json'),
    fajNevek: j('tables/fajok.json'),
    primerFortelyok: j('tables/primer_fortelyok.json'),
    fajKeretek: j('tables/faj_tulajdonsag_keretek.json'),
    fortelySummaries: j('tables/fortelyok.json'),
    tradiciok: j('tables/tradiciok.json'),
    nyelvek: j('tables/nyelvek.json'),
    taktikak: j('tables/taktikak.json'),
    harciHelyzetek: j('tables/harci_helyzetek.json'),
    manoverek: j('tables/manoverek.json'),
    statuszok: j('tables/statuszok.json'),
    hatasOperatorok: j('tables/hatas_operatorok.json'),
    esemenyek: j('tables/esemenyek.json'),
    hatterek: j('tables/hatterek.json'),
    rules: j<{ rules: GameData['rules'] }>('rules.json').rules,
    emptyKarakter: j<Karakter>('karakter/empty_karakter.json'),
    testKarakter: j<Karakter>('karakter/test_karakter2.json'),
  };
}
