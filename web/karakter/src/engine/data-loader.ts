import type { FegyverAlap, TavfegyverAlap, TavharcSzorzok, Karakter } from './types';
import type { Rule } from './reactive';
import type { KonstansokRaw, KepzettsegDef, KiterjesztesEntry, FortelySummary, TradicioEntry, NyelvEntry, TaktikaEntry, HarciHelyzetEntry, ManoverEntry, StatuszEntry, HatasOperator, EsemenyEntry, HatterekData, GameData } from './data-types';
export type { KepzettsegDef, KiterjesztesEntry, FortelyModosito, FortelyFokSummary, FortelySummary, TradicioAltipus, TradicioEntry, NyelvEntry, TaktikaMegkötés, TaktikaEntry, HarciHelyzetEntry, SzituacioEntry, ManoverEntry, StatuszHatas, StatuszFok, StatuszEntry, HatasOperator, EsemenyEntry, LeíróHátterKategória, KarmaHátterEntry, HatterekData, GameData } from './data-types';

const BASE = import.meta.env.BASE_URL + 'data/';

interface KepzettsegKpEntry { 'Képzettség Szint': string; 'KP igény': string; }
interface HarcmodorBonuszEntry { 'Harcmodor Szint': string; 'TÉ': string; 'VÉ': string; 'CÉ': string; }

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export async function loadGameData(): Promise<GameData> {
  const [konstansok, fegyverek, tavfegyverek, tavharcSzorzok, pajzsok, kepzettsegKpRaw, harcmodorRaw, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, tradiciok, nyelvek, taktikak, harciHelyzetek, manoverek, statuszok, hatasOperatorok, esemenyek, hatterek, rulesFile, emptyKarakter, testKarakter] = await Promise.all([
    fetchJson<KonstansokRaw>('tables/konstansok.json'),
    fetchJson<FegyverAlap[]>('tables/fegyverek.json'),
    fetchJson<TavfegyverAlap[]>('tables/tavfegyverek.json'),
    fetchJson<TavharcSzorzok>('tables/tavharc_szorzok.json'),
    fetchJson<{ Pajzs: string; TÉ: string; VÉ: string; Sebesség: string }[]>('tables/pajzsok.json'),
    fetchJson<KepzettsegKpEntry[]>('tables/kepzettseg_kp.json'),
    fetchJson<HarcmodorBonuszEntry[]>('tables/harcmodor_kepzettsegek_bonuszok.json'),
    fetchJson<KepzettsegDef[]>('tables/kepzettsegek.json'),
    fetchJson<Record<string, KiterjesztesEntry[]>>('tables/kiterjesztesek.json'),
    fetchJson<string[]>('tables/fajok.json'),
    fetchJson<string[]>('tables/primer_fortelyok.json'),
    fetchJson<Record<string, Record<string, [number, number]>>>('tables/faj_tulajdonsag_keretek.json'),
    fetchJson<FortelySummary[]>('tables/fortelyok.json'),
    fetchJson<TradicioEntry[]>('tables/tradiciok.json'),
    fetchJson<NyelvEntry[]>('tables/nyelvek.json'),
    fetchJson<TaktikaEntry[]>('tables/taktikak.json'),
    fetchJson<HarciHelyzetEntry[]>('tables/harci_helyzetek.json'),
    fetchJson<ManoverEntry[]>('tables/manoverek.json'),
    fetchJson<StatuszEntry[]>('tables/statuszok.json'),
    fetchJson<HatasOperator[]>('tables/hatas_operatorok.json'),
    fetchJson<EsemenyEntry[]>('tables/esemenyek.json'),
    fetchJson<HatterekData>('tables/hatterek.json'),
    fetchJson<{ rules: Rule[] }>('rules.json'),
    fetchJson<Karakter>('karakter/empty_karakter.json'),
    fetchJson<Karakter>('karakter/test_karakter2.json'),
  ]);

  const kepzettsegKp = kepzettsegKpRaw.map(e => ({
    szint: parseInt(e['Képzettség Szint']),
    kp: parseInt(e['KP igény']),
  }));

  const harcmodorBonusz = harcmodorRaw.map(e => ({
    szint: parseInt(e['Harcmodor Szint']),
    TÉ: parseInt(e['TÉ']),
    VÉ: parseInt(e['VÉ']),
    CÉ: parseInt(e['CÉ']),
  }));

  return { konstansok, fegyverek, tavfegyverek, tavharcSzorzok, pajzsok, kepzettsegKp, harcmodorBonusz, kepzettsegDefs, kiterjesztesek, fajNevek, primerFortelyok, fajKeretek, fortelySummaries, tradiciok, nyelvek, taktikak, harciHelyzetek, manoverek, statuszok, hatasOperatorok, esemenyek, hatterek, rules: rulesFile.rules, emptyKarakter, testKarakter };
}
