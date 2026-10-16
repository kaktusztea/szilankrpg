import type { Karakter, Session } from './types';
import type { GameData } from './data-loader';
import { gyűjtFortélyEffektek, értékCélra, arányÖsszeg } from './effekt';

/** A fogyasztók által olvasott fortély-célok (harcértékek + harckeret/fegyverhossz). */
const CÉLOK = ['KÉ', 'TÉ', 'VÉ', 'SP', 'CÉ', 'harckeret', 'SFÉ', 'fegyverhossz'] as const;

/**
 * Fortély módosítók (fortély + alapeset) - a közös effekt-gyűjtőből (§42 3. fázis), a §42.3 precedenciával.
 * `SP_erőbónusz_arány`: a `scaled` + `forrás: "erőbónusz"` arányok összege - fegyverfüggő, a fegyver_SP szabály
 * szoroz vele (§8, §16).
 */
export function calcFortelyMods(
  k: Karakter, session: Session, data: GameData,
  aktívFeltételek: Set<string>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Record<string, number> {
  const eff = gyűjtFortélyEffektek(k, session, data, aktívFeltételek, feltételTeljesül);
  const mods: Record<string, number> = Object.fromEntries(CÉLOK.map(c => [c, értékCélra(eff, c)]));
  mods.SP_erőbónusz_arány = arányÖsszeg(eff, 'SP', 'erőbónusz');
  return mods;
}
