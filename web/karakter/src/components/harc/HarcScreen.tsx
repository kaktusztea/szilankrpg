import { useState, useCallback, useEffect } from 'react';
import type { HarcBaseProps } from './types';
import type { FegyverResult } from './types';
import type { SebzésRubrika } from '../../engine/types';
import { harcFejlécÉrtékek } from './harc-fejlec-calc';
import { useHint } from '../harcertekek/hooks/useHint';
import { HarcHeader } from './HarcHeader';
import { HarcFegyverTable } from './HarcFegyverTable';
import { FegyverInfoPopup } from './FegyverInfoPopup';
import { HarcPopups } from './HarcPopups';
import { EpTable } from './EpTable';
import { HarcReszletek } from './HarcReszletek';
import { HarcFegyverSection } from './HarcFegyverSection';
import { HarcFegyverfogas } from './HarcFegyverfogas';
import { calcFtEnyhites as calcFtEnyhítés } from './pancel-calc';
import { DobasPopup, pushDobás, pushTéDobás } from './DobasPopup';
import { TamadoDobasPopup } from './TamadoDobasPopup';
import { VeCsokkentesPopup } from './VeCsokkentesPopup';
import { TaktikaTiltvaInfoPopup } from './TaktikaTiltvaInfoPopup';
import { taktikaVéCsökkentésÁllapot } from './ve-csokkentes-calc';
import { useSérültStátusz } from './useSerultStatusz';
import { useVéCsökkenés } from './useVeCsokkenes';
import { VeSzorzoInfoPopup } from './VeSzorzoInfoPopup';
import { PancelInfoPopup } from './PancelInfoPopup';
import { collectDobásInfo } from './combat-roll-info';
import { ManoverDobasPopup } from '../aktiv/ManoverDobasPopup';
import { ManoverPicker } from './ManoverPicker';
import { rollK20 } from '../../engine/dice';
import './HarcScreen.css';

/** A Fájdalomtűrés képzettség id-je (ÉP-tábla → Tulajdonságok fül ugrás; a KepzettsegRow `data-kep` = kulcs). */
const FÁJDALOMTŰRÉS_ID = 'fájdalomtűrés';

