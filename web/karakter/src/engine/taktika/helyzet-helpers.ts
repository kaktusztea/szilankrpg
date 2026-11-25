import type { GameData } from '../data-loader';
import type { Karakter, Session } from '../types';
import { buildPajzsFegyverNév } from '../utils';
import { buildAktívFeltételek } from '../feltetelek';
import { aktívTiltások } from '../effekt';
import { lookupFegyver, fortélyDef, helyzetDef, helyzetDefId } from '../lookup';

/** Helyzet elérhető-e a pickerben */
export function isHelyzetAvailable(
  h: { rejtett?: boolean; név: string; id: string }, session: Session, data: GameData,
): boolean {
  if (h.rejtett) return false;
  if (session.aktív_helyzetek.includes(h.név)) return false;
  for (const ah of session.aktív_helyzetek) {
    const ahDef = helyzetDef(data, ah);
    if (ahDef?.kizár_helyzetek?.includes(h.id)) return false;
  }
  return true;
}

/**
 * Session after switching on a helyzet: the helyzetek it excludes (`kizár_helyzetek`) are dropped, `tiltja_taktikákat`
 * clears the taktikák, a `tiltott_fegyverfogások` hit falls back to egyfegyveres (no kétkezes / pajzs / bal kéz).
 */
export function helyzetFelvéve(s: Session, név: string, data: GameData): Session {
  const def = helyzetDef(data, név);
  const kizártNevek = (def?.kizár_helyzetek ?? []).map(id => helyzetDefId(data, id)?.név);
  const fogásTiltott = !!def?.tiltott_fegyverfogások?.includes(s.fegyverfogás);
  return {
    ...s,
    ...(fogásTiltott ? { fegyverfogás: 'egyfegyveres', kétkezes_harc: false, aktív_pajzs: false, aktív_fegyver_bal_index: -1 } : {}),
    aktív_helyzetek: [...s.aktív_helyzetek, név].filter(h => !kizártNevek.includes(h)),
    aktív_taktikák: def?.tiltja_taktikákat ? [] : s.aktív_taktikák,
  };
}

/** Min fegyverhossz figyelmeztetés */
export function getMinFegyverhosszWarning(
  helyzetFeltételKulcs: string, karakter: Karakter, session: Session, data: GameData,
): string {
  for (const kf of karakter.fortélyok) {
    const fd = fortélyDef(data, kf.id);
    if (!fd) continue;
    const fokDef = fd.fokok.find(f => f.fok === kf.fok);
    const köv = fokDef?.követelmények?.find(k => k.típus === 'min_fegyverméret' && k.feltétel === helyzetFeltételKulcs);
    if (!köv) continue;
    const aktívFp = session.aktív_fegyver_index >= 0 ? karakter.fegyverek[session.aktív_fegyver_index] : null;
    const aktívFd = session.aktív_fegyver_index === -2
      ? lookupFegyver(data.fegyverek, buildPajzsFegyverNév(karakter) ?? '')
      : aktívFp ? lookupFegyver(data.fegyverek, aktívFp.alap) : null;
    const ph = aktívFd?.fegyverhossz ?? 0;
    if (ph < Number(köv.érték)) return `⚠ Min. fegyverhossz: ${köv.érték}!`;
  }
  return '';
}

/** Egy aktív helyzet tiltásai, amelyeket a kézben lévő fegyver(ek) megsértenek (pl. Belharc: ⚠ túl hosszú) - §42.4. */
export function getTiltásWarnings(helyzetNév: string, karakter: Karakter, session: Session, data: GameData): string[] {
  return aktívTiltások(karakter, session, data, buildAktívFeltételek(session, data))
    .filter(t => t.helyzet === helyzetNév).map(t => `⚠ ${t.leírás}`);
}

/** Helyzet infó szöveg összeállítása (alapesettel) */
export function getHelyzetInfoText(helyzetNév: string, data: GameData): string {
  const def = helyzetDef(data, helyzetNév);
  if (!def) return '';
  const hId = def.feltétel_kulcs?.split(':')[1] || '';
  let alapText = '';
  for (const fd of data.fortelySummaries) {
    const f0 = fd.fokok?.find(f => f.fok === 0);
    if (!f0?.hatás?.length) continue;
    const hasFelt = f0.módosítók?.some(m => m.feltétel === `harci_helyzet:${hId}`) || f0.hatás?.join(' ').toLowerCase().includes(helyzetNév.toLowerCase());
    if (hasFelt) { alapText = f0.hatás.join(' '); break; }
  }
  return (def.infó || '') + (alapText ? ` Alapeset: ${alapText}` : '');
}
