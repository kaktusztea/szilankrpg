import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';

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
          if (fd && data.konstansok.fegyver_kategória_harcmodor[fd.Kategória] === mk.érték) return false;
        }
      }
      if (mk.típus === 'támadások' && mk.mód === 'min') {
        const fp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
        const fd = fp ? lookupFegyver(data.fegyverek, fp.alap) : null;
        const sebesség = fd ? parseInt(fd.Sebesség) || 6 : 6;
        const harcmodorNév = fd ? (data.konstansok.fegyver_kategória_harcmodor[fd.Kategória] ?? 'Közelharc') : 'Közelharc';
        const harcmodorSzint = karakter.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
        const támadások = 1 + Math.floor((harcmodorSzint * 2) / sebesség);
        if (támadások < (mk.érték as number)) return false;
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

/** Taktika módosítók szöveges kijelzése */
export function getTaktikaMods(t: { név: string; fok?: number }, data: GameData): string[] {
  const def = data.taktikak.find(d => d.név === t.név);
  if (!def) return [];
  const mods: string[] = [];
  if (def.fokozatos && def.fokok && t.fok != null) {
    let fokDef = def.fokok.find(fk => fk.fok === t.fok);
    if (!fokDef && def.fortély_bővítés) {
      const utolsó = def.fokok[def.fokok.length - 1];
      fokDef = { fok: t.fok } as typeof utolsó;
      for (const [k, v] of Object.entries(utolsó)) {
        if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') (fokDef as any)[k] = Math.round((v / utolsó.fok) * t.fok);
      }
    }
    if (fokDef) {
      for (const [k, v] of Object.entries(fokDef)) {
        if (k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`);
      }
    }
  } else if (def.módosítók) {
    for (const [k, v] of Object.entries(def.módosítók)) {
      if (typeof v === 'number' && v !== 0) mods.push(`${k}:${v > 0 ? '+' : ''}${v}`);
    }
  }
  return mods;
}

/** Get taktika fokok including fortély bővítés extra fokok. */
export function getExtraFokok(def: any, karakter: Karakter): any[] {
  let fokok = [...def.fokok];
  if (def.fortély_bővítés) {
    const fb = def.fortély_bővítés;
    const fortélyFok = karakter.fortélyok.find(f => f.név === fb.fortély)?.fok ?? 0;
    const extraCount = fortélyFok * fb.extra_fokok_per_fok;
    const utolsó = def.fokok[def.fokok.length - 1];
    const perFok: Record<string, number> = {};
    for (const [k, v] of Object.entries(utolsó)) {
      if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok;
    }
    for (let i = 1; i <= extraCount; i++) {
      const newFok = utolsó.fok + i;
      const entry: any = { fok: newFok };
      for (const [k, step] of Object.entries(perFok)) entry[k] = Math.round(step * newFok);
      fokok.push(entry);
    }
  }
  return fokok;
}

/** Format fok modifier values as display string. */
export function formatFokMods(f: Record<string, unknown>): string {
  return Object.entries(f)
    .filter(([k, v]) => k !== 'fok' && k !== 'hatások' && typeof v === 'number' && v !== 0)
    .map(([k, v]) => `${k}: ${(v as number) > 0 ? '+' : ''}${v}`).join(', ');
}
