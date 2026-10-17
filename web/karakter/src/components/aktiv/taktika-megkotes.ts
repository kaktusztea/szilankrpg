import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { harcFejlécÉrtékek } from '../harc/harc-fejlec-calc';

// Taktika megkötés-kiértékelés (session/fegyver/harcmodor/támadás/távfegyver + kombó).
// Kiemelve a taktika-helpers.ts-ből (2026-09-30 refaktor, modularizáció).

/** Taktika engedélyezett-e az aktuális session alapján */
export function isTaktikaAllowed(
  név: string, session: Session, karakter: Karakter, data: GameData,
): boolean {
  for (const h of session.aktív_helyzetek) {
    const hDef = data.harciHelyzetek.find(d => d.név === h);
    if (hDef?.tiltja_taktikákat) return false;
  }
  const def = data.taktikak.find(t => t.név === név);
  if (!def) return false;

  // szűrő_harcmodorok: a taktika CSAK akkor engedélyezett, ha az aktív távfegyver harcmodora
  // szerepel a szűrőben (pl. Kitartott célzás → Íjászat/Lövészet). Enélkül a taktika bekapcsolható
  // lenne hajító fegyverrel is, ahol a CÉ-bónusz (getFortélyCÉ) jogosan 0 - félrevezető megjegyzéssel.
  // Egy igazságforrás: ugyanaz a `szűrő_harcmodorok`, amit a getFortélyCÉ a bónuszhoz használ.
  if (def.szűrő_harcmodorok?.length) {
    const tfPeldany = karakter.távfegyverek[session.aktív_távfegyver_index];
    const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;
    if (!tfDef || !def.szűrő_harcmodorok.includes((tfDef.harcmodor ?? '').toLowerCase())) return false;
  }

  if (def.megkötések) {
    for (const mk of def.megkötések) {
      if (mk.típus === 'harci_helyzet' && mk.mód === 'tiltott') {
        if (session.aktív_helyzetek.includes(mk.érték as string)) return false;
      }
      if (mk.típus === 'harci_helyzet' && mk.mód === 'szükséges') {
        const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték];
        if (!session.aktív_helyzetek.some(h => {
          const hDef2 = data.harciHelyzetek.find(d => d.név === h);
          return hDef2 && szükséges.includes(hDef2.id);
        })) return false;
      }
      if (mk.típus === 'harcmodor' && mk.mód === 'tiltott') {
        const fp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
        if (fp) {
          const fd = lookupFegyver(data.fegyverek, fp.alap);
          if (fd && data.konstansok.fegyver_kategória_harcmodor[fd.kategória] === mk.érték) return false;
        }
      }
      if (mk.típus === 'támadások' && mk.mód === 'min') {
        // A Harc fül aktív fegyverének támadásszáma (rules.json fegyver_támadások: harckeret / sebesség), kétkezes/fogás szerint.
        const támadások = harcFejlécÉrtékek(data, karakter, session).ctx?.result.támadások ?? 1;
        if (támadások < (mk.érték as number)) return false;
      }
      if (mk.típus === 'távfegyver_kategória' && mk.mód === 'szükséges') {
        const tfIdx = session.aktív_távfegyver_index;
        const tfPeldany = karakter.távfegyverek[tfIdx];
        const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;
        const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték as string];
        if (!tfDef || !szükséges.includes(tfDef.kategória ?? '')) return false;
      }
    }
  }

  // Kombó validáció. A `név` taktikát a már aktív TÖBBI taktikához mérjük - önmagát kizárjuk,
  // mert az isTaktikaAllowed-ot a már bekapcsolt taktikára is hívjuk (useTaktikaInvalidation).
  // Felvételkor a `név` úgysincs a session-ben, ott a kizárás no-op.
  const mások = session.aktív_taktikák.filter(a => a.név !== név);
  if (mások.length === 0) return true;
  for (const aktív of mások) {
    const aktívDef = data.taktikak.find(t => t.név === aktív.név);
    if (!aktívDef) continue;
    if (aktívDef.kombó_mód === 'whitelist' && !aktívDef.kombó_lista.includes(név)) return false;
    if (aktívDef.kombó_mód === 'blacklist' && aktívDef.kombó_lista.includes(név)) return false;
  }
  if (def.kombó_mód === 'whitelist' && def.kombó_lista.length === 0 && mások.length > 0) return false;
  if (def.kombó_mód === 'whitelist') {
    for (const aktív of mások) {
      if (!def.kombó_lista.includes(aktív.név)) return false;
    }
  }
  if (def.kombó_mód === 'blacklist') {
    for (const aktív of mások) {
      if (def.kombó_lista.includes(aktív.név)) return false;
    }
  }
  return true;
}

/**
 * A tiltás oka rövid, olvasható szövegként (vagy null, ha engedélyezett). Az isTaktikaAllowed
 * AZONOS ágait követi - az ELSŐ nem-teljesült feltétel okát adja vissza. ponytail: csak a toggle-picker
 * letiltott soraihoz kell, ezért külön olvasható szövegező az engedélyezés-logika mellett (nem benne,
 * hogy az allow-ellenőrzés gyors boolean maradjon). A kettő egy helyen él → együtt módosul.
 */
export function taktikaTiltásOka(
  név: string, session: Session, karakter: Karakter, data: GameData,
): string | null {
  for (const h of session.aktív_helyzetek) {
    const hDef = data.harciHelyzetek.find(d => d.név === h);
    if (hDef?.tiltja_taktikákat) return `${h} helyzet minden taktikát tilt`;
  }
  const def = data.taktikak.find(t => t.név === név);
  if (!def) return null;

  const helyzetNév = (id: string) => data.harciHelyzetek.find(d => d.id === id)?.név ?? id;

  if (def.szűrő_harcmodorok?.length) {
    const tfPeldany = karakter.távfegyverek[session.aktív_távfegyver_index];
    const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;
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
          const hDef2 = data.harciHelyzetek.find(d => d.név === h);
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
        const tfDef = tfPeldany ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldany.alap.toLowerCase()) : undefined;
        const szükséges = Array.isArray(mk.érték) ? mk.érték : [mk.érték as string];
        if (!tfDef || !szükséges.includes(tfDef.kategória ?? '')) return `${szükséges.join(' / ')} kategóriájú távfegyver kell`;
      }
    }
  }

  const mások = session.aktív_taktikák.filter(a => a.név !== név);
  if (mások.length === 0) return null;
  for (const aktív of mások) {
    const aktívDef = data.taktikak.find(t => t.név === aktív.név);
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
