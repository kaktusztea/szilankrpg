import type { StatuszEntry } from './data-types';
import { clampEHSzint } from './dice';
import { gyűjtStátuszEffektek } from './effekt';

/**
 * Próba cél → képzettség csoport mapping.
 * Ha a cél specifikusabb (szociális, szellemi, fizikai, érzék), az csak bizonyos csoportokra hat.
 */
const CÉL_CSOPORT_MAP: Record<string, string[]> = {
  képzettségpróba: [], // üres = minden csoportra hat
  szociális_próba: ['világi'], // Befolyásolás, Etikett, Emberismeret
  szellemi_próba: ['tudományos', 'művészeti', 'misztikus'],
  fizikai_próba: ['fizikai', 'alvilági'],
  érzék_próba: [], // speciális: csak Észlelés
};

/** Szociális képzettségek (a világi csoportból nem mind szociális) */
const SZOCIÁLIS_NEVEK = new Set(['befolyásolás', 'etikett', 'emberismeret']);   // képzettség-id-k

/** Érzék képzettségek */
const ÉRZÉK_NEVEK = new Set(['észlelés']);   // képzettség-id

interface PróbaEHEredmény {
  /** Összesített EH szint (clamp [-2, +2]) */
  szint: number;
  /** Automatikus kudarc (letilt mód) */
  tiltott: boolean;
  /** Debug: mely státuszok hatnak */
  források: string[];
}

/**
 * Kiszámolja az aktív státuszok Előny/Hátrány hatását egy adott képzettségpróbára - a közös effekt-gyűjtőből
 * (`gyűjtStátuszEffektek`, §42), a próba-célt a képzettség-csoportra / -id-re szűrve.
 *
 * @param aktívStátuszok - session.aktív_státuszok tömb ("Név (fok)" / "Név: Alkategória (fok)" formátum)
 * @param statuszDefs - GameData.statuszok (StatuszEntry[])
 * @param képzettségNév - a próbázott képzettség hivatkozási KULCSa ("észlelés", "harcmodor/kardvívás"; 2026-10-17 óta)
 * @param képzettségCsoport - a próbázott képzettség csoportja
 * @param érzék - a próbához használt érzék (pl. „Látás"); alkategóriás státusz-hatás csak az illő érzékre él
 */
export function calcStátuszPróbaEH(
  aktívStátuszok: string[],
  statuszDefs: StatuszEntry[],
  képzettségNév: string,
  képzettségCsoport: string,
  érzék?: string,
): PróbaEHEredmény {
  let ehSzint = 0;
  let tiltott = false;
  const források: string[] = [];

  for (const e of gyűjtStátuszEffektek({ aktív_státuszok: aktívStátuszok }, { statuszok: statuszDefs })) {
    if (!hatásVonatkozik(e, képzettségNév, képzettségCsoport)) continue;
    if (e.alkategória && e.alkategória !== érzék) continue;
    // Felirat: „Név (alcím)" / „Név: Alkategória (alcím)"
    const címke = e.forrás.név.replace(/\(\d+\)$/, `(${e.forrás.alcím})`);
    if (e.mód === 'letilt') {
      tiltott = true;
      források.push(`${címke}: kudarc`);
    } else if (e.mód === 'előny' || e.mód === 'hátrány') {
      ehSzint += e.érték ?? 0;
      források.push(`${címke}: ${e.érték! > 0 ? '+' : ''}${e.érték}`);
    }
  }

  return {
    szint: clampEHSzint(ehSzint),
    tiltott,
    források,
  };
}

/**
 * A próbát érintő alkategóriás státusz-hatások érzékei (`érintett`) és a választható érzékek (`opciók`: az
 * érintett státuszok összes alkategóriája). Üres `érintett` → nincs érzék-választás a próbán.
 */
export function próbaÉrzékek(
  aktívStátuszok: string[], statuszDefs: StatuszEntry[], képzettségNév: string, képzettségCsoport: string,
): { opciók: string[]; érintett: string[] } {
  const érintett = [...new Set(gyűjtStátuszEffektek({ aktív_státuszok: aktívStátuszok }, { statuszok: statuszDefs })
    .filter(e => e.alkategória && hatásVonatkozik(e, képzettségNév, képzettségCsoport))
    .map(e => e.alkategória!))];
  const opciók = [...new Set(statuszDefs.filter(s => s.alkategóriák?.some(a => érintett.includes(a))).flatMap(s => s.alkategóriák ?? []))];
  return { opciók, érintett };
}

/** Eldönti, hogy egy hatás vonatkozik-e az adott képzettségre. */
function hatásVonatkozik(h: { cél: string; alcél?: string }, képzettségNév: string, képzettségCsoport: string): boolean {
  const cél = h.cél;

  // Nem próba-jellegű cél
  if (!(cél in CÉL_CSOPORT_MAP)) return false;

  // Specifikus alcél ("képzettség:<név>", §42.4): csak arra az egy képzettségre hat
  if (h.alcél) {
    return h.alcél === `képzettség:${képzettségNév}`;
  }

  // Generikus cél-ek
  if (cél === 'képzettségpróba') return true;

  if (cél === 'szociális_próba') {
    return SZOCIÁLIS_NEVEK.has(képzettségNév);
  }

  if (cél === 'érzék_próba') {
    return ÉRZÉK_NEVEK.has(képzettségNév);
  }

  const csoportok = CÉL_CSOPORT_MAP[cél];
  if (csoportok && csoportok.length > 0) {
    return csoportok.includes(képzettségCsoport);
  }

  return false;
}
