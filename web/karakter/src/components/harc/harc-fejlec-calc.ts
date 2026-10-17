import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { useHarcComputed } from './useHarcComputed';
import { calcFtEnyhites } from './pancel-calc';
import { buildRubrikák } from './ep-logic';
import { computeTÉ, computeVÉ } from './shared';
import { resolveAktívFegyverContext } from './aktiv-fegyver-ctx';

/**
 * A Harc fül fejléc-harcértékei (KÉ, aktív fegyver TÉ / VÉ) - EGY számítás: a Harc fül és az NJK switcher
 * gyors-statja is ezt használja, így nem térhetnek el (2026-10-17). Tartalmaz mindent, amit a fejléc: fortély,
 * taktika, helyzet, státusz, kétkezes / fogás, sebesülés TÉ-levonás (Fájdalomtűrés-enyhítéssel), VÉ-csökkenés.
 * `sebCount`: kitöltött ÉP-rubrikák száma; ha nincs megadva, a session sebzéseiből.
 */
export function harcFejlécÉrtékek(data: GameData, karakter: Karakter, session: Session = karakter.session, sebCount?: number) {
  const hc = useHarcComputed(data, karakter, session);
  const seb = sebCount ?? buildRubrikák(session.sebzések ?? [], hc.épValue).filter(r => r.típus !== '').length;
  const aktKat = seb === 0 ? 0 : Math.min(3, Math.ceil(seb / hc.oszlopMéret) - 1);
  const ftEnyhítés = calcFtEnyhites(karakter.képzettségek, data.konstansok.fájdalomtűrés_enyhítés);
  const rawTéLevonás = hc.téLevonások[aktKat];
  const téLevonás = rawTéLevonás === 0 ? 0 : Math.min(0, rawTéLevonás + ftEnyhítés);
  const ctx = resolveAktívFegyverContext(hc, karakter, session, data);
  const többTámTÉ = data.konstansok.több_támadás_TÉ_levonás;
  const aktívTÉ = ctx ? computeTÉ(ctx.result.TÉ, téLevonás, hc.taktikaMods['TÉ'], ctx.téExtra, ctx.result.támadások, többTámTÉ) : null;
  const aktívVÉ = ctx ? computeVÉ(ctx.result.VÉ, ctx.veBónusz, hc.taktikaMods['VÉ'] + hc.helyzetMods.VÉ, session.vé_csökkenés) : null;
  return { hc, ké: hc.ké, téLevonás, ctx, aktívTÉ, aktívVÉ };
}
