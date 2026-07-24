import { useState } from 'react';
import type { MisztikusScreenProps, SectionContext } from './types';
import type { Fortely } from '../../engine/types';
import { evaluate, buildContext } from '../../engine/reactive';
import { findDef as findKepzDef } from '../tulajdonsagok/helpers';
import { useMisztikusPopups } from './useMisztikusPopups';
import { AuraPanel } from './AuraPanel';
import { TradícióSection } from './TradicioSection';
import { ArkánumokSection } from './ArkanumokSection';
import { FajMisztériumSection } from './FajMiszteriumSection';
import { ŐsiNyelvSection } from './OsiNyelvSection';
import { MisztikusFortélyokSection } from './MisztikusFortelyokSection';
import { MisztikusPopups } from './MisztikusPopups';
import { HINT_DURATION_MS } from '../../ui-constants';
import './MisztikusScreen.css';

export function MisztikusScreen({ data, karakter, képzettségek, setKépzettségek, fortélyok, setFortélyok, gameMode }: MisztikusScreenProps) {
  const konstansok = data.konstansok;
  const { state: popups, actions } = useMisztikusPopups();
  const [hint, setHint] = useState('');
  const [infoTarget, setInfoTarget] = useState<string | null>(null);

  // Aura computation
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok as any, {});
  const computed = evaluate(data.rules, ctx);
  const aura = computed.get('Aura') ?? 0;
  const me = aura + (konstansok as any).aura.mágiaellenállás_konstans;

  // Section context (shared across all sections)
  const sectionCtx: SectionContext = {
    maxSzint: karakter.tsz,
    gameMode,
    infoTarget,
    onInfoToggle: (key) => setInfoTarget(prev => prev === key ? null : key),
    findDef: (név) => findKepzDef(név, data.kepzettsegDefs),
    kiterjesztesek: data.kiterjesztesek,
    felvettFortelyok: karakter.fortélyok.map(f => f.név),
  };

  // Derived data
  const tradíció = képzettségek.find(k => k.név.startsWith('Tradíció'));
  const arkánumok = képzettségek.filter(k => k.név.startsWith('Arkánum')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  const ősiNyelvek = képzettségek.filter(k => k.név.startsWith('Ősi nyelv ismerete')).sort((a, b) => a.név.localeCompare(b.név, 'hu'));
  const felvettArkNevek = new Set(arkánumok.map(a => a.név));
  const elérhetőArkánumok = data.kepzettsegDefs.filter(d => d.név.startsWith('Arkánum:') && !felvettArkNevek.has(d.név));
  const misztFortDefs = data.fortelySummaries.filter(d => d.csoport === 'misztikus');
  const fajNév = karakter.hátterek.faj;
  const fajMisztNév = fajNév ? `Faj misztérium: ${fajNév}` : '';
  const fajMisztSzint = (fajMisztNév ? képzettségek.find(k => k.név === fajMisztNév)?.szint : 0) ?? 0;

  // Képzettség actions
  function addKépzettség(név: string) {
    setKépzettségek(prev => [...prev, { név, szint: 1 }]);
    actions.openSzint(név);
  }
  function removeKépzettség(név: string) {
    setKépzettségek(prev => prev.filter(k => k.név !== név));
  }
  function setSzint(név: string, szint: number) {
    setKépzettségek(prev => prev.map(k => k.név === név ? { ...k, szint } : k));
  }
  function handleSzintPick(szint: number) {
    const target = popups.szintTarget;
    if (!target) return;
    if (szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== target));
    else if (!képzettségek.find(k => k.név === target)) setKépzettségek(prev => [...prev, { név: target, szint }]);
    else setSzint(target, szint);
    actions.closeSzint();
  }
  function handleTradícióPick(név: string) {
    addKépzettség(`Tradíció: ${név}`);
    actions.closeTradíció();
  }
  function handleAltípusPick(tradíció: string, altípus: string) {
    addKépzettség(`Tradíció: ${tradíció} (${altípus})`);
    actions.closeAltípus();
  }
  function handlePromptConfirm() {
    if (popups.promptTarget && popups.promptValue.trim()) {
      addKépzettség(`${popups.promptTarget}: ${popups.promptValue.trim()}`);
      actions.closePrompt();
    }
  }
  function handleFokPick(fok: number) {
    if (popups.misztFokTarget === null) return;
    setFortélyok(prev => prev.map((f, j) => j === popups.misztFokTarget ? { ...f, fok } : f));
    actions.closeFok();
  }
  function showHint(msg: string) {
    setHint(msg);
    setTimeout(() => setHint(''), HINT_DURATION_MS);
  }

  return (
    <div className="screen miszt-screen">
      <h2>✨ Misztikus</h2>

      <AuraPanel aura={aura} me={me} onMágiaAkarata={actions.openMágiaAkarata} />

      <TradícióSection ctx={sectionCtx} tradíció={tradíció}
        onEdit={actions.openSzint} onDelete={actions.openDelete} onPickTradíció={actions.openTradíció} />

      <ArkánumokSection ctx={sectionCtx} arkánumok={arkánumok}
        elérhetőArkánumok={elérhetőArkánumok} hasTradíció={!!tradíció}
        onEdit={actions.openSzint} onDelete={actions.openDelete} onAdd={addKépzettség} />

      <FajMisztériumSection ctx={sectionCtx} fajNév={fajNév} szint={fajMisztSzint}
        onEdit={actions.openSzint} />

      <ŐsiNyelvSection ctx={sectionCtx} ősiNyelvek={ősiNyelvek}
        onEdit={actions.openSzint} onDelete={actions.openDelete}
        onAdd={() => actions.openPrompt('Ősi nyelv ismerete')} onHint={showHint} />

      <MisztikusFortélyokSection
        misztFortDefs={misztFortDefs} fortélyok={fortélyok} gameMode={gameMode}
        képzettségek={képzettségek} infoTarget={infoTarget}
        onInfoToggle={sectionCtx.onInfoToggle}
        onFelvétel={actions.openFelvétel} onFokChange={actions.openFok}
        onDelete={actions.openDeleteFort} onHint={showHint} />

      {hint && <div className="he-hint">{hint}</div>}

      <MisztikusPopups
        state={popups} képzettségek={képzettségek} fortélyok={fortélyok}
        tradícióOpciók={data.tradiciok ?? []} misztFortDefs={misztFortDefs}
        actions={actions}
        onConfirmDelete={() => { if (popups.deleteTarget) { removeKépzettség(popups.deleteTarget); actions.closeDelete(); } }}
        onSzintPick={handleSzintPick}
        onPromptConfirm={handlePromptConfirm}
        onPickTradíció={handleTradícióPick}
        onConfirmAltípus={handleAltípusPick}
        onFelvételDone={(result: Fortely) => { setFortélyok(prev => [...prev, result]); actions.closeFelvétel(); }}
        onFokPick={handleFokPick}
        onConfirmDeleteFort={() => { if (popups.deleteFortIdx !== null) { setFortélyok(prev => prev.filter((_, j) => j !== popups.deleteFortIdx)); actions.closeDeleteFort(); } }}
      />
    </div>
  );
}
