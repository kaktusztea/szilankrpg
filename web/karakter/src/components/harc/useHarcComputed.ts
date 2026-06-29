import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { HarcComputed } from './types';
import { evaluate, buildContext } from '../../engine/reactive';
import { lookupFegyver } from '../../engine/utils';
import { buildAktívFeltételek } from '../../engine/feltetelek';
import { createFeltételEvaluator } from '../../engine/feltetel-eval';
import { calcTaktikaMods } from './taktika-calc';
import { buildPancelLookups, calcFogas as calcFogás } from './pancel-calc';
import { buildFegyverRows, calcFegyverResults, applyFegyverOverrides, calcKetkezes as calcKétkezes } from './fegyver-calc';
import { calcFortelyMods } from '../../engine/fortely-mods';

export function useHarcComputed(data: GameData, karakter: Karakter, session: Session): HarcComputed {
  const k = karakter;
  const { konstansok } = data;

  const aktívFeltételek = buildAktívFeltételek(session, data);
  const taktikaMods = calcTaktikaMods(session, data);

  const harcmodorÖsszeg = [...new Set(Object.values(konstansok.fegyver_kategória_harcmodor) as string[])]
    .reduce((s: number, név: string) => s + (k.képzettségek.find(kp => kp.név === név)?.szint ?? 0), 0);

  const merevvértFok = k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const lookupArrays = buildPancelLookups(konstansok);

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_alap', k.páncél.alap);
  stringCtx.set('páncél_fémalapanyag', k.páncél.fémalapanyag);
  stringCtx.set('páncél_kidolgozottság', k.páncél.kidolgozottság);
  stringCtx.set('páncél_méret_illeszkedés', k.páncél.méret_illeszkedés);

  // Aktív fegyver pengehossz
  const aktívFegyverFp = session.aktív_fegyver_index >= 0 ? k.fegyverek[session.aktív_fegyver_index] : null;
  const pajzsFegyverNév = k.pajzs?.méret ? (k.pajzs.méret.charAt(0).toUpperCase() + k.pajzs.méret.slice(1) + ' Pajzs') : null;
  const aktívFegyverDef = session.aktív_fegyver_index === -2
    ? lookupFegyver(data.fegyverek, pajzsFegyverNév ?? '')
    : aktívFegyverFp ? lookupFegyver(data.fegyverek, aktívFegyverFp.alap) : null;

  const jobbPengehossz = aktívFegyverDef ? (parseFloat(aktívFegyverDef.Pengehossz) || 0) : 0;
  let aktívFegyverPengehossz = jobbPengehossz;

  if ((session.kétkezes_harc || session.fegyverfogás === 'fegyver_hárító') && session.aktív_fegyver_bal_index >= 0) {
    const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
    const balDef = balFp ? lookupFegyver(data.fegyverek, balFp.alap) : null;
    aktívFegyverPengehossz += balDef ? (parseFloat(balDef.Pengehossz) || 0) : 0;
  }

  const aktívFegyverKat = aktívFegyverDef?.Kategória ?? 'közelharci';
  const aktívFegyverHarcmodor = konstansok.fegyver_kategória_harcmodor[aktívFegyverKat] ?? 'Közelharc';
  stringCtx.set('aktív_fegyver_harcmodor', aktívFegyverHarcmodor);
  aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
    harcmodor_összeg: harcmodorÖsszeg,
    HM_TÉ: k.HM_TÉ, HM_VÉ: k.HM_VÉ, CM: k.CM,
    felszerelés_terhelés: 0, alakzatharc_szint: 0,
    merevvért_fok: merevvértFok,
    páncél_van: k.páncél.alap ? 1 : 0,
    páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0,
    páncél_idea: k.páncél.idea, páncél_rongálódás: k.páncél.rongálódás,
    aktív_fegyver_pengehossz: aktívFegyverPengehossz,
  });
  const computed = evaluate(data.rules, ctx, lookupArrays, stringCtx);

  const { feltételTeljesül } = createFeltételEvaluator(aktívFeltételek, session, computed, ctx, stringCtx);

  const fortelyMods = calcFortelyMods(k, session, data, aktívFeltételek, feltételTeljesül);

  const épValue = computed.get('ÉP') ?? 40;
  const ké = (computed.get('KÉ') ?? 0) + taktikaMods['KÉ'] + fortelyMods['KÉ'];
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const sfé_fizikai = (session.aktív_páncél ? (computed.get('sfé_fizikai') ?? 0) : 0) + fortelyMods['SFÉ'];
  const sfé_energia = (session.aktív_páncél ? (computed.get('sfé_energia') ?? 0) : 0) + fortelyMods['SFÉ'];
  const páncélLefedettség = session.aktív_páncél ? (computed.get('páncél_lefedettség') ?? 0) : 0;

  // Fegyverek
  const fegyverRows = buildFegyverRows(k, data, pajzsFegyverNév);
  const páncélMGT = computed.get('páncél_MGT') ?? 0;
  const fegyverResults = calcFegyverResults(fegyverRows, k, data, fortelyMods, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx, páncélMGT);
  applyFegyverOverrides(fegyverResults, session, data, feltételTeljesül);

  const kétkezesResult = calcKétkezes(k, session, data, fortelyMods, feltételTeljesül);
  const { pajzsVÉ, fogásResult } = calcFogás(k, session, data, fortelyMods);

  const belharciAktív = session.aktív_helyzetek.includes('Belharci helyzet');

  // Max VÉ csökkenés
  const maxVéCsökk = Math.max(0, ...(kétkezesResult
    ? [kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ']]
    : fogásResult
      ? fegyverResults.map(r => r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'])
      : fegyverResults.map(r => r.VÉ + pajzsVÉ + taktikaMods['VÉ'])));

  // ÉP sáv
  const oszlopMéret = épValue / konstansok.sebesülés_kategóriák_száma;
  const téLevonások = (konstansok.egészség_kategória_levonás as { szint: string; módosítók: { cél: string; érték: number }[] }[])
    .map(ek => {
      const téMod = ek.módosítók.find(m => m.cél === 'TÉ');
      return téMod?.érték ?? 0;
    });

  return {
    ké, épValue, manöverPont, sfé_fizikai, sfé_energia, páncélLefedettség,
    taktikaMods, fortelyMods, fegyverResults, kétkezesResult, fogásResult,
    pajzsVÉ, pajzsFegyverNév, belharciAktív, maxVéCsökk, oszlopMéret, téLevonások,
    feltételTeljesül,
  };
}
