/**
 * Egységes effekt-modell - gyűjtő + kiértékelő (engine_spec §42, 3. fázis).
 *
 * A gyűjtő az aktív forrásokból (fortély + alapeset, taktika) EGY effekt-listát állít elő a közös
 * alakban ({cél, alcél?, mód, érték}); a feltételeket a gyűjtés során értékeli ki (a lista csak aktív
 * effekteket tartalmaz). A kiértékelő a §42.3 precedenciát a meglévő `alkalmazEffektek` motorral adja.
 *
 * A `calcFortelyMods` / `calcTaktikaMods` vékony burkolók e modul fölött (2026-10-16, 4b-1); regressziós háló:
 * `effekt.regresszio.test.ts` (a régi kézi implementációval rögzített snapshot).
 * A fájl végén: a tiltás-keret (§42.4) és a fegyver_override soronkénti kiértékelése (2. szelet).
 */
import { képzKulcs } from './azonosito';
import type { Karakter, Session, FegyverAlap } from './types';
import type { GameData, ExtraHatás } from './data-loader';
import { evaluateAlapesetek } from './alapeset';
import { alkalmazEffektek } from '../components/harc/extrak-effekt';
import { interpolateFokDef } from '../components/aktiv/taktika-helpers';
import { createFeltételEvaluator } from './feltetel-eval';
import { lookupFegyver } from './utils';
import { buildPajzsFegyverNév } from '../components/harc/shared';
import { extraFeltételTeljesül } from '../components/harc/extrak-info-calc';
import { clampEHSzint } from './dice';

export type EffektForrásTípus = 'fortély' | 'alapeset' | 'taktika' | 'helyzet' | 'státusz';

export interface Effekt {
  cél: string;
  alcél?: string;
  mód: string;
  érték?: number;
  /** `scaled` + fegyverfüggő forrás (pl. "erőbónusz"): az arány itt marad, a fegyver-szabály szoroz vele (§8, §16). */
  arányForrás?: string;
  arány?: number;
  /** A forrás-sor szöveges kontextusa (pl. „Fájdalomtűrés próba kínzás esetén") - szituációs megjelenítéshez. */
  megjegyzés?: string;
  /** Alkategóriás státusz (pl. „Érzékvesztés: Látás (2)") alkategóriája: a hatás csak erre az érzékre/fajtára él. */
  alkategória?: string;
  forrás: {
    típus: EffektForrásTípus; név: string;
    /** fortély-forrásnál a fortély-id */ id?: string;
    /** státusz-forrásnál a fok alcíme (pl. „Zavart") - feliratokhoz */ alcím?: string;
    /** fortély-forrásnál a többszörös példány eleme (pl. fegyver) */ elem?: string;
    /** fokozatos taktika választott foka */ fok?: number;
  };
}

/** Fortély-módosítók + alapesetek (fok 0) aktív effektjei. */
export function gyűjtFortélyEffektek(
  k: Karakter, session: Session, data: GameData,
  aktívFeltételek: Set<string>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Effekt[] {
  const ki: Effekt[] = [];
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.id === kf.id);
    const fokDef = def?.fokok.find(fd => fd.fok === kf.fok);
    if (!def || !fokDef?.módosítók) continue;
    const forrás = { típus: 'fortély' as const, név: def.név, id: def.id, ...(kf.elem ? { elem: kf.elem } : {}) };
    for (const mod of fokDef.módosítók) {
      if (!feltételTeljesül(mod.feltétel)) continue;
      // Session-toggle fortély (pl. Harci akrobatika): a TÉ/VÉ hatás csak bekapcsolt állapotban él.
      if (def.session_toggle && (mod.cél === 'TÉ' || mod.cél === 'VÉ')
        && !(session as unknown as Record<string, unknown>)[kf.id]) continue;
      const alap = { cél: mod.cél, ...(mod.alcél ? { alcél: mod.alcél } : {}), ...(mod.megjegyzés ? { megjegyzés: mod.megjegyzés } : {}), forrás };
      if (mod.mód === 'scaled' && mod.forrás === 'erőbónusz') {
        ki.push({ ...alap, mód: 'scaled', arányForrás: 'erőbónusz', arány: mod.arány });
      } else if (mod.mód === 'scaled' && mod.forrás) {
        // Képzettség-forrás: a gyűjtéskor feloldva (FLOOR), additív értékként megy tovább.
        const szint = k.képzettségek.find(kp => képzKulcs(kp) === mod.forrás)?.szint ?? 0;
        ki.push({ ...alap, mód: 'scaled', érték: Math.floor(szint * mod.arány) });
      } else {
        ki.push({ ...alap, mód: mod.mód, érték: mod.érték });
      }
    }
  }
  for (const ae of evaluateAlapesetek(data.fortelySummaries, k, session, aktívFeltételek)) {
    for (const mod of ae.módosítók) {
      if (!mod.mód) continue; // a séma szerint kötelező; típusban opcionális
      ki.push({ cél: mod.cél, mód: mod.mód, érték: mod.érték, forrás: { típus: 'alapeset', név: ae.fortély_név } });
    }
  }
  return ki;
}

