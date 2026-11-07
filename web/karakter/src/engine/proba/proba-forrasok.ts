/**
 * A próbák fortély-eredetű forrásai karakterre bontva (Tulajdonságok fül + Próba-hub közös számítása):
 * szituációs próba-bónuszok tulajdonságonként / képzettségenként (§42, `fortélyPróbaBónuszok`) és a próba-enyhítések.
 */
import type { Karakter } from '../types';
import type { GameData, PróbaEnyhítés } from '../data-types';
import { képzKulcs } from '../azonosito';
import { fortélyPróbaBónuszok } from '../effekt';
import { fortélyDef } from '../lookup';

type Bónuszok = Record<string, { érték: number; leírás: string }[]>;

/** Tulajdonságonként (érzékenységnél az érzék-próbák is: Emberentúli látás / hallás / szaglás). */
export function fortélyBónuszokTulajdonságonként(k: Karakter, data: GameData): Bónuszok {
  const result: Bónuszok = {};
  for (const kulcs of Object.keys(k.tulajdonságok)) {
    const érzék = kulcs === 'érzékenység';
    const b = fortélyPróbaBónuszok(k, data, érzék ? ['tulajdonságpróba', 'érzék_próba'] : ['tulajdonságpróba'],
      a => a === `tulajdonság:${kulcs}` || (érzék && a.startsWith('érzék:')));
    if (b.length) result[kulcs] = b;
  }
  return result;
}

/** Képzettségenként (pl. Fakír: Fájdalomtűrés kínzáskor +2). */
export function fortélyBónuszokKépzettségenként(k: Karakter, data: GameData): Bónuszok {
  const result: Bónuszok = {};
  for (const kp of k.képzettségek) {
    const b = fortélyPróbaBónuszok(k, data, ['képzettségpróba'], a => a === `képzettség:${képzKulcs(kp)}`);
    if (b.length) result[képzKulcs(kp)] = b;
  }
  return result;
}

/** A fortélyok próba-enyhítései képzettségenként (a forrás-fortély nevével). */
export function próbaEnyhítésekKépzettségenként(fortélyok: Karakter['fortélyok'], data: GameData): Record<string, PróbaEnyhítés[]> {
  const result: Record<string, PróbaEnyhítés[]> = {};
  for (const kf of fortélyok) {
    const def = fortélyDef(data, kf.id);
    const pe_lista = def?.fokok.find(fd => fd.fok === kf.fok)?.próba_enyhítések;
    if (!def || !pe_lista?.length) continue;
    for (const pe of pe_lista) (result[pe.képzettség] ??= []).push({ ...pe, fortély: def.név });
  }
  return result;
}
