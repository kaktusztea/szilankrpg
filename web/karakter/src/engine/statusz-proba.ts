import type { StatuszEntry, StatuszHatas } from './data-types';

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
const SZOCIÁLIS_NEVEK = new Set(['Befolyásolás', 'Etikett', 'Emberismeret']);

/** Érzék képzettségek */
const ÉRZÉK_NEVEK = new Set(['Észlelés']);

export interface PróbaEHEredmény {
  /** Összesített EH szint (clamp [-2, +2]) */
  szint: number;
  /** Automatikus kudarc (letilt operátor) */
  tiltott: boolean;
  /** Debug: mely státuszok hatnak */
  források: string[];
}

/**
 * Kiszámolja az aktív státuszok Előny/Hátrány hatását egy adott képzettségpróbára.
 *
 * @param aktívStátuszok - session.aktív_státuszok tömb ("Név (fok)" formátum)
 * @param statuszDefs - GameData.statuszok (StatuszEntry[])
 * @param képzettségNév - a próbázott képzettség neve
 * @param képzettségCsoport - a próbázott képzettség csoportja
 */
export function calcStátuszPróbaEH(
  aktívStátuszok: string[],
  statuszDefs: StatuszEntry[],
  képzettségNév: string,
  képzettségCsoport: string,
): PróbaEHEredmény {
  let ehSzint = 0;
  let tiltott = false;
  const források: string[] = [];

  for (const aktív of aktívStátuszok) {
    // Parse "Név (fok)" vagy "Név (fok) alkategória"
    const m = aktív.match(/^(.+?)\s*\((\d+)\)/);
    if (!m) continue;
    const [, név, fokStr] = m;
    const fok = parseInt(fokStr, 10);

    const def = statuszDefs.find(s => s.név === név);
    if (!def) continue;
    const fokDef = def.fokok.find(f => f.fok === fok);
    if (!fokDef?.hatások) continue;

    for (const h of fokDef.hatások) {
      if (!hatásVonatkozik(h, képzettségNév, képzettségCsoport)) continue;

      if (h.operátor === 'letilt') {
        tiltott = true;
        források.push(`${név} (${fokDef.alcím}): kudarc`);
      } else if (h.operátor === 'előny' || h.operátor === 'hátrány') {
        ehSzint += h.érték ?? 0;
        források.push(`${név} (${fokDef.alcím}): ${h.érték! > 0 ? '+' : ''}${h.érték}`);
      }
    }
  }

  return {
    szint: Math.max(-2, Math.min(2, ehSzint)),
    tiltott,
    források,
  };
}

/** Eldönti, hogy egy hatás vonatkozik-e az adott képzettségre. */
function hatásVonatkozik(h: StatuszHatas, képzettségNév: string, képzettségCsoport: string): boolean {
  const cél = h.cél;

  // Nem próba-jellegű cél
  if (!(cél in CÉL_CSOPORT_MAP)) return false;

  // Specifikus alcél: csak arra az egy képzettségre hat
  if (h.alcél) {
    return képzettségNév === h.alcél;
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