/**
 * Collect "letilt" fortély modifiers that neutralize a specific taktika modifier.
 * Returns a Set of `"${taktika_feltétel_kulcs}|${cél}"` keys (e.g. "taktika:visszafogott|TÉ").
 * Number-independent: the taktika's contribution to that cél is dropped entirely.
 */
function collectTaktikaLetiltások(k: Karakter, data: GameData): Set<string> {
  const letiltva = new Set<string>();
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.id === kf.id);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.mód === 'letilt' && typeof mod.feltétel === 'string' && mod.feltétel.startsWith('taktika:')) {
        letiltva.add(`${mod.feltétel}|${mod.cél}`);
      }
    }
  }
  return letiltva;
}

const TAKTIKA_CÉLOK = ['KÉ', 'TÉ', 'VÉ', 'SP'] as const;

/**
 * Aktív taktikák effektjei, taktikánként (forrás-bontással): a numerikus `módosítók` (fokozatosnál a fok-interpoláció)
 * + a strukturált `hatások[]` (a taktika szintjén és fokozatosnál a választott fokén; teljesült feltétellel).
 * A fortély `letilt` (pl. Taktikafókusz: Visszafogott) a taktika adott célú hozzájárulását ejti. Forrás-specifikus
 * korlát (§42.7, B döntés): a taktikák VÉ-összege a `taktika_vé_eltolás_limit` közé szorul - túllépésnél egy
 * „Taktika VÉ-plafon" korrekciós `flat` sor kerül a végére (így az összeg a plafon, a bontás megmarad).
 */
export function gyűjtTaktikaEffektek(
  session: Session, data: GameData, k: Karakter | undefined,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Effekt[] {
  const letiltva = k ? collectTaktikaLetiltások(k, data) : new Set<string>();
  const ki: Effekt[] = [];
  let véÖsszeg = 0;
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    const forrás = { típus: 'taktika' as const, név: at.név, ...(def.fokozatos ? { fok: at.fok ?? 1 } : {}) };
    let mods: Partial<Record<string, number>> | undefined;
    if (def.fokozatos && def.fokok && at.fok != null) {
      mods = interpolateFokDef(def.fokok, at.fok, !!def.fortély_bővítés || !!def.skálázható) as typeof mods;
    } else if (def.módosítók) {
      mods = def.módosítók as typeof mods;
    }
    for (const cél of TAKTIKA_CÉLOK) {
      const v = mods?.[cél];
      if (!v || letiltva.has(`${def.feltétel_kulcs}|${cél}`)) continue;
      ki.push({ cél, mód: 'flat', érték: v, forrás });
      if (cél === 'VÉ') véÖsszeg += v;
    }
    const fokHatások = def.fokozatos ? def.fokok?.find(f => f.fok === (at.fok ?? 1))?.hatások ?? [] : [];
    for (const h of [...(def.hatások ?? []), ...fokHatások]) {
      if (h.feltétel && !feltételTeljesül(h.feltétel)) continue;
      ki.push({ cél: h.cél, mód: h.mód, érték: h.érték, ...(h.megjegyzés ? { megjegyzés: h.megjegyzés } : {}), forrás });
    }
  }
  const lim = data.konstansok.taktika_vé_eltolás_limit;
  const vágott = Math.max(-lim, Math.min(lim, véÖsszeg));
  if (vágott !== véÖsszeg) {
    ki.push({ cél: 'VÉ', mód: 'flat', érték: vágott - véÖsszeg, forrás: { típus: 'taktika', név: 'Taktika VÉ-plafon' } });
  }
  return ki;
}

