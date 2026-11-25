import type { EsemenyEntry, StatuszEntry } from './data-types';
import { clampEHSzint } from './dice';
import { gyűjtStátuszEffektek } from './effekt';

/** Státusz-hatás célok, amelyek próbára vonatkoznak (esemenyek.yaml, csoport: próba). */
const PRÓBA_CÉLOK = new Set([
  'képzettségpróba', 'tulajdonságpróba', 'szociális_próba', 'szellemi_próba', 'fizikai_próba', 'nem_harci_próba', 'érzék_próba',
]);

/**
 * A próba, amire a státusz-hatásokat szűrjük. Képzettségpróbánál `képzettség` adott; a `tulajdonság` a dobáshoz
 * VÁLASZTOTT Tulajdonság kulcsa (kisbetűs) - a fizikai / szellemi / érzék próba-kategória ezen múlik (md/010_11).
 */
interface PróbaKontextus {
  képzettség?: { kulcs: string; csoport: string };
  tulajdonság?: string;
}

/** A hatás érzéke: `alcél: érzék:<X>` (érzék_hátrány / érzék_kioltott `érzék` paramétere; Érzékvesztésnél a felvett alkategória). */
function hatásÉrzéke(e: { alcél?: string }): string | undefined {
  return e.alcél?.startsWith('érzék:') ? e.alcél.slice('érzék:'.length) : undefined;
}

interface PróbaEHEredmény {
  /** Összesített EH szint (clamp [-2, +2]) */
  szint: number;
  /** Automatikus kudarc (letilt mód) */
  tiltott: boolean;
  /** Debug: mely státuszok hatnak */
  források: string[];
  /** Helyzetfüggő (`szituációs`) Előny/Hátrány sorok - NEM számítanak a `szint`-be, a popupban kapcsolhatók (alapból ki). */
  szituációs: SzituációsEH[];
}

export interface SzituációsEH {
  /** Stabil kulcs a kapcsoló-állapothoz (forrás + érték + megjegyzés). */
  kulcs: string;
  címke: string;
  érték: number;
  megjegyzés?: string;
}

function calcEH(
  aktívStátuszok: string[], statuszDefs: StatuszEntry[], esemenyek: EsemenyEntry[], ctx: PróbaKontextus, érzék?: string,
): PróbaEHEredmény {
  let ehSzint = 0;
  let tiltott = false;
  const források: string[] = [];
  const szituációs: SzituációsEH[] = [];

  for (const e of gyűjtStátuszEffektek({ aktív_státuszok: aktívStátuszok }, { statuszok: statuszDefs })) {
    if (!hatásVonatkozik(e, esemenyek, ctx)) continue;
    const hÉrzék = hatásÉrzéke(e);
    if (hÉrzék && hÉrzék !== érzék) continue;
    // Felirat: „Név (alcím)" / „Név: Alkategória (alcím)"
    const címke = e.forrás.név.replace(/\(\d+\)$/, `(${e.forrás.alcím})`);
    if (e.mód === 'letilt') {
      tiltott = true;
      források.push(`${címke}: kudarc`);
    } else if ((e.mód === 'előny' || e.mód === 'hátrány') && e.szituációs) {
      szituációs.push({ kulcs: `${címke}|${e.érték}|${e.megjegyzés ?? ''}`, címke, érték: e.érték ?? 0, megjegyzés: e.megjegyzés });
    } else if (e.mód === 'előny' || e.mód === 'hátrány') {
      ehSzint += e.érték ?? 0;
      források.push(`${címke}: ${e.érték! > 0 ? '+' : ''}${e.érték}`);
    }
  }

  return { szint: clampEHSzint(ehSzint), tiltott, források, szituációs };
}

/**
 * Az aktív státuszok Előny/Hátrány + automatikus kudarc hatása egy Képzettségpróbára - a közös effekt-gyűjtőből
 * (`gyűjtStátuszEffektek`, §42), a próba-célt a képzettségre, a választott Tulajdonságra és az érzékre szűrve.
 *
 * @param aktívStátuszok - session.aktív_státuszok ("<id> (fok)" / "<id>: <alkategória> (fok)", engine/statusz.ts)
 * @param statuszDefs - GameData.statuszok
 * @param esemenyek - GameData.esemenyek (a próba-kategóriák definíciója, md/010_11)
 * @param képzettségNév - a próbázott képzettség hivatkozási KULCSa ("észlelés", "harcmodor/kardvívás")
 * @param képzettségCsoport - a próbázott képzettség csoportja
 * @param érzék - a próbához használt érzék (pl. „Látás"); alkategóriás státusz-hatás csak az illő érzékre él
 * @param tulajdonság - a dobáshoz választott Tulajdonság kulcsa; nélküle a fizikai / szellemi / érzék próba nem hat
 */
