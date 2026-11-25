import type { GameData } from '../data-loader';
import type { Karakter, Session } from '../types';
import { harcFejlécÉrtékek } from '../harc/harc-fejlec-calc';
import { lookupFegyver, helyzetDef, helyzetDefId, lookupTávfegyver, taktikaDef } from '../lookup';

// Taktika megkötés-kiértékelés (session/fegyver/harcmodor/támadás/távfegyver + kombó).
// Kiemelve a taktika-helpers.ts-ből (2026-09-30 refaktor, modularizáció).

/** Taktika engedélyezett-e az aktuális session alapján (= nincs tiltás oka). */
export function isTaktikaAllowed(
  név: string, session: Session, karakter: Karakter, data: GameData,
): boolean {
  return taktikaTiltásOka(név, session, karakter, data) === null;
}

/**
 * A tiltás oka rövid, olvasható szövegként, vagy null, ha a taktika engedélyezett: az ELSŐ nem-teljesült
 * feltétel (helyzet-tiltás, szűrő_harcmodorok, megkötések, kombó). Az egyetlen szabálylista - az
 * isTaktikaAllowed is ezt hívja. Ismeretlen taktika: tiltott.
 */
export function taktikaTiltásOka(
  név: string, session: Session, karakter: Karakter, data: GameData,
): string | null {
  for (const h of session.aktív_helyzetek) {
    const hDef = helyzetDef(data, h);
    if (hDef?.tiltja_taktikákat) return `${h} helyzet minden taktikát tilt`;
  }
  const def = taktikaDef(data, név);
  if (!def) return 'ismeretlen taktika';

  const helyzetNév = (id: string) => helyzetDefId(data, id)?.név ?? id;

  if (def.szűrő_harcmodorok?.length) {
    const tfPeldany = karakter.távfegyverek[session.aktív_távfegyver_index];
    const tfDef = tfPeldany ? lookupTávfegyver(data.tavfegyverek, tfPeldany.alap) : undefined;
    if (!tfDef || !def.szűrő_harcmodorok.includes((tfDef.harcmodor ?? '').toLowerCase())) {
      return `${def.szűrő_harcmodorok.join(' / ')} harcmodorú távfegyver kell`;
    }
  }

  if (def.megkötések) {
    for (const mk of def.megkötések) {
      if (mk.típus === 'harci_helyzet' && mk.mód === 'tiltott') {
        if (session.aktív_helyzetek.includes(mk.érték as string)) return `${mk.érték} helyzetben tiltott`;
      }
      if (mk.típus === 'harci_helyzet' && mk.mód === 'szükséges') {
        const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték as string];
        const van = session.aktív_helyzetek.some(h => {
          const hDef2 = helyzetDef(data, h);
          return hDef2 && szükséges.includes(hDef2.id);
        });
        if (!van) return `${szükséges.map(helyzetNév).join(' / ')} helyzet szükséges`;
      }
      if (mk.típus === 'harcmodor' && mk.mód === 'tiltott') {
        const fp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
        if (fp) {
          const fd = lookupFegyver(data.fegyverek, fp.alap);
          if (fd && data.konstansok.fegyver_kategória_harcmodor[fd.kategória] === mk.érték) return `${mk.érték} harcmodorral tiltott`;
        }
      }
      if (mk.típus === 'támadások' && mk.mód === 'min') {
        const támadások = harcFejlécÉrtékek(data, karakter, session).ctx?.result.támadások ?? 1;
        if (támadások < (mk.érték as number)) return `min. ${mk.érték} támadás kell (most ${támadások})`;
      }
      if (mk.típus === 'távfegyver_kategória' && mk.mód === 'szükséges') {
        const tfIdx = session.aktív_távfegyver_index;
        const tfPeldany = karakter.távfegyverek[tfIdx];
        const tfDef = tfPeldany ? lookupTávfegyver(data.tavfegyverek, tfPeldany.alap) : undefined;
        const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték as string];
        if (!tfDef || !szükséges.includes(tfDef.kategória ?? '')) return `${szükséges.join(' / ')} kategóriájú távfegyver kell`;
      }
    }
  }

  // Kombó: a `név` taktikát a már aktív TÖBBI taktikához mérjük - önmagát kizárjuk, mert a már bekapcsolt
  // taktikára is hívjuk (useTaktikaInvalidation). Felvételkor a `név` úgysincs a session-ben.
  const mások = session.aktív_taktikák.filter(a => a.név !== név);
  if (mások.length === 0) return null;
  for (const aktív of mások) {
    const aktívDef = taktikaDef(data, aktív.név);
    if (!aktívDef) continue;
    if (aktívDef.kombó_mód === 'whitelist' && !aktívDef.kombó_lista.includes(név)) return `nem kombinálható ezzel: ${aktív.név}`;
    if (aktívDef.kombó_mód === 'blacklist' && aktívDef.kombó_lista.includes(név)) return `nem kombinálható ezzel: ${aktív.név}`;
  }
  if (def.kombó_mód === 'whitelist' && def.kombó_lista.length === 0 && mások.length > 0) return 'nem kombinálható más taktikával';
  if (def.kombó_mód === 'whitelist') {
    for (const aktív of mások) {
      if (!def.kombó_lista.includes(aktív.név)) return `nem kombinálható ezzel: ${aktív.név}`;
    }
  }
  if (def.kombó_mód === 'blacklist') {
    for (const aktív of mások) {
      if (def.kombó_lista.includes(aktív.név)) return `nem kombinálható ezzel: ${aktív.név}`;
    }
  }
  return null;
}