/** Az aktív harci helyzetek `hatások[]`-a közös alakban (saját oldali hatások: pl. Takarásban VÉ +5, Meglepetés vé_csökkentés +2). */
export function gyűjtHelyzetEffektek(session: Session, data: GameData): Effekt[] {
  const ki: Effekt[] = [];
  for (const név of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(h => h.név === név);
    for (const h of def?.hatások ?? []) {
      ki.push({ cél: h.cél, ...(h.alcél ? { alcél: h.alcél } : {}), mód: h.mód, érték: h.érték,
        ...(h.megjegyzés ? { megjegyzés: h.megjegyzés } : {}), forrás: { típus: 'helyzet', név } });
    }
  }
  return ki;
}

/**
 * Az aktív státuszok (`"Név (fok)"` vagy `"Név: Alkategória (fok)"`, a StatuszPickerOverlay formátuma) adott
 * fokának `hatások[]`-a közös alakban. Alkategóriás státusznál a cél kanonikus marad, az `alkategória` mező
 * szűkíti (pl. Érzékvesztés: Látás → csak a látással végzett érzék-próbára).
 */
export function gyűjtStátuszEffektek(session: Pick<Session, 'aktív_státuszok'>, data: Pick<GameData, 'statuszok'>): Effekt[] {
  const ki: Effekt[] = [];
  for (const st of session.aktív_státuszok) {
    const m = st.match(/^(.+) \((\d+)\)$/);
    if (!m) continue;
    const [alapNév, al] = m[1].split(': ');
    const fokDef = data.statuszok.find(s => s.név === alapNév)?.fokok.find(f => f.fok === parseInt(m[2]));
    for (const h of fokDef?.hatások ?? []) {
      ki.push({ cél: h.cél, ...(h.alcél ? { alcél: h.alcél } : {}), ...(al ? { alkategória: al } : {}),
        mód: h.mód, érték: h.érték, ...(h.megjegyzés ? { megjegyzés: h.megjegyzés } : {}),
        forrás: { típus: 'státusz', név: st, alcím: fokDef!.alcím } });
    }
  }
  return ki;
}

/**
 * A karakter fortélyainak próba-bónuszai (`flat`, a megadott próba-célra, illeszkedő alcéllal) SZITUÁCIÓS
 * módosító-sorokként: a bónuszok a szabálykönyv szerint helyzethez kötöttek (pl. Fakír: kínzás), ezért a próba
 * popupban kapcsolhatók, nem automatikusak (2026-10-16). Felirat: „Fortély (fok): megjegyzés".
 */
export function fortélyPróbaBónuszok(
  k: Karakter, data: GameData, célok: string[], alcélIllik: (alcél: string) => boolean,
): { érték: number; leírás: string }[] {
  return gyűjtFortélyEffektek(k, k.session, data, new Set(), f => !f)
    .filter(e => e.forrás.típus === 'fortély' && e.mód === 'flat' && célok.includes(e.cél) && !!e.alcél && alcélIllik(e.alcél)
      && typeof e.érték === 'number')
    .map(e => {
      const fok = k.fortélyok.find(f => f.id === e.forrás.id)?.fok;
      return { érték: e.érték!, leírás: `${e.forrás.név} (${fok}): ${e.megjegyzés ?? ''}`.replace(/: $/, '') };
    });
}

/** Egy cél additív (`flat`) effektjei forrás-bontással - a popupok bontás-sorához. */
export function flatBontás(effektek: Effekt[], cél: string): { forrás: string; érték: number }[] {
  return effektek
    .filter(e => e.cél === cél && !e.alcél && e.mód === 'flat' && typeof e.érték === 'number' && e.érték !== 0)
    .map(e => ({ forrás: e.forrás.név, érték: e.érték! }));
}

/** Egy cél (+ opcionális alcél, pontos egyezés) értéke a §42.3 precedenciával. Nem-numerikus effekt kimarad. */
export function értékCélra(effektek: Effekt[], cél: string, bázis = 0, alcél?: string): number {
  const hatások = effektek
    .filter(e => e.cél === cél && (e.alcél ?? '') === (alcél ?? '') && typeof e.érték === 'number')
    .map(e => ({ cél: e.cél, mód: e.mód, érték: e.érték }));
  return alkalmazEffektek(bázis, hatások);
}

/**
 * Kocka-dimenzió (§42.3 5. lépés): az előny / hátrány / enyhít hatások előjeles összege, clamp [-2, +2]
 * (előny +, hátrány −, enyhít +). A `szöveges` és a többi mód nem számít.
 */
export function kockaSzint(hatások: { mód: string; érték?: number }[]): number {
  return clampEHSzint(hatások.reduce((s, h) => (KOCKA_SZINT_MÓDOK.has(h.mód) ? s + (h.érték ?? 0) : s), 0));
}
const KOCKA_SZINT_MÓDOK = new Set(['előny', 'hátrány', 'enyhít']);

