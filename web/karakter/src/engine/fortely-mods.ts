import type { Karakter, Session } from './types';
import type { GameData } from './data-loader';
import { evaluateAlapesetek } from './alapeset';

/** Fortély módosítók kiszámítása */
export function calcFortelyMods(
  k: Karakter, session: Session, data: GameData,
  aktívFeltételek: Set<string>,
  feltételTeljesül: (feltétel: unknown) => boolean,
): Record<string, number> {
  // SP_erőbónusz_arány: a `scaled` + `forrás: "erőbónusz"` módosítók aránya. Az erőbónusz fegyverfüggő
  // (min(erő, mód Erőlimit)), ezért itt csak az arány gyűlik; a fegyver_SP szabály szoroz vele (§8, §16).
  const mods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0, CÉ: 0, harckeret: 0, SFÉ: 0, fegyverhossz: 0, SP_erőbónusz_arány: 0 };
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (!feltételTeljesül(mod.feltétel)) continue;
      if (def.session_toggle && (mod.cél === 'TÉ' || mod.cél === 'VÉ') && !(session as unknown as Record<string, unknown>)[kf.név.toLowerCase().replace(/ /g, '_')]) continue;
      if (mod.mód === 'flat') {
        mods[mod.cél] = (mods[mod.cél] ?? 0) + mod.érték;
      } else if (mod.mód === 'scaled' && mod.forrás === 'erőbónusz' && mod.cél === 'SP') {
        mods.SP_erőbónusz_arány += mod.arány;
      } else if (mod.mód === 'scaled' && mod.forrás) {
        const forrásÉrték = k.képzettségek.find(kp => kp.név.toLowerCase() === mod.forrás)?.szint ?? 0;
        mods[mod.cél] = (mods[mod.cél] ?? 0) + Math.floor(forrásÉrték * mod.arány);
      }
    }
  }
  for (const ae of evaluateAlapesetek(data.fortelySummaries, k, session, aktívFeltételek)) {
    for (const mod of ae.módosítók) {
      if (mod.mód === 'flat' && mod.cél in mods) {
        mods[mod.cél] = (mods[mod.cél] ?? 0) + mod.érték;
      }
    }
  }
  return mods;
}