export function HarcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, onNavigate, gameMode, pendingDobás, onPendingDobásConsumed }: HarcBaseProps) {
  const [showVéHistory, setShowVéHistory] = useState(false);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);
  const [támInfo, setTámInfo] = useState<{ név: string; sebesség: number; harckeret: number; hk_harcmodor: number; hk_gyorsaság: number; hk_mgt: number; hk_fortély: number } | null>(null);
  const [fegyverInfo, setFegyverInfo] = useState<FegyverResult | null>(null);
  const [sebCount, setSebCount] = useState(0);
  const [kéDobásEredmény, setKéDobásEredmény] = useState<number | null>(null);
  const [showTamadoDobas, setShowTamadoDobas] = useState(false);
  const [showFárasztásVéCsökkentés, setShowFárasztásVéCsökkentés] = useState(false);
  const [showTeljesVédekezésInfo, setShowTeljesVédekezésInfo] = useState(false);
  const [showFegyverfogás, setShowFegyverfogás] = useState(false);
  const [showPancelInfo, setShowPancelInfo] = useState(false);
  // Manőver state
  const [manoverPicker, setManoverPicker] = useState<'closed' | 'mód' | 'lista'>('closed');
  const [manoverMód, setManoverMód] = useState<'aktív' | 'passzív'>('aktív');
  const [popupManőver, setPopupManőver] = useState<typeof data.manoverek[number] | null>(null);

  // Fejléc-harcértékek: közös számítás (az NJK switcher is ezt mutatja) - harc-fejlec-calc.ts
  const { hc, téLevonás, ctx, aktívTÉ, aktívVÉ } = harcFejlécÉrtékek(data, karakter, session, sebCount);
  const { hint, showHint } = useHint();

  const { véFlash, changeVé, véSzorzóInfo, setVéSzorzóInfo } = useVéCsökkenés(session, setSession, pushUndo, hc.véVeszSzorzó, hc.maxVéCsökk);

  // KÉ dobás handler
  const handleKéClick = useCallback(() => {
    setKéDobásEredmény(hc.ké + rollK20());
  }, [hc.ké]);

  const handleKéDobásClose = useCallback((eredmény: number) => {
    setKéDobásEredmény(null);
    setSession(prev => ({
      ...prev,
      ké_dobások: pushDobás(prev.ké_dobások ?? [], eredmény),
    }));
  }, [setSession]);

  const handleTamadoClose = useCallback((eredmény: { té: number; sp?: number; veCsökkentés?: number } | null) => {
    setShowTamadoDobas(false);
    if (eredmény !== null) {
      setSession(prev => ({
        ...prev,
        té_dobások: pushTéDobás(prev.té_dobások ?? [], eredmény),
      }));
    }
  }, [setSession]);

  // „Gyengébb kéz" harci helyzet be/ki a Támadó dobás ablakból (csak Kétkezes harcnál jelenik meg).
  // Ugyanazt a session.aktív_helyzetek tömböt írja, mint az Aktív fül picker-e → egy igazságforrás,
  // a hatás a megszokott HatasokInfo badge-sorban (Hátrány-1 Gyengébb kéz) jelenik meg.
  // Popup close handler
  function closePopups() {
    setShowVéResetConfirm(false);
    setShowVéHistory(false);
    setTámInfo(null);
  }

  useSérültStátusz(sebCount, hc.oszlopMéret, session.aktív_státuszok, setSession);


  const { fárasztásDef, fárasztásEredmény, véCsökkentésSzorzó, véCsökkentésSzorzóForrás, teljesVédekezésDef } =
    taktikaVéCsökkentésÁllapot(data, karakter, session, hc.feltételTeljesül, hc.helyzetVéCsökkentés);

  // A TÉ chip / ProbaHub 🗡️ közös dispatch-e: Teljes Védekezés → info, Fárasztás → VÉ csökkentés popup,
  // különben rendes Támadó dobás. EGY igazságforrás (a pending effect és az onTéClick is ezt hívja).
  const openTámadóDobás = useCallback(() => {
    if (aktívTÉ == null) return;
    if (teljesVédekezésDef) setShowTeljesVédekezésInfo(true);
    else if (fárasztásDef) setShowFárasztásVéCsökkentés(true);
    else setShowTamadoDobas(true);
  }, [aktívTÉ, teljesVédekezésDef, fárasztásDef]);

  // ProbaHub 🗡️: a Harc fülre váltás után itt nyílik meg a Támadó dobás (a pendinget rögtön consume-oljuk).
  useEffect(() => {
    if (pendingDobás !== 'támadó') return;
    openTámadóDobás();
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

  return (
    <div className="screen harc-screen">
      <h2>🗡️ Harc</h2>

      <HarcFegyverSection
        data={data} karakter={karakter} session={session} setSession={setSession} pushUndo={pushUndo}
        onShowFegyverfogás={() => setShowFegyverfogás(true)}
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
        onVéLabelTap={() => { if (session.vé_csökkenés > 0) setShowVéHistory(true); }}
        onVéResetClick={() => setShowVéResetConfirm(true)}
        onKéClick={handleKéClick}
        onTéClick={openTámadóDobás}
        onSféClick={() => setShowPancelInfo(true)}
        onManőverClick={() => setManoverPicker('mód')}
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
        onTámInfoClick={setTámInfo}
        onFegyverInfoClick={setFegyverInfo}
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
        showVéResetConfirm={showVéResetConfirm}
        showVéHistory={showVéHistory}
        támInfo={támInfo}
        onVéReset={() => { changeVé(0, true); setShowVéResetConfirm(false); }}
        onCloseAll={closePopups}
      />

      {kéDobásEredmény !== null && (
        <DobasPopup cím="Kezdeményezés" alapLabel="KÉ" alap={hc.ké} eredmény={kéDobásEredmény} onClose={handleKéDobásClose} />
      )}

      {fegyverInfo !== null && (
        <FegyverInfoPopup result={fegyverInfo} karakter={karakter} data={data} onClose={() => setFegyverInfo(null)} />
      )}

      {véSzorzóInfo !== null && (
        <VeSzorzoInfoPopup alap={véSzorzóInfo} szorzó={hc.véVeszSzorzó} forrás={hc.véVeszSzorzóForrás} onClose={() => setVéSzorzóInfo(null)} />
      )}

      {showTamadoDobas && aktívTÉ != null && (
        <TamadoDobasPopup
          té={aktívTÉ}
          sp={ctx?.result.SP ?? 0}
          átütés={ctx?.result.Átütés ?? 0}
          módok={ctx?.result.módok}
          páncélMátrix={data.sebzésjellegPáncélMátrix}
          fegyverExtrák={ctx ? data.fegyverek.find(f => f.név === ctx.result.fegyver_név)?.extrák : undefined}
          extraDefs={data.fegyverExtrák}
          extraKontextus={hc.extraKontextus}
          dobásInfo={collectDobásInfo(session, karakter, data, data.fegyverek.find(f => f.név === ctx?.result.fegyver_név))}
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

      {showFárasztásVéCsökkentés && fárasztásEredmény && (
        <VeCsokkentesPopup
          k20={0}
          alapTáblázat={data.konstansok.vé_csökkentés_alap}
          taktikaVéCsökkentés={fárasztásEredmény}
          taktikaCím="Fárasztás taktika"
          onClose={() => setShowFárasztásVéCsökkentés(false)}
        />
      )}

      {showTeljesVédekezésInfo && teljesVédekezésDef && (
        <TaktikaTiltvaInfoPopup
          cím="Teljes védekezés taktika"
          szöveg={teljesVédekezésDef.megjegyzés ?? ''}
          onClose={() => setShowTeljesVédekezésInfo(false)}
        />
      )}

      {showFegyverfogás && (
        <HarcFegyverfogas
          data={data} karakter={karakter} session={session}
          onSelect={(patch) => { pushUndo(`Fogás: ${patch.fegyverfogás}`, [{ field: 'session', prev: session }]); setSession(s => ({ ...s, ...patch })); setShowFegyverfogás(false); }}
          onClose={() => setShowFegyverfogás(false)}
        />
      )}

      {showPancelInfo && setKarakter && (
        <PancelInfoPopup
          karakter={karakter}
          sfé_fizikai={hc.sfé_fizikai}
          sfé_energia={hc.sfé_energia}
          mgt={hc.páncélMGT}
          lefedettség={hc.páncélLefedettség}
          setKarakter={setKarakter}
          onClose={() => setShowPancelInfo(false)}
        />
      )}

      {hint && <div className="he-hint">{hint}</div>}

      {manoverPicker !== 'closed' && (
        <ManoverPicker
          fázis={manoverPicker}
          manoverek={data.manoverek}
          onMód={mód => { setManoverMód(mód); setManoverPicker('lista'); }}
          onPick={m => { setPopupManőver(m); setManoverPicker('closed'); }}
          onClose={() => setManoverPicker('closed')}
        />
      )}

      {popupManőver && (
        <ManoverDobasPopup
          manőver={popupManőver}
          mód={manoverMód}
          karakter={karakter}
          session={session}
          setSession={setSession}
          data={data}
          manőverAlap={hc.manőverAlap}
          aktívTÉ={aktívTÉ}
          aktívVÉ={aktívVÉ}
          téHatások={collectDobásInfo(session, karakter, data, data.fegyverek.find(f => f.név === ctx?.result.fegyver_név)).téHatások}
          véCsökkentésAlap={data.konstansok.vé_csökkentés_alap}
          véCsökkentésSzorzó={véCsökkentésSzorzó}
          véCsökkentésSzorzóForrás={véCsökkentésSzorzóForrás}
          helyzetVéCsökkentés={hc.helyzetVéCsökkentés}
          fegyverExtrák={ctx ? data.fegyverek.find(f => f.név === ctx.result.fegyver_név)?.extrák : undefined}
          extraDefs={data.fegyverExtrák}
          extraKontextus={hc.extraKontextus}
          onTéDobás={(té, veCsökkentés) => setSession(prev => ({ ...prev, té_dobások: pushTéDobás(prev.té_dobások ?? [], { té, veCsökkentés }) }))}
          onClose={() => setPopupManőver(null)}
        />
      )}
    </div>
  );
}
