/**
 * Fegyver-extrák (`fegyver_extrak.json`) futásidejű állapot-kiértékelése az „Extrák" gombhoz.
 *
 * Az egységes effekt-modell (engine_spec §42) 2. fázisának megjelenítő szelete: az `extrak.yaml`
 * feltétel→hatás bejegyzéseit listázza és jelzi, melyik AKTÍV a jelen harci kontextusban. A
 * numerikus effekt-alkalmazás (a hatás tényleges beszámítása a TÉ/VÉ/SP/SFÉ-be, §42.3 precedencia)
 * a 3. fázis - ez a modul CSAK állapotot állapít meg + olvasható összefoglalót ad.
 *
 * A feltétel-típusok két csoportba esnek:
 *  - KIÉRTÉKELHETŐ a jelen contextből: harci_helyzet, taktika, fortély, státusz, aktor, forgatás,
 *    cél_páncél (ha a hívó megadta a választott páncélosztályt).
 *  - KM-DÖNTÉSES / narratív: narratív, manőver_állapot, cél_felszereles,
 *    ellenfél_fegyver_sebzésjelleg + minden `szöveges` mód → a KM/játékos dönt, nem auto.
 */

import type { ExtraFeltétel, ExtraHatás, FegyverExtraDef } from '../../engine/data-types';

export type ExtraStátusz = 'aktív' | 'inaktív' | 'km';

export interface ExtraInfoTétel {
  id: string;
  név: string;
  leírás: string;
  státusz: ExtraStátusz;
  /** Ember-olvasható hatás-összefoglaló (pl. "SP +3", "VÉ:0", "SFÉ ×2", "manőver: letilt"). */
  hatásSzöveg: string;
}

/** A jelen harci kontextus, amiből az auto-kiértékelhető feltételek eldőlnek. */
export interface ExtraKontextus {
  /** Aktív feltétel-kulcsok Set-je (`harci_helyzet:id`, `taktika:id`, `fegyver_kategória:id`, …). */
  aktívFeltételek: Set<string>;
  /** Karakter fortélyai (név → fok) - a `fortély` típusú feltételhez. */
  fortélyFokok: Map<string, number>;
  /** Aktív státusz-nevek - a `státusz` típusú feltételhez (a session tier-t nem tárol). */
  aktívStátuszok: Set<string>;
  /** Az aktív fegyvermód aktora (pl. "vágóél-íves-rövid") - az `aktor` típusú feltételhez. */
  aktorNév?: string;
  /** Az aktív mód forgatása ("egykezes"/"kétkezes") - a `forgatás` típusú feltételhez. */
  forgatás?: string;
  /** A durva cél-páncél kategória, ha a hívó (Sebzés popup) már választott: "vérttelen"|"páncélos". */
  célPáncélKategória?: 'vérttelen' | 'páncélos';
}

/** Egyetlen feltétel kiértékelése: teljesül / nem / KM-döntés (nem auto-eldönthető). */
function feltételStátusz(f: ExtraFeltétel, ctx: ExtraKontextus): ExtraStátusz {
  switch (f.típus) {
    case 'harci_helyzet':
      return ctx.aktívFeltételek.has(`harci_helyzet:${f.id ?? f.érték}`) ? 'aktív' : 'inaktív';
    case 'taktika':
      return ctx.aktívFeltételek.has(`taktika:${f.id ?? f.érték}`) ? 'aktív' : 'inaktív';
    case 'fortély': {
      const fok = ctx.fortélyFokok.get(String(f.érték ?? f.név));
      // A `név`/`érték` a fortély neve; küszöb-fok nélkül a puszta felvétel is "aktív".
      return fok != null && fok > 0 ? 'aktív' : 'inaktív';
    }
    case 'státusz':
      return ctx.aktívStátuszok.has(String(f.név ?? f.érték)) ? 'aktív' : 'inaktív';
    case 'aktor':
      // Részleges egyezés: az aktor-token szerepel-e az aktív mód aktor-nevében (pl. "pengehegy").
      return ctx.aktorNév && ctx.aktorNév.includes(String(f.érték)) ? 'aktív' : 'inaktív';
    case 'forgatás':
      return ctx.forgatás === String(f.érték) ? 'aktív' : 'inaktív';
    case 'cél_páncél':
      if (!ctx.célPáncélKategória) return 'km'; // még nincs választva ellenfél-páncél
      return ctx.célPáncélKategória === String(f.érték) ? 'aktív' : 'inaktív';
    // Nem auto-eldönthető: narratív, manőver_állapot, cél_felszereles, ellenfél_fegyver_sebzésjelleg.
    default:
      return 'km';
  }
}

/** Több feltétel (ÉS-kapcsolat) aggregált státusza. */
function feltételekStátusz(feltételek: ExtraFeltétel[] | undefined, ctx: ExtraKontextus): ExtraStátusz {
  if (!feltételek?.length) return 'aktív'; // feltétel nélküli extra = mindig érvényes
  const részek = feltételek.map(f => feltételStátusz(f, ctx));
  if (részek.some(r => r === 'inaktív')) return 'inaktív'; // egy hamis ÉS-tag → az egész inaktív
  if (részek.some(r => r === 'km')) return 'km';           // nincs hamis, de van bizonytalan → KM
  return 'aktív';
}

/** Egyetlen hatás olvasható összefoglalója (numerikus alkalmazás nélkül). */
function hatásSzöveg(h: ExtraHatás): string {
  const cél = h.cél;
  switch (h.mód) {
    case 'flat': return `${cél} ${(h.érték ?? 0) >= 0 ? '+' : ''}${h.érték}`;
    case 'szorzó': return `${cél} ×${h.érték}`;
    case 'override': return `${cél}:${h.érték}`;
    case 'scaled': return `${cél} +arányos`;
    case 'max_limit': return `${cél} ≤ ${h.érték}`;
    case 'letilt': return `${cél}: letilt`;
    case 'szöveges': return `${cél} (KM)`;
    default: return `${cél} ${h.mód}`;
  }
}

/** Egy extra hatásainak összevont szövege. */
function hatásokSzöveg(hatások: ExtraHatás[] | undefined): string {
  if (!hatások?.length) return '';
  return hatások.map(hatásSzöveg).join(', ');
}

/**
 * Az aktív fegyver extráit info-tételekké alakítja, státusz-jelzéssel (aktív/inaktív/KM).
 * Pure - a megjelenítő komponens csak rendereli az eredményt.
 */
export function extrakInfoTételek(
  fegyverExtrák: { id: string }[] | undefined,
  extraDefs: Record<string, FegyverExtraDef> | undefined,
  ctx: ExtraKontextus,
): ExtraInfoTétel[] {
  if (!fegyverExtrák?.length || !extraDefs) return [];
  const ki: ExtraInfoTétel[] = [];
  for (const { id } of fegyverExtrák) {
    const def = extraDefs[id];
    if (!def) continue;
    // Tisztán `szöveges` hatású extra (pl. beakadas_kockazat, onsebzes_kockazat) → mindig KM-döntés.
    const csakSzöveges = !!def.hatás?.length && def.hatás.every(h => h.mód === 'szöveges');
    const státusz: ExtraStátusz = csakSzöveges ? 'km' : feltételekStátusz(def.feltétel, ctx);
    ki.push({
      id: def.id,
      név: def.név,
      leírás: (def.leírás ?? '').trim(),
      státusz,
      hatásSzöveg: hatásokSzöveg(def.hatás),
    });
  }
  return ki;
}
