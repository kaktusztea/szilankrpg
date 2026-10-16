import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { HarcComputed } from './types';
import { evaluate, buildContext } from '../../engine/reactive';
import { lookupFegyver, harcmodorÖsszeg as calcHarcmodorÖsszeg, fortélyFok } from '../../engine/utils';
import { buildAktívFeltételek } from '../../engine/feltetelek';
import { createFeltételEvaluator } from '../../engine/feltetel-eval';
import { calcTaktikaMods } from './taktika-calc';
import { buildPancelLookups, calcFogas as calcFogás } from './pancel-calc';
import { buildFegyverRows, calcFegyverResults, jelölFegyverTiltások, calcKetkezes as calcKétkezes } from './fegyver-calc';
import { calcFortelyMods } from '../../engine/fortely-mods';
import { buildPajzsFegyverNév, véVesztésSzorzó } from './shared';
import { aktívTiltások, fegyverOverrideÉrtékek, gyűjtHelyzetEffektek, értékCélra, flatBontás } from '../../engine/effekt';

export function useHarcComputed(data: GameData, karakter: Karakter, session: Session): HarcComputed {
  const k = karakter;
  const { konstansok } = data;

  const aktívFeltételek = buildAktívFeltételek(session, data);
  // Nevesített tiltások (§42.4) a kézben lévő fegyver(ek)re - a nem soronkénti feltételekhez (pl. Belharcos fortély).
  for (const t of aktívTiltások(k, session, data, aktívFeltételek)) aktívFeltételek.add(`tiltás:${t.id}`);
  const taktikaMods = calcTaktikaMods(session, data, k);
  // Harci helyzetek saját oldali effektjei (§42): VÉ a harcértékbe, vé_csökkentés a VÉ-csökkentés popupba.
  const helyzetEffektek = gyűjtHelyzetEffektek(session, data);
  const helyzetMods = { VÉ: értékCélra(helyzetEffektek, 'VÉ') };
  const helyzetVéCsökkentés = flatBontás(helyzetEffektek, 'vé_csökkentés');

  const harcmodorÖsszeg = calcHarcmodorÖsszeg(k,
    [...new Set(Object.values(konstansok.fegyver_kategória_harcmodor) as string[])]);

  const merevvértFok = fortélyFok(k, 'Merevvértviselet');
  const lookupArrays = buildPancelLookups(konstansok);

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_alap', k.páncél.alap);
  stringCtx.set('páncél_fémalapanyag', k.páncél.fémalapanyag);
  stringCtx.set('páncél_kidolgozottság', k.páncél.kidolgozottság);
  stringCtx.set('páncél_méret_illeszkedés', k.páncél.méret_illeszkedés);

  // Aktív fegyverhossz
  const aktívFegyverFp = session.aktív_fegyver_index >= 0 ? k.fegyverek[session.aktív_fegyver_index] : null;
  const pajzsFegyverNév = buildPajzsFegyverNév(k);
  const aktívFegyverDef = session.aktív_fegyver_index === -2
    ? lookupFegyver(data.fegyverek, pajzsFegyverNév ?? '')
    : aktívFegyverFp ? lookupFegyver(data.fegyverek, aktívFegyverFp.alap) : null;

  const aktívFegyverKat = aktívFegyverDef?.kategória ?? 'közelharci';
  aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
    harcmodor_összeg: harcmodorÖsszeg,
    HM_TÉ: k.HM_TÉ, HM_VÉ: k.HM_VÉ, CM: k.CM,
    alakzatharc_szint: 0,
    merevvért_fok: merevvértFok,
    páncél_van: k.páncél.alap ? 1 : 0,
    páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0,
    páncél_idea: k.páncél.idea, páncél_rongálódás: k.páncél.rongálódás,
  });
  const computed = evaluate(data.rules, ctx, lookupArrays, stringCtx);

  const { feltételTeljesül } = createFeltételEvaluator(aktívFeltételek, session, computed, ctx, stringCtx);

  const fortelyMods = calcFortelyMods(k, session, data, aktívFeltételek, feltételTeljesül);

  const épValue = computed.get('ÉP') ?? 40;
  const ké = (computed.get('KÉ') ?? 0) + taktikaMods['KÉ'] + fortelyMods['KÉ'];
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const manőverAlap = computed.get('manőver_alap') ?? 0;
  const sfé_fizikai = (session.aktív_páncél ? (computed.get('sfé_fizikai') ?? 0) : 0) + fortelyMods['SFÉ'];
  const sfé_energia = (session.aktív_páncél ? (computed.get('sfé_energia') ?? 0) : 0) + fortelyMods['SFÉ'];
  const páncélLefedettség = session.aktív_páncél ? (computed.get('páncél_lefedettség') ?? 0) : 0;

  // Fegyverek
  const fegyverRows = buildFegyverRows(k, data, pajzsFegyverNév);
  const páncélMGT = session.aktív_páncél ? (computed.get('páncél_MGT') ?? 0) : 0;
  const merevvértBüntetés = session.aktív_páncél ? (computed.get('merevvért_TÉ_büntetés') ?? 0) : 0;
  const fegyverResults = calcFegyverResults(fegyverRows, k, data, fortelyMods, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx, páncélMGT, merevvértBüntetés,
    fDef => fegyverOverrideÉrtékek(fDef, session, data, aktívFeltételek));
  jelölFegyverTiltások(fegyverResults, session, data, aktívFeltételek);

  const kétkezesResult = calcKétkezes(k, session, data, fortelyMods, aktívFeltételek, páncélMGT, merevvértBüntetés);
  const { pajzsVÉ, fogásResult } = calcFogás(k, session, data, fortelyMods);

  const belharciAktív = session.aktív_helyzetek.includes('Belharci helyzet');
  const { szorzó: véVeszSzorzó, forrás: véVeszSzorzóForrás } = véVesztésSzorzó(session.aktív_helyzetek, data.harciHelyzetek, session.aktív_státuszok, data.statuszok);

  // Max VÉ csökkenés
  const maxVéCsökk = Math.max(0, ...(kétkezesResult
    ? [kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ'] + helyzetMods.VÉ]
    : fogásResult
      ? fegyverResults.map(r => r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'] + helyzetMods.VÉ)
      : fegyverResults.map(r => r.VÉ + pajzsVÉ + taktikaMods['VÉ'] + helyzetMods.VÉ)));

  // ÉP sáv
  const oszlopMéret = épValue / konstansok.sebesülés_kategóriák_száma;
  const téLevonások = konstansok.egészség_kategória_levonás
    .map(ek => {
      const téMod = ek.módosítók.find(m => m.cél === 'TÉ' && m.mód === 'flat');
      return téMod?.érték ?? 0;
    });

  return {
    ké, épValue, manöverPont, manőverAlap, sfé_fizikai, sfé_energia, páncélLefedettség, páncélMGT, merevvértBüntetés,
    taktikaMods, helyzetMods, helyzetVéCsökkentés, fortelyMods, fegyverResults, kétkezesResult, fogásResult,
    pajzsVÉ, pajzsFegyverNév, belharciAktív, maxVéCsökk, oszlopMéret, téLevonások, véVeszSzorzó, véVeszSzorzóForrás,
    feltételTeljesül,
    // Extrák (§42 info): a fegyver-extrák auto-státuszához szükséges kontextus. A cél_páncél
    // kategóriát a Sebzés popup állítja (ellenfél-páncél választó); itt undefined marad.
    extraKontextus: {
      aktívFeltételek,
      fortélyFokok: new Map(k.fortélyok.map(f => [f.név, f.fok])),
      aktívStátuszok: new Set(session.aktív_státuszok),
      aktorNév: aktívFegyverDef?.módok?.[0]?.aktor,
      forgatás: aktívFegyverDef?.módok?.[0]?.Forgatás,
      aktívManőver: session.aktív_manőver || undefined,
    },
  };
}