/** Fegyverfüggő `scaled` arányok összege (pl. SP + "erőbónusz": a fegyver Erőlimitje szerint szorzódik). */
export function arányÖsszeg(effektek: Effekt[], cél: string, arányForrás: string): number {
  return effektek.reduce((s, e) => (e.cél === cél && e.arányForrás === arányForrás ? s + (e.arány ?? 0) : s), 0);
}

// ─── Tiltás-keret (engine_spec §42.4) ───────────────────────────────────────────────────────────
// Egy harci helyzet nevesített `tiltások[]`-a fegyverenként értékelődik ki (forrás: fegyver.fegyverhossz /
// fegyver.harcmodor). Feltételben `tiltás:<id>`-ként hivatkozható; a fegyver egy extrája
// `{cél: "tiltás:<id>", mód: letilt}` hatással feloldja (pl. Tőr, páncélszúró: pancelszuras_belharcban).

export interface AktívTiltás { id: string; leírás: string; helyzet: string }

/** A kézben lévő fegyverek: jobb kéz (vagy pajzs, index -2) + bal kéz kétkezes / hárító fogásnál. Üres = puszta kéz. */
function aktívFegyverDefek(k: Karakter, session: Session, data: GameData): FegyverAlap[] {
  const ki: FegyverAlap[] = [];
  const jobb = session.aktív_fegyver_index === -2
    ? lookupFegyver(data.fegyverek, buildPajzsFegyverNév(k) ?? '')
    : session.aktív_fegyver_index >= 0 ? lookupFegyver(data.fegyverek, k.fegyverek[session.aktív_fegyver_index]?.alap ?? '') : undefined;
  if (jobb) ki.push(jobb);
  if ((session.kétkezes_harc || session.fegyverfogás === 'fegyver_hárító') && session.aktív_fegyver_bal_index >= 0) {
    const bal = lookupFegyver(data.fegyverek, k.fegyverek[session.aktív_fegyver_bal_index]?.alap ?? '');
    if (bal) ki.push(bal);
  }
  return ki;
}

/**
 * A fegyver extrái közül azok hatásai, amelyek top-level feltétele BIZTOSAN teljesül (KM / bizonytalan → kimarad),
 * és amelyeknek nincs saját al-feltétele.
 */
function biztosExtraHatások(fDef: FegyverAlap, data: GameData, aktívFeltételek: Set<string>): ExtraHatás[] {
  // ponytail: a kontextus csak a feltétel-kulcsokat ismeri (harci_helyzet/taktika); fortély-/státusz-/aktor-feltételű
  // extra itt nem teljesül - ma egyetlen numerikus fegyver-extra sem ilyen. Ha lesz: a teljes ExtraKontextust kell átadni.
  const ctx = { aktívFeltételek, fortélyFokok: new Map<string, number>(), aktívStátuszok: new Set<string>() };
  const ki: ExtraHatás[] = [];
  for (const { id } of fDef.extrák ?? []) {
    const def = data.fegyverExtrák?.[id];
    if (!def?.hatás?.length) continue;
    if (!(def.feltétel ?? []).every(f => extraFeltételTeljesül(f, ctx) === true)) continue;
    ki.push(...def.hatás.filter(h => !h.feltétel));
  }
  return ki;
}

/** A fegyver extrái által feloldott tiltás-id-k. */
function feloldottTiltások(fDef: FegyverAlap, data: GameData, aktívFeltételek: Set<string>): Set<string> {
  const ki = new Set<string>();
  for (const h of biztosExtraHatások(fDef, data, aktívFeltételek)) {
    {
      if (h.mód === 'letilt' && h.cél.startsWith('tiltás:')) ki.add(h.cél.slice('tiltás:'.length));
    }
  }
  return ki;
}

/** Egy fegyverre ható aktív (nem feloldott) tiltások az aktív harci helyzetekből. */
export function tiltásokFegyverre(fDef: FegyverAlap, session: Session, data: GameData, aktívFeltételek: Set<string>): AktívTiltás[] {
  const helyzetek = session.aktív_helyzetek
    .map(n => data.harciHelyzetek.find(d => d.név === n))
    .filter(h => h?.tiltások?.length);
  if (!helyzetek.length) return [];
  const ctx = new Map([['fegyver.fegyverhossz', fDef.fegyverhossz]]);
  const sctx = new Map([['fegyver.harcmodor', data.konstansok.fegyver_kategória_harcmodor[fDef.kategória] ?? 'közelharc']]);
  const { feltételTeljesül } = createFeltételEvaluator(new Set(), session, new Map(), ctx, sctx);
  const feloldott = feloldottTiltások(fDef, data, aktívFeltételek);
  const ki: AktívTiltás[] = [];
  for (const h of helyzetek) {
    for (const t of h!.tiltások!) {
      if (!feloldott.has(t.id) && feltételTeljesül(t.feltétel)) ki.push({ id: t.id, leírás: t.leírás, helyzet: h!.név });
    }
  }
  return ki;
}

