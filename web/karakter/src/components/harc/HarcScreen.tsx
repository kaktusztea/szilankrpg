import { useState, useCallback, useEffect } from 'react';
import type { HarcBaseProps } from './types';
import type { SebzésRubrika } from '../../engine/types';
import { harcFejlécÉrtékek } from '../../engine/harc/harc-fejlec-calc';
import { useHint } from '../../hooks/useHint';
import { HarcHeader } from './HarcHeader';
import { HarcFegyverTable } from './HarcFegyverTable';
import { FegyverInfoPopup } from './FegyverInfoPopup';
import { HarcPopups } from './HarcPopups';
import { EpTable } from './EpTable';
import { HarcReszletek } from './HarcReszletek';
import { HarcFegyverSection } from './HarcFegyverSection';
import { HarcFegyverfogas } from './HarcFegyverfogas';
import { calcFtEnyhites as calcFtEnyhítés } from '../../engine/harc/pancel-calc';
import { DobasPopup, pushDobás, pushTéDobás } from './DobasPopup';
import { TamadoDobasPopup } from './TamadoDobasPopup';
import { VeCsokkentesPopup } from '../dobas/VeCsokkentesPopup';
import { TaktikaTiltvaInfoPopup } from './TaktikaTiltvaInfoPopup';
import { taktikaVéCsökkentésÁllapot } from '../../engine/harc/ve-csokkentes-calc';
import { useSérültStátusz } from './useSerultStatusz';
import { useVéCsökkenés } from './useVeCsokkenes';
import { VeSzorzoInfoPopup } from './VeSzorzoInfoPopup';
import { PancelInfoPopup } from './PancelInfoPopup';
import { collectDobásInfo } from '../../engine/harc/combat-roll-info';
import { ManoverDobasPopup } from '../dobas/ManoverDobasPopup';
import { ManoverPicker } from './ManoverPicker';
import { rollK20 } from '../../engine/dice';
import './HarcScreen.css';
import type { FegyverResult } from '../../engine/harc/types';
import { lookupFegyver } from '../../engine/lookup';

type TámInfo = { név: string; sebesség: number; harckeret: number; hk_harcmodor: number; hk_gyorsaság: number; hk_mgt: number; hk_fortély: number };
type ManőverDef = HarcBaseProps['data']['manoverek'][number];
/** A Harc fül popupjai (egyszerre egy). */
type HarcPopup =
  | { t: 'ké'; eredmény: number } | { t: 'támadó' } | { t: 'fárasztás' } | { t: 'teljesVédekezés' }
  | { t: 'véHistory' } | { t: 'véReset' } | { t: 'támInfo'; info: TámInfo } | { t: 'fegyverInfo'; result: FegyverResult }
  | { t: 'fegyverfogás' } | { t: 'páncélInfo' }
  | { t: 'manőverMód' } | { t: 'manőverLista'; mód: 'aktív' | 'passzív' } | { t: 'manőver'; manőver: ManőverDef; mód: 'aktív' | 'passzív' };

/** A Fájdalomtűrés képzettség id-je (ÉP-tábla → Tulajdonságok fül ugrás; a KepzettsegRow `data-kep` = kulcs). */
const FÁJDALOMTŰRÉS_ID = 'fájdalomtűrés';

