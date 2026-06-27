import { useState, useEffect } from 'react';
import type { MisztikusScreenProps } from './types';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { evaluate, buildContext } from '../../engine/reactive';
import { findDef as findKepzDef } from '../tulajdonsagok/helpers';
import { AuraPanel } from './AuraPanel';
import { TradícióSection } from './TradicioSection';
import { ArkánumokSection } from './ArkanumokSection';
import { FajMisztériumSection } from './FajMiszteriumSection';
import { ŐsiNyelvSection } from './OsiNyelvSection';
import { MisztikusFortélyokSection } from './MisztikusFortelyokSection';
import { MisztikusPopups } from './MisztikusPopups';
import './MisztikusScreen.css';

export function MisztikusScreen({ data, karakter, képzettségek, setKépzettségek, fortélyok, setFortélyok, gameMode }: MisztikusScreenProps) {
  const konstansok = data.konstansok;

  // Popups state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [szintTarget, setSzintTarget] = useState<string | null>(null);
  const [promptTarget, setPromptTarget] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [tradícióPicker, setTradícióPicker] = useState(false);
  const [tradícióAltípusPicker, setTradícióAltípusPicker] = useState<string | null>(null);
  const [felvételDef, setFelvételDef] = useState<FortelySummary | null>(null);
  const [misztFokTarget, setMisztFokTarget] = useState<number | null>(null);
  const [deleteFortIdx, setDeleteFortIdx] = useState<number | null>(null);
  const [hint, setHint] = useState('');
  const [infoTarget, setInfoTarget] = useState<string | null>(null);

  // Escape handler
  const anyPopupOpen = deleteTarget || szintTarget || promptTarget || tradícióPicker || tradícióAltípusPicker || felvételDef || misztFokTarget !== null || deleteFortIdx !== null;
  useEffect(() => {
    if (!anyPopupOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDeleteTarget(null); setSzintTarget(null); setPromptTarget(null);
        setTradícióPicker(false); setTradícióAltípusPicker(null);
        setFelvételDef(null); setMisztFokTarget(null); setDeleteFortIdx(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [anyPopupOpen]);

  // Aura computation
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok as any, {});
  const computed = evaluate(data.rules, ctx);
  const aura = computed.get('Aura') ?? 0;
  const me = aura + (konstansok as any).aura.mágiaellenállás_konstans;

  // Derived data
  const maxSzint = karakter.tsz;
  const tradíció = képzettségek.find(k => k.név.startsWith('Tradíció'));
  const arkánumok = képzettségek.filter(k => k.név.startsWith('Arkánum')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  const ősiNyelvek = képzettségek.filter(k => k.név.startsWith('Ősi nyelv ismerete')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  const felvettArkNevek = new Set(arkánumok.map(a => a.név));
  const elérhetőArkánumok = data.kepzettsegDefs.filter(d => d.név.startsWith('Arkánum:') && !felvettArkNevek.has(d.név));
  const tradícióOpciók = data.tradiciok ?? [];
  const misztFortDefs = data.fortelySummaries.filter(d => d.csoport === 'misztikus');

  // Faj misztérium
  const fajNév = karakter.hátterek.faj;
  const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : '';
  const fajMisztSzint = (fajMisztNév ? képzettségek.find(k => k.név === fajMisztNév)?.szint : 0) ?? 0;

  // Képzettség actions
  function addKépzettség(név: string) {
    setKépzettségek(prev => [...prev, { név, szint: 1 }]);
    setSzintTarget(név);
  }
  function removeKépzettség(név: string) {
    setKépzettségek(prev => prev.filter(k => k.név !== név));
  }
  function setSzint(név: string, szint: number) {
    setKépzettségek(prev => prev.map(k => k.név === név ? { ...k, szint } : k));
  }

  function showHint(msg: string) {
    setHint(msg);
    setTimeout(() => setHint(''), 2000);
  }

  // Info accordion helpers
  const findDef = (név: string) => findKepzDef(név, data.kepzettsegDefs);
  const felvettFortelyok = karakter.fortélyok.map(f => f.név);
  function handleInfoToggle(key: string) {
    setInfoTarget(prev => prev === key ? null : key);
  }

  // Popup action handlers
  function handleSzintPick(szint: number) {
    if (!szintTarget) return;
    if (szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== szintTarget));
    else if (!képzettségek.find(k => k.név === szintTarget)) setKépzettségek(prev => [...prev, { név: szintTarget!, szint }]);
    else setSzint(szintTarget, szint);
    setSzintTarget(null);
  }

  function handleTradícióPick(név: string) {
    addKépzettség(`Tradíció: ${név}`);
    setTradícióPicker(false);
  }

  function handleTradícióAltípusPick(tradíció: string, altípus: string) {
    addKépzettség(`Tradíció: ${tradíció} (${altípus})`);
    setTradícióAltípusPicker(null);
  }

  function handlePromptConfirm() {
    if (promptTarget && promptValue.trim()) {
      addKépzettség(`${promptTarget}: ${promptValue.trim()}`);
      setPromptTarget(null);
    }
  }

  function handleFokPick(fok: number) {
    if (misztFokTarget === null) return;
    setFortélyok(prev => prev.map((f, j) => j === misztFokTarget ? { ...f, fok } : f));
    setMisztFokTarget(null);
  }

  // Popup derived values
  const currentSzint = szintTarget ? (képzettségek.find(k => k.név === szintTarget)?.szint ?? 0) : 0;
  const fokTargetFortély = misztFokTarget !== null ? fortélyok[misztFokTarget] : null;
  const fokTargetDef = fokTargetFortély ? misztFortDefs.find(d => d.név === fokTargetFortély.név) : null;
  const deleteFortSlot = deleteFortIdx !== null ? fortélyok[deleteFortIdx] : null;
  const deleteFortLabel = deleteFortSlot ? `${deleteFortSlot.név}${deleteFortSlot.spec_elem ? ` - ${deleteFortSlot.spec_elem}` : ''}` : '';

  return (
    <div className="screen miszt-screen">
      <h2>✨ Misztikus</h2>

      <AuraPanel aura={aura} me={me} />

      <TradícióSection
        tradíció={tradíció} maxSzint={maxSzint} gameMode={gameMode}
        infoTarget={infoTarget} onInfoToggle={handleInfoToggle}
        findDef={findDef} kiterjesztesek={data.kiterjesztesek} felvettFortelyok={felvettFortelyok}
        onEdit={setSzintTarget} onDelete={setDeleteTarget} onPickTradíció={() => setTradícióPicker(true)}
      />

      <ArkánumokSection
        arkánumok={arkánumok} elérhetőArkánumok={elérhetőArkánumok}
        hasTradíció={!!tradíció} maxSzint={maxSzint} gameMode={gameMode}
        infoTarget={infoTarget} onInfoToggle={handleInfoToggle}
        findDef={findDef} kiterjesztesek={data.kiterjesztesek} felvettFortelyok={felvettFortelyok}
        onEdit={setSzintTarget} onDelete={setDeleteTarget} onAdd={addKépzettség}
      />

      <FajMisztériumSection
        fajNév={fajNév} szint={fajMisztSzint} maxSzint={maxSzint}
        gameMode={gameMode} onEdit={setSzintTarget}
        infoTarget={infoTarget} onInfoToggle={handleInfoToggle}
        findDef={findDef} kiterjesztesek={data.kiterjesztesek} felvettFortelyok={felvettFortelyok}
      />

      <ŐsiNyelvSection
        ősiNyelvek={ősiNyelvek} maxSzint={maxSzint} gameMode={gameMode}
        infoTarget={infoTarget} onInfoToggle={handleInfoToggle}
        findDef={findDef} kiterjesztesek={data.kiterjesztesek} felvettFortelyok={felvettFortelyok}
        onEdit={setSzintTarget} onDelete={setDeleteTarget}
        onAdd={() => { setPromptTarget('Ősi nyelv ismerete'); setPromptValue(''); }}
      />

      <MisztikusFortélyokSection
        misztFortDefs={misztFortDefs} fortélyok={fortélyok} gameMode={gameMode}
        képzettségek={képzettségek} infoTarget={infoTarget} onInfoToggle={handleInfoToggle}
        onFelvétel={setFelvételDef} onFokChange={setMisztFokTarget}
        onDelete={setDeleteFortIdx} onHint={showHint}
      />

      {hint && <div className="he-hint">{hint}</div>}

      <MisztikusPopups
        deleteTarget={deleteTarget}
        onConfirmDelete={() => { if (deleteTarget) { removeKépzettség(deleteTarget); setDeleteTarget(null); } }}
        onCancelDelete={() => setDeleteTarget(null)}
        szintTarget={szintTarget} currentSzint={currentSzint}
        onSzintPick={handleSzintPick} onCancelSzint={() => setSzintTarget(null)}
        promptTarget={promptTarget} promptValue={promptValue}
        onPromptChange={setPromptValue} onPromptConfirm={handlePromptConfirm}
        onCancelPrompt={() => setPromptTarget(null)}
        tradícióPicker={tradícióPicker} tradícióOpciók={tradícióOpciók}
        onPickTradíció={handleTradícióPick}
        onPickTradícióAltípus={(név) => { setTradícióPicker(false); setTradícióAltípusPicker(név); }}
        onCancelTradíció={() => setTradícióPicker(false)}
        tradícióAltípusPicker={tradícióAltípusPicker}
        onConfirmAltípus={handleTradícióAltípusPick}
        onCancelAltípus={() => setTradícióAltípusPicker(null)}
        felvételDef={felvételDef} fortélyok={fortélyok}
        onFelvételDone={(result: Fortely) => { setFortélyok(prev => [...prev, result]); setFelvételDef(null); }}
        onFelvételCancel={() => setFelvételDef(null)}
        misztFokTarget={misztFokTarget}
        misztFokMaxfok={fokTargetDef?.maxfok ?? 3}
        misztFokCurrentFok={fokTargetFortély?.fok ?? 0}
        onFokPick={handleFokPick} onCancelFok={() => setMisztFokTarget(null)}
        deleteFortIdx={deleteFortIdx} deleteFortNév={deleteFortLabel}
        onConfirmDeleteFort={() => { if (deleteFortIdx !== null) { setFortélyok(prev => prev.filter((_, j) => j !== deleteFortIdx)); setDeleteFortIdx(null); } }}
        onCancelDeleteFort={() => setDeleteFortIdx(null)}
      />
    </div>
  );
}
