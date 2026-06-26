import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/helpers';

/** Taktika engedélyezett-e az aktuális session alapján */
export function isTaktikaAllowed(
  név: string,
  session: Session,
  karakter: Karakter,
  data: GameData,
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
          const hDef = data.harciHelyzetek.find(d => d.név === h);
          return hDef && szükséges.includes(hDef.id);
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

/** Helyzet elérhető-e a pickerben */
export function isHelyzetAvailable(
  h: { rejtett?: boolean; név: string; id: string },
  session: Session,
  data: GameData,
): boolean {
  if (h.rejtett) return false;
  if (session.aktív_helyzetek.includes(h.név)) return false;
  for (const ah of session.aktív_helyzetek) {
    const ahDef = data.harciHelyzetek.find(d => d.név === ah);
    if (ahDef?.kizár_helyzetek?.includes(h.id)) return false;
  }
  return true;
}

/** Min pengehossz figyelmeztetés generikus kiszámítása */
export function getMinPengeWarning(
  helyzetFeltételKulcs: string,
  karakter: Karakter,
  session: Session,
  data: GameData,
): string {
  for (const kf of karakter.fortélyok) {
    const fd = data.fortelySummaries.find(d => d.név === kf.név);
    if (!fd) continue;
    const fokDef = fd.fokok.find((f: any) => f.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.cél === 'min_pengehossz' && mod.feltétel === helyzetFeltételKulcs) {
        const aktívFp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
        const aktívFd = session.aktív_fegyver_index === -2
          ? lookupFegyver(data.fegyverek, karakter.pajzs?.méret ? karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs' : '')
          : aktívFp ? lookupFegyver(data.fegyverek, aktívFp.alap) : null;
        const ph = aktívFd ? (parseFloat(aktívFd.Pengehossz) || 0) : 0;
        if (ph < mod.érték) return `⚠ Min. pengehossz: ${mod.érték}!`;
      }
    }
  }
  return '';
}

/** Taktika módosítók szöveges kijelzése */
export function getTaktikaMods(
  t: { név: string; fok?: number },
  data: GameData,
): string[] {
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

/** Helyzet infó szöveg összeállítása (alapesettel) */
export function getHelyzetInfoText(
  helyzetNév: string,
  data: GameData,
): string {
  const def = data.harciHelyzetek.find(d => d.név === helyzetNév);
  if (!def) return '';
  const hId = def.feltétel_kulcs?.split(':')[1] || '';
  let alapText = '';
  for (const fd of data.fortelySummaries) {
    const f0 = fd.fokok?.find((f: any) => f.fok === 0);
    if (!f0?.hatás?.length) continue;
    const hasFelt = f0.módosítók?.some((m: any) => m.feltétel === `harci_helyzet:${hId}`) || f0.hatás?.join(' ').toLowerCase().includes(helyzetNév.toLowerCase());
    if (hasFelt) { alapText = f0.hatás.join(' '); break; }
  }
  return (def.infó || '') + (alapText ? ` Alapeset: ${alapText}` : '');
}

/** Fegyver opciók listázása */
export function buildFegyverOpciók(karakter: Karakter, data: GameData) {
  return [
    { név: 'Puszta kéz', idx: -1 },
    ...karakter.fegyverek.map((f, i) => {
      const fd = lookupFegyver(data.fegyverek, f.alap);
      return { név: fd?.Alapnév || f.alap, idx: i };
    }),
    ...(karakter.pajzs?.méret ? [{ név: karakter.pajzs.méret.charAt(0).toUpperCase() + karakter.pajzs.méret.slice(1) + ' Pajzs', idx: -2 }] : []),
  ];
}