export function HarcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, onNavigate, gameMode, pendingDobás, onPendingDobásConsumed }: HarcBaseProps) {
  // Legfeljebb EGY Harc-popup nyitott (a típus a saját adatát viszi) - a „két popup egyszerre" állapot elő sem állhat.
  const [nyitott, setNyitott] = useState<HarcPopup | null>(null);
  const bezár = useCallback(() => setNyitott(null), []);
  const [sebCount, setSebCount] = useState(0);

  // Fejléc-harcértékek: közös számítás (az NJK switcher is ezt mutatja) - harc-fejlec-calc.ts
  const { hc, téLevonás, ctx, aktívTÉ, aktívVÉ } = harcFejlécÉrtékek(data, karakter, session, sebCount);
  const { hint, showHint } = useHint();

  const { véFlash, changeVé, véSzorzóInfo, setVéSzorzóInfo } = useVéCsökkenés(session, setSession, pushUndo, hc.véVeszSzorzó, hc.maxVéCsökk);

  // KÉ dobás handler
  const handleKéClick = useCallback(() => {
    setNyitott({ t: 'ké', eredmény: hc.ké + rollK20() });
  }, [hc.ké]);

  const handleKéDobásClose = useCallback((eredmény: number) => {
    setNyitott(null);
    setSession(prev => ({
      ...prev,
      ké_dobások: pushDobás(prev.ké_dobások ?? [], eredmény),
    }));
  }, [setSession]);

  const handleTamadoClose = useCallback((eredmény: { té: number; sp?: number; veCsökkentés?: number } | null) => {
    setNyitott(null);
    if (eredmény !== null) {
      setSession(prev => ({
        ...prev,
        té_dobások: pushTéDobás(prev.té_dobások ?? [], eredmény),
      }));
    }
  }, [setSession]);

  useSérültStátusz(sebCount, hc.oszlopMéret, session.aktív_státuszok, setSession);


  const { fárasztásDef, fárasztásEredmény, véCsökkentésSzorzó, véCsökkentésSzorzóForrás, teljesVédekezésDef } =
    taktikaVéCsökkentésÁllapot(data, karakter, session, hc.feltételTeljesül, hc.helyzetVéCsökkentés);

  // A TÉ chip / ProbaHub TÉ chip közös dispatch-e: Teljes Védekezés → info, Fárasztás → VÉ csökkentés popup,
  // különben rendes Támadó dobás. EGY igazságforrás (a pending effect és az onTéClick is ezt hívja).
  const openTámadóDobás = useCallback(() => {
    if (aktívTÉ == null) return;
    setNyitott({ t: teljesVédekezésDef ? 'teljesVédekezés' : fárasztásDef ? 'fárasztás' : 'támadó' });
  }, [aktívTÉ, teljesVédekezésDef, fárasztásDef]);

  // ProbaHub 🗡️: a Harc fülre váltás után itt nyílik meg a Támadó dobás / Manőver (a pendinget rögtön consume-oljuk).
  useEffect(() => {
    if (pendingDobás === 'támadó') openTámadóDobás();
    else if (pendingDobás === 'manőver') setNyitott({ t: 'manőverMód' });
    else return;
    onPendingDobásConsumed?.();
  }, [pendingDobás, openTámadóDobás, onPendingDobásConsumed]);

  const handleSebzésekChange = useCallback((sebzések: SebzésRubrika[], leírás: string) => {
    pushUndo(leírás, [{ field: 'session', prev: session }]);
    setSession(prev => ({ ...prev, sebzések }));
  }, [setSession, pushUndo, session]);

  const handleNavigateToFt = useCallback(() => {
    onNavigate?.('tulajdonsagok');
    // WORKAROUND: tab-render-delay - 200ms wait for tab transition to complete before scrolling
    setTimeout(() => {
      document.querySelector(`[data-kep="${FÁJDALOMTŰRÉS_ID}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 200);
  }, [onNavigate]);

  const hasFt = karakter.képzettségek.some(kp => kp.id === FÁJDALOMTŰRÉS_ID);
  // A kézben lévő fegyver definíciója (Támadó / Manőver popup: extrák + dobás-hatások); a dobás-info csak nyitott popupnál számol.
  const aktívFegyverDef = ctx ? lookupFegyver(data.fegyverek, ctx.result.fegyver_név) : undefined;
  const dobásInfo = () => collectDobásInfo(session, karakter, data, aktívFegyverDef, hc.feltételTeljesül);

  return (
    <div className="screen harc-screen">
      <h2>🗡️ Harc</h2>

      <HarcFegyverSection
        data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        onShowFegyverfogás={() => setNyitott({ t: 'fegyverfogás' })}
        páncélMGT={hc.páncélMGT} showHint={showHint}
      />

      <HarcHeader
        ké={hc.ké}
        aktívTÉ={aktívTÉ}
        aktívVÉ={aktívVÉ}
        sfé_fizikai={hc.sfé_fizikai}
        sfé_energia={hc.sfé_energia}
        páncélLefedettség={hc.páncélLefedettség}
        manöverPont={hc.manöverPont}
        manőverAlap={hc.manőverAlap}
        hm={karakter.HM_TÉ + karakter.HM_VÉ}
        maxVéCsökk={hc.maxVéCsökk}
        session={session}
        setSession={setSession}
        pushUndo={pushUndo}
        konstansok={data.konstansok}
        onVéChange={changeVé}
        onVéLabelTap={() => { if (session.vé_csökkenés > 0) setNyitott({ t: 'véHistory' }); }}
        onVéResetClick={() => setNyitott({ t: 'véReset' })}
        onKéClick={handleKéClick}
        onTéClick={openTámadóDobás}
        onSféClick={() => setNyitott({ t: 'páncélInfo' })}
        onManőverClick={() => setNyitott({ t: 'manőverMód' })}
        gameMode={gameMode}
      />

      <HarcFegyverTable
        karakter={karakter}
        session={session}
        data={data}
        fegyverResults={hc.fegyverResults}
        kétkezesResult={hc.kétkezesResult}
        fogásResult={hc.fogásResult}
        pajzsVÉ={hc.pajzsVÉ}
        pajzsFegyverNév={hc.pajzsFegyverNév}
        taktikaMods={hc.taktikaMods}
        helyzetMods={hc.helyzetMods}
        fortelyMods={hc.fortelyMods}
        téLevonás={téLevonás}
        belharciAktív={hc.belharciAktív}
        véFlash={véFlash}
        onTámInfoClick={info => setNyitott({ t: 'támInfo', info })}
        onFegyverInfoClick={result => setNyitott({ t: 'fegyverInfo', result })}
      />

      <div className="harc-section">
        <EpTable
          ÉP={hc.épValue}
          kategóriák={data.konstansok.sebesülés_kategóriák_száma}
          onSebCountChange={setSebCount}
          ftEnyhítés={calcFtEnyhítés(karakter.képzettségek, data.konstansok.fájdalomtűrés_enyhítés)}
          téLevonások={hc.téLevonások}
          onNavigate={hasFt ? handleNavigateToFt : undefined}
          sebzések={session.sebzések}
          onSebzésekChange={handleSebzésekChange}
          gameMode={gameMode}
        />
      </div>

      <HarcReszletek
        karakter={karakter}
        session={session}
        data={data}
        fegyverResults={hc.fegyverResults}
        kétkezesResult={hc.kétkezesResult}
        fogásResult={hc.fogásResult}
        taktikaMods={hc.taktikaMods}
        helyzetMods={hc.helyzetMods}
        fortelyMods={hc.fortelyMods}
        téLevonás={téLevonás}
        pajzsVÉ={hc.pajzsVÉ}
        páncélMGT={hc.páncélMGT}
        merevvértBüntetés={hc.merevvértBüntetés}
      />

      <HarcPopups
        session={session}
        showVéResetConfirm={nyitott?.t === 'véReset'}
        showVéHistory={nyitott?.t === 'véHistory'}
        támInfo={nyitott?.t === 'támInfo' ? nyitott.info : null}
        onVéReset={() => { changeVé(0, true); bezár(); }}
        onCloseAll={bezár}
      />

      {nyitott?.t === 'ké' && (
        <DobasPopup cím="Kezdeményezés" alapLabel="KÉ" alap={hc.ké} eredmény={nyitott.eredmény} onClose={handleKéDobásClose} />
      )}

      {nyitott?.t === 'fegyverInfo' && (
        <FegyverInfoPopup result={nyitott.result} karakter={karakter} data={data} onClose={bezár} />
      )}

      {véSzorzóInfo !== null && (
        <VeSzorzoInfoPopup alap={véSzorzóInfo} szorzó={hc.véVeszSzorzó} forrás={hc.véVeszSzorzóForrás} onClose={() => setVéSzorzóInfo(null)} />
      )}

      {nyitott?.t === 'támadó' && aktívTÉ != null && (
        <TamadoDobasPopup
          té={aktívTÉ}
          sp={ctx?.result.SP ?? 0}
          átütés={ctx?.result.Átütés ?? 0}
          módok={ctx?.result.módok}
          fegyverNév={ctx?.result.fegyver_név}
          páncélMátrix={data.sebzésjellegPáncélMátrix}
          fegyverExtrák={aktívFegyverDef?.extrák}
          extraDefs={data.fegyverExtrák}
          extraKontextus={hc.extraKontextus}
          dobásInfo={dobásInfo()}
          véCsökkentésAlap={data.konstansok.vé_csökkentés_alap}
          véCsökkentésSzorzó={véCsökkentésSzorzó}
          véCsökkentésSzorzóForrás={véCsökkentésSzorzóForrás}
          helyzetVéCsökkentés={hc.helyzetVéCsökkentés}
          data={data}
          karakter={karakter}
          session={session}
          setSession={setSession}
          pushUndo={pushUndo}
          onClose={handleTamadoClose}
        />
      )}

      {nyitott?.t === 'fárasztás' && fárasztásEredmény && (
        <VeCsokkentesPopup
          k20={0}
          alapTáblázat={data.konstansok.vé_csökkentés_alap}
          taktikaVéCsökkentés={fárasztásEredmény}
          taktikaCím="Fárasztás taktika"
          onClose={bezár}
        />
      )}

      {nyitott?.t === 'teljesVédekezés' && teljesVédekezésDef && (
        <TaktikaTiltvaInfoPopup
          cím="Teljes védekezés taktika"
          szöveg={teljesVédekezésDef.megjegyzés ?? ''}
          onClose={bezár}
        />
      )}

      {nyitott?.t === 'fegyverfogás' && (
        <HarcFegyverfogas
          data={data} karakter={karakter} session={session}
          onSelect={(patch) => { pushUndo(`Fogás: ${patch.fegyverfogás}`, [{ field: 'session', prev: session }]); setSession(s => ({ ...s, ...patch })); bezár(); }}
          onClose={bezár}
        />
      )}

      {nyitott?.t === 'páncélInfo' && setKarakter && (
        <PancelInfoPopup
          karakter={karakter}
          sfé_fizikai={hc.sfé_fizikai}
          sfé_energia={hc.sfé_energia}
          mgt={hc.páncélMGT}
          lefedettség={hc.páncélLefedettség}
          setKarakter={setKarakter}
          onClose={bezár}
        />
      )}

      {hint && <div className="he-hint">{hint}</div>}

      {(nyitott?.t === 'manőverMód' || nyitott?.t === 'manőverLista') && (
        <ManoverPicker
          fázis={nyitott.t === 'manőverMód' ? 'mód' : 'lista'}
          manoverek={data.manoverek}
          onMód={mód => setNyitott({ t: 'manőverLista', mód })}
          onPick={m => setNyitott({ t: 'manőver', manőver: m, mód: nyitott.t === 'manőverLista' ? nyitott.mód : 'aktív' })}
          onClose={bezár}
        />
      )}

      {nyitott?.t === 'manőver' && (
        <ManoverDobasPopup
          manőver={nyitott.manőver}
          mód={nyitott.mód}
          karakter={karakter}
          session={session}
          setSession={setSession}
          data={data}
          manőverAlap={hc.manőverAlap}
          aktívTÉ={aktívTÉ}
          aktívVÉ={aktívVÉ}
          téHatások={dobásInfo().téHatások}
          véCsökkentésAlap={data.konstansok.vé_csökkentés_alap}
          véCsökkentésSzorzó={véCsökkentésSzorzó}
          véCsökkentésSzorzóForrás={véCsökkentésSzorzóForrás}
          helyzetVéCsökkentés={hc.helyzetVéCsökkentés}
          fegyverExtrák={aktívFegyverDef?.extrák}
          extraDefs={data.fegyverExtrák}
          extraKontextus={hc.extraKontextus}
          onTéDobás={(té, veCsökkentés) => setSession(prev => ({ ...prev, té_dobások: pushTéDobás(prev.té_dobások ?? [], { té, veCsökkentés }) }))}
          onClose={bezár}
        />
      )}
    </div>
  );
}
