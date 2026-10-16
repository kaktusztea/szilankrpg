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
import type { Karakter, Session, FegyverAlap } from './types';
import type { GameData, ExtraHatás } from './data-loader';
import { evaluateAlapesetek } from './alapeset';
import { alkalmazEffektek } from '../components/harc/extrak-effekt';
import { interpolateFokDef } from '../components/aktiv/taktika-helpers';
import { createFeltételEvaluator } from './feltetel-eval';
import { lookupFegyver } from './utils';
import { buildPajzsFegyverNév } from '../components/harc/shared';
import { extraFeltételTeljesül } from '../components/harc/extrak-info-calc';

export type EffektForrásTípus = 'fortély' | 'alapeset' | 'taktika' | 'helyzet' | 'státusz';

export interface Effekt {
  cél: string;
  alcél?: string;
  mód: string;
  érték?: number;
  /** `scaled` + fegyverfüggő forrás (pl. "erőbónusz"): az arány itt marad, a fegyver-szabály szoroz vele (§8, §16). */
  arányForrás?: string;
  arány?: number;
  forrás: { típus: EffektForrásTípus; név: string };
}

/** Fortély-módosítók + alapesetek (fok 0) aktív effektjei. */
export function gyűjtFortélyEffektek(
  k: Karakter, session: Session, data: GameData,
  aktívFeltételek: Set<string>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Effekt[] {
  const ki: Effekt[] = [];
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    const fokDef = def?.fokok.find(fd => fd.fok === kf.fok);
    if (!def || !fokDef?.módosítók) continue;
    const forrás = { típus: 'fortély' as const, név: kf.név };
    for (const mod of fokDef.módosítók) {
      if (!feltételTeljesül(mod.feltétel)) continue;
      // Session-toggle fortély (pl. Harci akrobatika): a TÉ/VÉ hatás csak bekapcsolt állapotban él.
      if (def.session_toggle && (mod.cél === 'TÉ' || mod.cél === 'VÉ')
        && !(session as unknown as Record<string, unknown>)[kf.név.toLowerCase().replace(/ /g, '_')]) continue;
      const alap = { cél: mod.cél, ...(mod.alcél ? { alcél: mod.alcél } : {}), forrás };
      if (mod.mód === 'scaled' && mod.forrás === 'erőbónusz') {
        ki.push({ ...alap, mód: 'scaled', arányForrás: 'erőbónusz', arány: mod.arány });
      } else if (mod.mód === 'scaled' && mod.forrás) {
        // Képzettség-forrás: a gyűjtéskor feloldva (FLOOR), additív értékként megy tovább.
        const szint = k.képzettségek.find(kp => kp.név.toLowerCase() === mod.forrás)?.szint ?? 0;
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
export function collectTaktikaLetiltások(k: Karakter, data: GameData): Set<string> {
  const letiltva = new Set<string>();
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
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
 * Aktív taktikák effektjei: a numerikus `módosítók` (fokozatosnál a fok-interpoláció) + a strukturált
 * `hatások[]` (teljesült feltétellel). A fortély `letilt` (pl. Taktikafókusz: Visszafogott) a taktika adott
 * célú hozzájárulását ejti. Forrás-specifikus korlát (§42.7, B döntés): a taktikák VÉ-összege a
 * `taktika_vé_eltolás_limit` közé szorul - ezért a numerikus módosítók célonként EGY összevont effektként jönnek.
 */
export function gyűjtTaktikaEffektek(
  session: Session, data: GameData, k: Karakter | undefined,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Effekt[] {
  const letiltva = k ? collectTaktikaLetiltások(k, data) : new Set<string>();
  const összeg: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  const nevek: string[] = [];
  const ki: Effekt[] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    nevek.push(at.név);
    let mods: Partial<Record<string, number>> | undefined;
    if (def.fokozatos && def.fokok && at.fok != null) {
      mods = interpolateFokDef(def.fokok, at.fok, !!def.fortély_bővítés || !!def.skálázható) as typeof mods;
    } else if (def.módosítók) {
      mods = def.módosítók as typeof mods;
    }
    for (const cél of TAKTIKA_CÉLOK) {
      const v = mods?.[cél];
      if (v && !letiltva.has(`${def.feltétel_kulcs}|${cél}`)) összeg[cél] += v;
    }
    for (const h of def.hatások ?? []) {
      if (h.feltétel && !feltételTeljesül(h.feltétel)) continue;
      ki.push({ cél: h.cél, mód: h.mód, érték: h.érték, forrás: { típus: 'taktika', név: at.név } });
    }
  }
  const lim = data.konstansok.taktika_vé_eltolás_limit;
  összeg.VÉ = Math.max(-lim, Math.min(lim, összeg.VÉ));
  const forrás = { típus: 'taktika' as const, név: nevek.join(', ') };
  for (const cél of TAKTIKA_CÉLOK) if (összeg[cél]) ki.push({ cél, mód: 'flat', érték: összeg[cél], forrás });
  return ki;
}

/** Az aktív harci helyzetek `hatások[]`-a közös alakban (saját oldali hatások: pl. Takarásban VÉ +5, Meglepetés vé_csökkentés +2). */
export function gyűjtHelyzetEffektek(session: Session, data: GameData): Effekt[] {
  const ki: Effekt[] = [];
  for (const név of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(h => h.név === név);
    for (const h of def?.hatások ?? []) {
      ki.push({ cél: h.cél, ...(h.alcél ? { alcél: h.alcél } : {}), mód: h.mód, érték: h.érték, forrás: { típus: 'helyzet', név } });
    }
  }
  return ki;
}

/**
 * Az aktív státuszok (`"Név (fok)"` vagy `"Név: alkategória (fok)"`) adott fokának `hatások[]`-a közös alakban.
 * Alkategóriás státusznál a cél kiegészül (pl. `érzék_próba (látás)`), mint az Aktív fül Hatás-poolban.
 */
export function gyűjtStátuszEffektek(session: Session, data: GameData): Effekt[] {
  const ki: Effekt[] = [];
  for (const st of session.aktív_státuszok) {
    const m = st.match(/^(.+) \((\d+)\)$/);
    if (!m) continue;
    const [alapNév, al] = m[1].split(': ');
    const fokDef = data.statuszok.find(s => s.név === alapNév)?.fokok.find(f => f.fok === parseInt(m[2]));
    for (const h of fokDef?.hatások ?? []) {
      ki.push({ cél: al ? `${h.cél} (${al.toLowerCase()})` : h.cél, ...(h.alcél ? { alcél: h.alcél } : {}),
        mód: h.mód, érték: h.érték, forrás: { típus: 'státusz', név: st } });
    }
  }
  return ki;
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
export function aktívFegyverDefek(k: Karakter, session: Session, data: GameData): FegyverAlap[] {
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
  const sctx = new Map([['fegyver.harcmodor', data.konstansok.fegyver_kategória_harcmodor[fDef.kategória] ?? 'Közelharc']]);
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
