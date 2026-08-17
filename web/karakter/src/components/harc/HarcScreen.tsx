import { useState, useEffect, useRef, useCallback } from 'react';
import type { HarcBaseProps } from './types';
import type { SebzésRubrika } from '../../engine/types';
import { useHarcComputed } from './useHarcComputed';
import { useHint } from '../harcertekek/hooks/useHint';
import { HarcHeader } from './HarcHeader';
import { HarcFegyverTable } from './HarcFegyverTable';
import { HarcPopups } from './HarcPopups';
import { EpTable } from './EpTable';
import { HarcReszletek } from './HarcReszletek';
import { HarcFegyverSection } from './HarcFegyverSection';
import { HarcFegyverfogas } from './HarcFegyverfogas';
import { calcFtEnyhites as calcFtEnyhítés } from './pancel-calc';
import { calcSérültFok } from './ep-logic';
import { DobasPopup, pushDobás } from './DobasPopup';
import { TamadoDobasPopup } from './TamadoDobasPopup';
import { PancelInfoPopup } from './PancelInfoPopup';
import { collectDobásInfo } from './combat-roll-info';
import { ManoverDobasPopup } from '../aktiv/ManoverDobasPopup';
import { PickerOverlay } from '../aktiv/PickerOverlay';
import { computeTÉ, computeVÉ } from './shared';
import { lookupFegyver } from '../../engine/utils';
import { rollK20 } from '../../engine/dice';
import './HarcScreen.css';

