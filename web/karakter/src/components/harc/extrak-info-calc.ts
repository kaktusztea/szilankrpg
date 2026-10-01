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
  /** Az aktív manőver id-je (`session.aktív_manőver`) - a hatás `feltétel: "manőver:<id>"` al-feltételéhez. */
  aktívManőver?: string;
  /** A Manőver ablak módja (aktív = én hajtom végre, passzív = ellenem irányul) - a `manőver_állapot` feltételhez. */
  manőverÁllapot?: 'aktív' | 'passzív';
}

/**
 * Egyetlen feltétel logikai kiértékelése: teljesül (true) / nem (false) / nem auto-eldönthető
 * (undefined = KM-döntés). A `manőverReleváns` a hatás-al-feltételbeli manőver aktív állapota.
 */
export function extraFeltételTeljesül(f: ExtraFeltétel, ctx: ExtraKontextus, manőverReleváns = false): boolean | undefined {
  switch (f.típus) {
    case 'harci_helyzet':
      return ctx.aktívFeltételek.has(`harci_helyzet:${f.id ?? f.érték}`);
    case 'taktika':
      return ctx.aktívFeltételek.has(`taktika:${f.id ?? f.érték}`);
    case 'fortély': {
      const fok = ctx.fortélyFokok.get(String(f.érték ?? f.név));
      // A `név`/`érték` a fortély neve; küszöb-fok nélkül a puszta felvétel is teljesül.
      return fok != null && fok > 0;
    }
    case 'státusz':
      return ctx.aktívStátuszok.has(String(f.név ?? f.érték));
    case 'aktor':
      // Részleges egyezés: az aktor-token szerepel-e az aktív mód aktor-nevében (pl. "pengehegy").
      return !!ctx.aktorNév && ctx.aktorNév.includes(String(f.érték));
    case 'forgatás':
      return ctx.forgatás === String(f.érték);
    case 'cél_páncél':
      if (!ctx.célPáncélKategória) return undefined; // még nincs választva ellenfél-páncél
      return ctx.célPáncélKategória === String(f.érték);
    case 'manőver_állapot':
      // A Manőver ablak módja adja (aktív = én hajtom végre, passzív = ellenem irányul). Ha nincs
      // megadva (nem manőver-context, pl. Sebzés popup), a manőver-al-feltétel egyezése a fallback.
      if (ctx.manőverÁllapot != null) return ctx.manőverÁllapot === String(f.érték);
      return manőverReleváns ? true : undefined;
    // Nem auto-eldönthető: narratív, cél_felszereles, ellenfél_fegyver_sebzésjelleg.
    default:
      return undefined;
  }
}

/** Egyetlen feltétel kiértékelése státuszként (aktív/inaktív/KM). */
function feltételStátusz(f: ExtraFeltétel, ctx: ExtraKontextus, manőverReleváns: boolean): ExtraStátusz {
  const t = extraFeltételTeljesül(f, ctx, manőverReleváns);
  return t === undefined ? 'km' : t ? 'aktív' : 'inaktív';
}

/** Több feltétel (ÉS-kapcsolat) aggregált státusza. */
function feltételekStátusz(feltételek: ExtraFeltétel[] | undefined, ctx: ExtraKontextus, manőverReleváns: boolean): ExtraStátusz {
  if (!feltételek?.length) return 'aktív'; // feltétel nélküli extra = mindig érvényes
  const részek = feltételek.map(f => feltételStátusz(f, ctx, manőverReleváns));
  if (részek.some(r => r === 'inaktív')) return 'inaktív'; // egy hamis ÉS-tag → az egész inaktív
  if (részek.some(r => r === 'km')) return 'km';           // nincs hamis, de van bizonytalan → KM
  return 'aktív';
}

/** Van-e a hatások közt az aktív manőverre illeszkedő `feltétel: "manőver:<id>"` al-feltétel? */
function manőverreIllik(def: FegyverExtraDef, aktívManőver: string | undefined): boolean {
  if (!aktívManőver) return false;
  const kulcs = `manőver:${aktívManőver}`;
  return !!def.hatás?.some(h => h.feltétel === kulcs);
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
    // Az aktív manőverhez kapcsolt extra (hatás-al-feltétel: "manőver:<aktív>") → a manőver-állapot
    // teljesültnek vehető, az extra a manőver alatt aktív.
    const manőverReleváns = manőverreIllik(def, ctx.aktívManőver);
    const státusz: ExtraStátusz = csakSzöveges ? 'km' : feltételekStátusz(def.feltétel, ctx, manőverReleváns);
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
