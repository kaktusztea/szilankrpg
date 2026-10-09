import { useState, useEffect, useRef, useCallback } from 'react';
import type { HarcBaseProps } from './types';
import type { FegyverResult } from './types';
import type { SebzésRubrika } from '../../engine/types';
import { useHarcComputed } from './useHarcComputed';
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
import { calcSérültFok } from './ep-logic';
import { DobasPopup, pushDobás, pushTéDobás } from './DobasPopup';
import { TamadoDobasPopup } from './TamadoDobasPopup';
import { VeCsokkentesPopup } from './VeCsokkentesPopup';
import { TaktikaTiltvaInfoPopup } from './TaktikaTiltvaInfoPopup';
import { calcTaktikaVéCsökkentés, calcVéCsökkentésSzorzó } from './ve-csokkentes-calc';
import { VeSzorzoInfoPopup } from './VeSzorzoInfoPopup';
import { PancelInfoPopup } from './PancelInfoPopup';
import { collectDobásInfo } from './combat-roll-info';
import { ManoverDobasPopup } from '../aktiv/ManoverDobasPopup';
import { téBontásÖsszeg } from '../aktiv/manover-dobas-calc';
import { ManoverPicker } from './ManoverPicker';
import { computeTÉ, computeVÉ, coalesceVéHistory } from './shared';
import { resolveAktívFegyverContext } from './aktiv-fegyver-ctx';
import { rollK20 } from '../../engine/dice';
import { VÉ_FLASH_MS, VÉ_COALESCE_MS } from '../../ui-constants';
import './HarcScreen.css';