export function calcStátuszPróbaEH(
  aktívStátuszok: string[],
  statuszDefs: StatuszEntry[],
  esemenyek: EsemenyEntry[],
  képzettségNév: string,
  képzettségCsoport: string,
  érzék?: string,
  tulajdonság?: string,
): PróbaEHEredmény {
  return calcEH(aktívStátuszok, statuszDefs, esemenyek, { képzettség: { kulcs: képzettségNév, csoport: képzettségCsoport }, tulajdonság }, érzék);
}

/** Ugyanez Tulajdonságpróbára (a `tulajdonság` a próbázott Tulajdonság kulcsa). */
export function calcStátuszTulajdonságPróbaEH(
  aktívStátuszok: string[], statuszDefs: StatuszEntry[], esemenyek: EsemenyEntry[], tulajdonság: string, érzék?: string,
): PróbaEHEredmény {
  return calcEH(aktívStátuszok, statuszDefs, esemenyek, { tulajdonság }, érzék);
}

/**
 * A próbát érintő alkategóriás státusz-hatások érzékei (`érintett`) és a választható érzékek (`opciók`: az
 * érintett státuszok összes alkategóriája). Üres `érintett` → nincs érzék-választás a próbán.
 */
export function próbaÉrzékek(
  aktívStátuszok: string[], statuszDefs: StatuszEntry[], esemenyek: EsemenyEntry[],
  képzettségNév: string | null, képzettségCsoport: string, tulajdonság?: string,
): { opciók: string[]; érintett: string[] } {
  const ctx: PróbaKontextus = { ...(képzettségNév !== null ? { képzettség: { kulcs: képzettségNév, csoport: képzettségCsoport } } : {}), tulajdonság };
  const érintett = [...new Set(gyűjtStátuszEffektek({ aktív_státuszok: aktívStátuszok }, { statuszok: statuszDefs })
    .filter(e => hatásÉrzéke(e) && hatásVonatkozik(e, esemenyek, ctx))
    .map(e => hatásÉrzéke(e)!))];
  // A választható érzékek: az érintett alkategóriás státuszok összes alkategóriája + az `érzék:<X>` alcélos hatások érzéke.
  const opciók = [...new Set([...statuszDefs.filter(s => s.alkategóriák?.some(a => érintett.includes(a))).flatMap(s => s.alkategóriák ?? []), ...érintett])];
  return { opciók, érintett };
}

/** Eldönti, hogy egy státusz-hatás vonatkozik-e az adott próbára (md/010_11 Próba-kategóriák, esemenyek.yaml). */
function hatásVonatkozik(h: { cél: string; alcél?: string }, esemenyek: EsemenyEntry[], ctx: PróbaKontextus): boolean {
  const { cél } = h;
  if (!PRÓBA_CÉLOK.has(cél)) return false;
  const kp = ctx.képzettség;

  // Specifikus alcél (§42.4): csak arra az egy képzettségre / Tulajdonságra hat
  if (h.alcél) {
    const [pre, név] = h.alcél.split(':');
    // a képzettség-id a specializációkra is hat (képzettség:harcmodor → harcmodor/kardvívás)
    if (pre === 'képzettség') return !!kp && cél === 'képzettségpróba' && (név === kp.kulcs || kp.kulcs.startsWith(`${név}/`));
    if (pre === 'tulajdonság') {
      if (név !== ctx.tulajdonság) return false;
      if (cél === 'tulajdonságpróba') return !kp;
      // más próba-kategória (szociális_próba): a választott Tulajdonság szűkít, a kategória-illesztés lent (Trauma)
    } else if (pre !== 'érzék') return false;   // érzék:<X>: az érzék-szűrést a hívó végzi (hatásÉrzéke)
  }

  const def = esemenyek.find(e => e.id === cél);
  switch (cél) {
    case 'képzettségpróba': return !!kp;
    case 'tulajdonságpróba': return !kp;
    case 'szociális_próba': return !!kp && !!def?.képzettségek?.includes(kp.kulcs);
    case 'nem_harci_próba': return !!kp && !!kp.kulcs && !(def?.kizárt_csoportok ?? []).includes(kp.csoport);
    // fizikai_próba / szellemi_próba / érzék_próba: a dobás Tulajdonsága dönti el (Tulajdonság- és Képzettségpróbán is)
    default: return !!ctx.tulajdonság && !!def?.tulajdonságok?.includes(ctx.tulajdonság);
  }
}
