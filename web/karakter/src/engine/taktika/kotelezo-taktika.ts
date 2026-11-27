import type { GameData } from '../data-loader';
import type { Karakter, Session, AktívTaktika } from '../types';
import { parseStátusz } from '../statusz';
import { státuszDef } from '../lookup';
import { getExtraFokok } from './taktika-helpers';

/**
 * Taktikák, amelyeket az aktív státuszok kötelezővé tesznek (statuszok.yaml `taktika_kötelező` Hatás, pl. Félelem (1):
 * Védő (3), Indulat: Támadó (MAX)). A `szituációs` (feltételes, pl. „egyszer") sor csak szöveg, nem kerül ide.
 * `MAX` = a karakter számára elérhető legmagasabb fok (skálázható taktika: harcmodor-szint szerint).
 */
export function kötelezőTaktikák(aktívStátuszok: string[], karakter: Karakter, data: GameData): AktívTaktika[] {
  const ki: AktívTaktika[] = [];
  for (const st of aktívStátuszok) {
    const p = parseStátusz(st);
    if (!p) continue;
    const fokDef = státuszDef(data, p.id)?.fokok.find(f => f.fok === p.fok);
    for (const h of fokDef?.hatások ?? []) {
      if (h.hatás_id !== 'taktika_kötelező' || !h.taktika || h.szituációs) continue;
      const def = data.taktikak.find(t => t.id === h.taktika);
      if (!def || ki.some(k => k.név === def.név)) continue;
      let fok: number | undefined;
      if (h.taktika_fok === 'MAX') {
        const fokok = getExtraFokok(def, karakter, data);
        fok = fokok.length ? fokok[fokok.length - 1].fok : undefined;
      } else if (typeof h.taktika_fok === 'number') fok = h.taktika_fok;
      ki.push(fok != null ? { név: def.név, fok } : { név: def.név });
    }
  }
  return ki;
}

/**
 * Az `aktív_státuszok` változása után a kötelező taktikák szinkronja (`prev` → `next`): ami a státusszal megszűnt, az a
 * taktika törlődik; ami új (vagy más fokkal kötelező), az beáll. Ami nem változott, ahhoz nem nyúl - így a taktika
 * kézzel törölhető / átállítható, és a státusz egy másik változtatása nem írja vissza.
 */
export function kötelezőTaktikaSzinkron(prev: Session, next: Session, karakter: Karakter, data: GameData): Session {
  const régi = kötelezőTaktikák(prev.aktív_státuszok, karakter, data);
  const új = kötelezőTaktikák(next.aktív_státuszok, karakter, data);
  let taktikák = next.aktív_taktikák;
  for (const r of régi) if (!új.some(u => u.név === r.név)) taktikák = taktikák.filter(t => t.név !== r.név);
  for (const u of új) {
    if (régi.some(r => r.név === u.név && r.fok === u.fok)) continue;
    taktikák = [...taktikák.filter(t => t.név !== u.név), u];
  }
  return taktikák === next.aktív_taktikák ? next : { ...next, aktív_taktikák: taktikák };
}