export function HarcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, onNavigate, gameMode }: HarcBaseProps) {
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showVéHistory, setShowVéHistory] = useState(false);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);
  const [támInfo, setTámInfo] = useState<{ név: string; sebesség: number; harckeret: number; hk_harcmodor: number; hk_gyorsaság: number; hk_mgt: number; hk_felszerelés_mgt: number; hk_fortély: number } | null>(null);
  const [sebCount, setSebCount] = useState(0);
  const [kéDobásEredmény, setKéDobásEredmény] = useState<number | null>(null);
  const [showTamadoDobas, setShowTamadoDobas] = useState(false);
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
    véFlashTimer.current = setTimeout(() => setVéFlash(''), 1000);
  }, []);

  const changeVé = useCallback((newVal: number) => {
    const diff = newVal - session.vé_csökkenés;
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`, [{ field: 'session', prev: session }]);
    setSession(prev => ({
      ...prev,
      vé_csökkenés: newVal,
      vé_history: newVal === 0 ? [] : [...prev.vé_history, diff > 0 ? -diff : Math.abs(diff)],
    }));
    triggerVéFlash(diff > 0 ? 'down' : 'up');
  }, [session.vé_csökkenés, pushUndo, setSession, triggerVéFlash]);

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

  const handleTamadoClose = useCallback((eredmény: number | null) => {
    setShowTamadoDobas(false);
    if (eredmény !== null) {
      setSession(prev => ({
        ...prev,
        té_dobások: pushDobás(prev.té_dobások ?? [], eredmény),
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
  const getAktívFegyverContext = useCallback(() => {
    if (hc.kétkezesResult) return { result: hc.kétkezesResult, veBónusz: hc.pajzsVÉ, téExtra: 0 };
    if (hc.fogásResult) {
      const jobbIdx = session.aktív_fegyver_index;
      const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
      const jobbNév = jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? 'Puszta kéz') : 'Puszta kéz';
      const r = hc.fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? hc.fegyverResults[0];
      return r ? { result: r, veBónusz: hc.fogásResult.VÉ_bónusz, téExtra: hc.fogásResult.TÉ_büntetés } : null;
    }
    if (session.aktív_fegyver_index === -2) {
      const r = hc.fegyverResults.find(fr => fr.fegyver_név === (hc.pajzsFegyverNév ?? ''));
      return r ? { result: r, veBónusz: hc.pajzsVÉ, téExtra: 0 } : null;
    }
    const jobbIdx = session.aktív_fegyver_index;
    const jobbFp = jobbIdx >= 0 ? karakter.fegyverek[jobbIdx] : null;
    const jobbNév = jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? 'Puszta kéz') : 'Puszta kéz';
    const r = hc.fegyverResults.find(fr => fr.fegyver_név === jobbNév);
    return r ? { result: r, veBónusz: hc.pajzsVÉ, téExtra: 0 } : null;
  }, [hc, session.aktív_fegyver_index, karakter.fegyverek, data]);

  const ctx = getAktívFegyverContext();
  const többTámTÉ = data.konstansok.több_támadás_TÉ_levonás;
  const aktívTÉ = ctx ? computeTÉ(ctx.result.TÉ, téLevonás, hc.taktikaMods['TÉ'], ctx.téExtra, ctx.result.támadások, többTámTÉ) : null;
  const aktívVÉ = ctx ? computeVÉ(ctx.result.VÉ, ctx.veBónusz, hc.taktikaMods['VÉ'], session.vé_csökkenés) : null;

  const handleSebzésekChange = useCallback((sebzések: SebzésRubrika[], leírás: string) => {
    pushUndo(leírás, [{ field: 'session', prev: session }]);
    setSession(prev => ({ ...prev, sebzések }));
  }, [setSession, pushUndo, session]);

  const handleNavigateToFt = useCallback(() => {
    onNavigate?.('tulajdonsagok');
    setTimeout(() => {
      document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 200);
  }, [onNavigate]);

  const hasFt = karakter.képzettségek.some(kp => kp.név === 'Fájdalomtűrés');

  // Base TÉ/VÉ for manőver popup (approximation without per-weapon calc).
  const baseTÉ = (data.konstansok.harcérték_alap?.TÉ ?? 0) + karakter.tulajdonságok.erő + karakter.tulajdonságok.ügyesség + karakter.tulajdonságok.gyorsaság + karakter.HM_TÉ;
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
        maxVéCsökk={hc.maxVéCsökk}
        session={session}
        setSession={setSession}
        pushUndo={pushUndo}
        konstansok={data.konstansok}
        onVéChange={changeVé}
        onVéLabelTap={() => { if (session.vé_csökkenés > 0) setShowVéHistory(true); }}
        onVéResetClick={() => setShowVéResetConfirm(true)}
        onKéClick={handleKéClick}
        onTéClick={() => { if (aktívTÉ != null) handleTéDobás(); }}
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
        onVéReset={() => { changeVé(0); setShowVéResetConfirm(false); }}
        onCloseAll={closePopups}
      />

      {kéDobásEredmény !== null && (
        <DobasPopup cím="Kezdeményezés" alapLabel="KÉ" alap={hc.ké} eredmény={kéDobásEredmény} onClose={handleKéDobásClose} />
      )}

      {showTamadoDobas && aktívTÉ != null && (
        <TamadoDobasPopup
          té={aktívTÉ}
          sp={ctx?.result.SP ?? 0}
          dobásInfo={collectDobásInfo(session, karakter, data)}
          onClose={handleTamadoClose}
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

      {manoverPicker === 'mód' && (
        <PickerOverlay title="Manőver mód" onClose={() => setManoverPicker('closed')}>
          <div className="aktiv-picker-item manover-mod-btn" onClick={() => { setManoverMód('aktív'); setManoverPicker('lista'); }}>
            <span className="aktiv-picker-item-name">⚔️ Aktív</span>
            <span className="aktiv-picker-item-details">Én hajtom végre a manővert</span>
          </div>
          <div className="aktiv-picker-item manover-mod-btn" onClick={() => { setManoverMód('passzív'); setManoverPicker('lista'); }}>
            <span className="aktiv-picker-item-name">🛡️ Passzív</span>
            <span className="aktiv-picker-item-details">Ellenem hajtják végre</span>
          </div>
        </PickerOverlay>
      )}

      {manoverPicker === 'lista' && (
        <PickerOverlay title="Manőver választó" onClose={() => setManoverPicker('closed')}>
          {(['általános', 'belharcos', 'lovas'] as const).map(típus => {
            const items = data.manoverek.filter(m => m.típus === típus);
            if (items.length === 0) return null;
            return (
              <div key={típus}>
                <div className="aktiv-picker-category">{típus === 'általános' ? 'Általános' : típus === 'belharcos' ? 'Belharci' : 'Lovas'}</div>
                {items.map(m => (
                  <div key={m.név} className="aktiv-picker-item"
                    onClick={() => { setPopupManőver(m); setManoverPicker('closed'); }}>
                    <span className="aktiv-picker-item-name">{m.név}</span>
                    <span className="aktiv-picker-item-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                    <span className="aktiv-picker-item-hatas">{m.hatás}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </PickerOverlay>
      )}

      {popupManőver && (
        <ManoverDobasPopup
          manőver={popupManőver}
          mód={manoverMód}
          karakter={karakter}
          session={session}
          setSession={setSession}
          data={data}
          aktívTÉ={baseTÉ}
          aktívVÉ={baseVÉ}
          onClose={() => setPopupManőver(null)}
        />
      )}
    </div>
  );
}