/** A kézben lévő fegyverek tiltásainak uniója (id szerint egyedi) - a nem fegyversor-szintű feltételekhez (pl. fortély). */
export function aktívTiltások(k: Karakter, session: Session, data: GameData, aktívFeltételek: Set<string>): AktívTiltás[] {
  const ki = new Map<string, AktívTiltás>();
  for (const fDef of aktívFegyverDefek(k, session, data)) {
    for (const t of tiltásokFegyverre(fDef, session, data, aktívFeltételek)) ki.set(t.id, t);
  }
  return [...ki.values()];
}

const FEGYVER_KOMPONENS = 'felszerelés:fegyver';

/**
 * EGY fegyverre ható alapérték-cserék (§42.3 bázis-csere, alcél felszerelés:fegyver): cél → új alapérték.
 * Források sorrendben (több override: az utolsó): a helyzetek `fegyver_override`-ja, majd a fegyver biztosan aktív
 * extrái (pl. Puszta kéz: puszta_kez_belharcban). A helyzet-feltétel a fegyver SAJÁT tiltásaival értékelődik ki
 * (a bemenet esetleges globális `tiltás:` kulcsait eldobja) - így soronként / kezenként helyes.
 */
export function fegyverOverrideÉrtékek(fDef: FegyverAlap, session: Session, data: GameData, aktívFeltételek: Set<string>): Map<string, number> {
  const ki = new Map<string, number>();
  const helyzetek = session.aktív_helyzetek.map(n => data.harciHelyzetek.find(d => d.név === n)).filter(h => h?.fegyver_override);
  const sor = new Set([...aktívFeltételek].filter(f => !f.startsWith('tiltás:')));
  for (const t of tiltásokFegyverre(fDef, session, data, aktívFeltételek)) sor.add(`tiltás:${t.id}`);
  const { feltételTeljesül } = createFeltételEvaluator(sor, session, new Map(), new Map(), new Map());
  for (const h of helyzetek) {
    if (!feltételTeljesül(h!.fegyver_override!.feltétel)) continue;
    for (const m of h!.fegyver_override!.módosítók) {
      if (m.mód === 'override' && m.alcél === FEGYVER_KOMPONENS) ki.set(m.cél, m.érték);
    }
  }
  for (const h of biztosExtraHatások(fDef, data, aktívFeltételek)) {
    if (h.mód === 'override' && h.alcél === FEGYVER_KOMPONENS && typeof h.érték === 'number') ki.set(h.cél, h.érték);
  }
  return ki;
}

const FEGYVER_JÁRULÉK_KOMPONENS = 'felszerelés:fegyver_járulék';

/**
 * EGY fegyverre ható, a fegyver TÁRGY-járulékára (alap hossz-járulék + Mesterfegyver + Idea) vonatkozó
 * szorzó/override hatások célonként (TÉ/VÉ), a biztosan aktív extrákból (pl. Beszorítható enyhén/nagyon).
 * A hívó (fegyver-calc) ezt a fegyver-járulék rész-összegre alkalmazza post-lépésben - a karakter-rész
 * (bázis + tulajdonságok + HM + harcmodor-szint + harci fortélyok) érintetlen marad. L. md/065_03_03 „Beszorítva".
 */
export function fegyverJárulékHatások(fDef: FegyverAlap, data: GameData, aktívFeltételek: Set<string>): Map<string, ExtraHatás[]> {
  const ki = new Map<string, ExtraHatás[]>();
  for (const h of biztosExtraHatások(fDef, data, aktívFeltételek)) {
    if (h.alcél !== FEGYVER_JÁRULÉK_KOMPONENS) continue;
    if (h.mód !== 'szorzó' && h.mód !== 'override') continue;
    if (typeof h.érték !== 'number') continue;
    (ki.get(h.cél) ?? ki.set(h.cél, []).get(h.cél)!).push(h);
  }
  return ki;
}
