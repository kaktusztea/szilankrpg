import type { GameData } from '../../engine/data-loader';
import { evaluate, buildContext } from '../../engine/reactive';

/** Képzettség szint limitek (engine_spec §19) — a rules.json-ból, NEM újraszámolva. */
export interface KépzettségLimitek {
  primer: number;
  szekunder: number;
}

const LIMIT_RULE_IDS = new Set(['képzettség_max_szint_primer', 'képzettség_max_szint_szekunder']);

/**
 * A primer/szekunder képzettségek max szintje a karakter TSz-e alapján.
 * A formula a `rules.json`-ban él (`képzettség_max_szint_primer|szekunder`), itt csak
 * kiértékeljük — így a plafon (`konstansok.arányok.képzettség_max_szint`) és a
 * szekunder ráhagyás (`képzettség_nemprimer_max_szint_plusz`) egy helyen van definiálva.
 */
export function képzettségLimitek(data: GameData, tsz: number): KépzettségLimitek {
  const rules = data.rules.filter(r => LIMIT_RULE_IDS.has(r.id));
  const computed = evaluate(rules, buildContext({}, tsz, data.konstansok));
  return {
    primer: computed.get('képzettség_max_szint_primer') ?? tsz,
    szekunder: computed.get('képzettség_max_szint_szekunder') ?? tsz,
  };
}