export function HarcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, onNavigate, gameMode }: HarcBaseProps) {
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVéChangeRef = useRef<number>(0);
  const [showVéHistory, setShowVéHistory] = useState(false);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);
  const [véSzorzóInfo, setVéSzorzóInfo] = useState<number | null>(null);
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

  const hc = useHarcComputed(data, karakter, session);
  const { hint, showHint } = useHint();

  // VÉ flash animation
  const triggerVéFlash = useCallback((dir: 'down' | 'up') => {
    setVéFlash(dir);
    if (véFlashTimer.current) clearTimeout(véFlashTimer.current);
    véFlashTimer.current = setTimeout(() => setVéFlash(''), VÉ_FLASH_MS);
  }, []);

  /** delta: nyers változás (pozitív = csökkenés, negatív = visszanyerés); reset=true → teljes törlés. */
  const changeVé = useCallback((delta: number, reset = false) => {
    // Csökkenéskor (delta > 0) a "VÉ veszteség duplázódik" jellegű harci helyzetek szorzót adnak
    // (Földön fekve, Helyhez kötve, VÉ kiterjesztés - l. harci_helyzetek.yaml "duplázás" operátor).
    const scaledDelta = delta > 0 ? delta * hc.véVeszSzorzó : delta;
    if (delta > 0 && hc.véVeszSzorzó !== 1) setVéSzorzóInfo(delta);
    const newVal = reset ? 0 : Math.max(0, Math.min(session.vé_csökkenés + scaledDelta, hc.maxVéCsökk));
    const diff = newVal - session.vé_csökkenés;
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`, [{ field: 'session', prev: session }]);
    const now = Date.now();
    const elapsed = now - lastVéChangeRef.current;
    lastVéChangeRef.current = now;
    // history bejegyzés előjele: csökkenés → negatív, visszanyerés → pozitív
    const historyDelta = diff > 0 ? -diff : Math.abs(diff);
    setSession(prev => ({
      ...prev,
      vé_csökkenés: newVal,
      vé_history: newVal === 0 ? [] : coalesceVéHistory(prev.vé_history, historyDelta, elapsed, VÉ_COALESCE_MS),
    }));
    triggerVéFlash(diff > 0 ? 'down' : 'up');
  }, [session.vé_csökkenés, pushUndo, setSession, triggerVéFlash, hc.véVeszSzorzó, hc.maxVéCsökk]);

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

  // Támadó dobás handler: open the new TamadoDobasPopup
  const handleTéDobás = useCallback(() => {
    setShowTamadoDobas(true);
  }, []);

  const handleTamadoClose = useCallback((eredmény: { té: number; sp?: number; veCsökkentés?: number } | null) => {
    setShowTamadoDobas(false);
    if (eredmény !== null) {
      setSession(prev => ({
        ...prev,
        té_dobások: pushTéDobás(prev.té_dobások ?? [], eredmény),
      }));
    }
  }, [setSession]);

  // Popup close handler
  function closePopups() {
    setShowVéResetConfirm(false);
    setShowVéHistory(false);
    setTámInfo(null);
  }

  // Auto Sérült státusz
  useEffect(() => {
    const targetFok = calcSérültFok(sebCount, hc.oszlopMéret);
    const current = session.aktív_státuszok.find(s => s.startsWith('Sérült ('));
    const currentFok = current ? parseInt(current.match(/\((\d+)\)/)?.[1] ?? '0') : 0;
    if (targetFok === currentFok) return;
    setSession(prev => {
      const filtered = prev.aktív_státuszok.filter(s => !s.startsWith('Sérült ('));
      return targetFok === 0
        ? { ...prev, aktív_státuszok: filtered }
        : { ...prev, aktív_státuszok: [...filtered, `Sérült (${targetFok})`] };
    });
  }, [sebCount, hc.oszlopMéret]);

  // TÉ levonás az aktuális sérülés alapján (Fájdalomtűrés enyhítéssel)
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / hc.oszlopMéret) - 1);
  const ftEnyhítés = calcFtEnyhítés(karakter.képzettségek, data.konstansok.fájdalomtűrés_enyhítés);
  const rawTéLevonás = hc.téLevonások[aktKat];
  const téLevonás = rawTéLevonás === 0 ? 0 : Math.min(0, rawTéLevonás + ftEnyhítés);

  // Compute active weapon TÉ/VÉ for the header boxes
  const ctx = resolveAktívFegyverContext(hc, karakter, session, data);
  const többTámTÉ = data.konstansok.több_támadás_TÉ_levonás;
  const aktívTÉ = ctx ? computeTÉ(ctx.result.TÉ, téLevonás, hc.taktikaMods['TÉ'], ctx.téExtra, ctx.result.támadások, többTámTÉ) : null;
  const aktívVÉ = ctx ? computeVÉ(ctx.result.VÉ, ctx.veBónusz, hc.taktikaMods['VÉ'], session.vé_csökkenés) : null;

  // Fárasztás taktika (md/065_02): aktív esetén a TÉ chip NEM Támadó dobást nyit, hanem direktben
  // a VÉ csökkentés popup-ot (nincs támadódobás) - fix taktika-override + feltételes fortély-bővítés.
  const fárasztásAktív = session.aktív_taktikák.some(t => t.név === 'Fárasztás');
  const fárasztásDef = fárasztásAktív ? data.taktikak.find(t => t.név === 'Fárasztás') : undefined;
  const fárasztásFortélyModosítók = karakter.fortélyok
    .map(kf => {
      const def = data.fortelySummaries.find(d => d.név === kf.név);
      const fokDef = def?.fokok.find(f => f.fok === kf.fok);
      return fokDef?.módosítók?.length ? { forrás: kf.név, módosítók: fokDef.módosítók } : null;
    })
    .filter((x): x is { forrás: string; módosítók: NonNullable<typeof x>['módosítók'] } => x !== null);
  const fárasztásEredmény = fárasztásDef
    ? calcTaktikaVéCsökkentés(fárasztásDef.hatások, fárasztásFortélyModosítók, hc.feltételTeljesül)
    : null;

  // Roham / Öngyilkos roham (md/065_02): "VÉ csökk 2x" - a Fegyverviszony-alapú VÉ csökkentés
  // (bázis+k20P) szorzója, a taktika `hatások` tömbjéből (nem akkumulálva, csak kinyerve).
  const véCsökkentésSzorzó = session.aktív_taktikák.reduce((szorzó, t) => {
    const def = data.taktikak.find(d => d.név === t.név);
    return szorzó * calcVéCsökkentésSzorzó(def?.hatások);
  }, 1);

  // Teljes Védekezés (md/065_02): nem támad - a TÉ chip info popup-ot nyit a dobás helyett.
  const teljesVédekezésAktív = session.aktív_taktikák.some(t => t.név === 'Teljes Védekezés');
  const teljesVédekezésDef = teljesVédekezésAktív ? data.taktikak.find(t => t.név === 'Teljes Védekezés') : undefined;

  const handleSebzésekChange = useCallback((sebzések: SebzésRubrika[], leírás: string) => {
    pushUndo(leírás, [{ field: 'session', prev: session }]);
    setSession(prev => ({ ...prev, sebzések }));
  }, [setSession, pushUndo, session]);

  const handleNavigateToFt = useCallback(() => {
    onNavigate?.('tulajdonsagok');
    // WORKAROUND: tab-render-delay - 200ms wait for tab transition to complete before scrolling
    setTimeout(() => {
      document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 200);
  }, [onNavigate]);

  const hasFt = karakter.képzettségek.some(kp => kp.név === 'Fájdalomtűrés');

  // Base TÉ/VÉ for manőver popup (approximation without per-weapon calc).
  const baseTÉ = téBontásÖsszeg(karakter, data);
  const baseVÉ = (data.konstansok.harcérték_alap?.VÉ ?? 0) + karakter.tulajdonságok.gyorsaság + karakter.tulajdonságok.ügyesség + karakter.HM_VÉ - session.vé_csökkenés;

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
        onTéClick={() => {
          if (aktívTÉ == null) return;
          if (teljesVédekezésAktív) setShowTeljesVédekezésInfo(true);
          else if (fárasztásAktív) setShowFárasztásVéCsökkentés(true);
          else handleTéDobás();
        }}
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
          aktívTÉ={baseTÉ}
          aktívVÉ={baseVÉ}
          onClose={() => setPopupManőver(null)}
        />
      )}
    </div>
  );
}
