/**
 * Egységes effekt-modell - gyűjtő + kiértékelő (engine_spec §42, 3. fázis).
 *
 * A gyűjtő az aktív forrásokból (fortély + alapeset, taktika) EGY effekt-listát állít elő a közös
 * alakban ({cél, alcél?, mód, érték}); a feltételeket a gyűjtés során értékeli ki (a lista csak aktív
 * effekteket tartalmaz). A kiértékelő a §42.3 precedenciát a meglévő `alkalmazEffektek` motorral adja.
 *
 * Átmeneti állapot (3. fázis, 1. szelet): a régi `calcFortelyMods` / `calcTaktikaMods` még él, az
 * `effekt.parity.test.ts` méri hozzájuk ezt a modult. A fogyasztók szeletenként állnak át, a végén a két régi
 * függvény törlődik. A helyzet / státusz / extra forrás a saját szeletében kerül be (YAGNI: amíg nincs fogyasztója).
 */
import type { Karakter, Session } from './types';
import type { GameData } from './data-loader';
import { evaluateAlapesetek } from './alapeset';
import { alkalmazEffektek } from '../components/harc/extrak-effekt';
import { interpolateFokDef } from '../components/aktiv/taktika-helpers';
import { collectTaktikaLetiltások } from '../components/harc/taktika-calc';

export type EffektForrásTípus = 'fortély' | 'alapeset' | 'taktika';

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
