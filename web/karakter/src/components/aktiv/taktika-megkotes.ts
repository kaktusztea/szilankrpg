import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { lookupFegyver, képzettségSzint } from '../../engine/utils';
import { elsődlegesMód } from '../harc/fegyver-calc';

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
        const fp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
        const fd = fp ? lookupFegyver(data.fegyverek, fp.alap) : null;
        const sebesség = fd ? (elsődlegesMód(fd).Sebesség ?? 6) : 6;
        const harcmodorNév = fd ? (data.konstansok.fegyver_kategória_harcmodor[fd.kategória] ?? 'Közelharc') : 'Közelharc';
        const harcmodorSzint = képzettségSzint(karakter, harcmodorNév);
        const támadások = 1 + Math.floor((harcmodorSzint * 2) / sebesség);
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

  // Kombó validáció
  if (session.aktív_taktikák.length === 0) return true;
  for (const aktív of session.aktív_taktikák) {
    const aktívDef = data.taktikak.find(t => t.név === aktív.név);
    if (!aktívDef) continue;
    if (aktívDef.kombó_mód === 'whitelist' && !aktívDef.kombó_lista.includes(név)) return false;
    if (aktívDef.kombó_mód === 'blacklist' && aktívDef.kombó_lista.includes(név)) return false;
  }
  if (def.kombó_mód === 'whitelist' && def.kombó_lista.length === 0 && session.aktív_taktikák.length > 0) return false;
  if (def.kombó_mód === 'whitelist') {
    for (const aktív of session.aktív_taktikák) {
      if (!def.kombó_lista.includes(aktív.név)) return false;
    }
  }
  if (def.kombó_mód === 'blacklist') {
    for (const aktív of session.aktív_taktikák) {
      if (def.kombó_lista.includes(aktív.név)) return false;
    }
  }
  return true;
}
