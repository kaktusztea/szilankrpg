import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import { lookupFegyver } from '../../engine/utils';
import { buildPajzsFegyverNév } from '../harc/shared';

/** Helyzet elérhető-e a pickerben */
export function isHelyzetAvailable(
  h: { rejtett?: boolean; név: string; id: string }, session: Session, data: GameData,
): boolean {
  if (h.rejtett) return false;
  if (session.aktív_helyzetek.includes(h.név)) return false;
  for (const ah of session.aktív_helyzetek) {
    const ahDef = data.harciHelyzetek.find(d => d.név === ah);
    if (ahDef?.kizár_helyzetek?.includes(h.id)) return false;
  }
  return true;
}

/** Min pengehossz figyelmeztetés */
export function getMinPengeWarning(
  helyzetFeltételKulcs: string, karakter: Karakter, session: Session, data: GameData,
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
          ? lookupFegyver(data.fegyverek, buildPajzsFegyverNév(karakter) ?? '')
          : aktívFp ? lookupFegyver(data.fegyverek, aktívFp.alap) : null;
        const ph = aktívFd ? (parseFloat(aktívFd.Pengehossz) || 0) : 0;
        if (ph < mod.érték) return `⚠ Min. pengehossz: ${mod.érték}!`;
      }
    }
  }
  return '';
}

/** Helyzet infó szöveg összeállítása (alapesettel) */
export function getHelyzetInfoText(helyzetNév: string, data: GameData): string {
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
