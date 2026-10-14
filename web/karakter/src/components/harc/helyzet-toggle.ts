/** A "Gyengébb kéz" harci helyzet neve (data layer: harci_helyzetek.yaml, id: gyengébb_kéz).
 * Ez az egyetlen igazságforrás a név-string-re a Harc fülön belüli toggle-hoz. */
export const GYENGÉBB_KÉZ = 'Gyengébb kéz';

/**
 * Harci helyzet be/ki kapcsolása a session.aktív_helyzetek tömbben, név alapján.
 * Idempotens: bekapcsol ha nincs benne, kikapcsol ha benne van (duplikátum nélkül).
 * A "Gyengébb kéz"-nek nincs kizár_helyzetek/tiltja_taktikákat beállítása, ezért
 * a toggle egyszerű hozzáadás/eltávolítás (szemben az AktivHelyzetek add patch-logikájával).
 */
export function toggleHelyzet(aktívHelyzetek: string[], név: string): string[] {
  return aktívHelyzetek.includes(név)
    ? aktívHelyzetek.filter(h => h !== név)
    : [...aktívHelyzetek, név];
}
