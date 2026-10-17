import { useState } from 'react';
import { képzettségNév, képzKulcs, bontKépzKulcs, TRADÍCIÓ_ID } from '../../engine/azonosito';

import type { MisztikusScreenProps, SectionContext } from './types';
import type { Fortely } from '../../engine/types';
import { evaluate, buildContext } from '../../engine/reactive';
import { findDef as findKepzDef } from '../tulajdonsagok/helpers';
import { buildFortélyFokok } from '../tulajdonsagok/kepzettseg-proba-calc';
import { useMisztikusPopups } from './useMisztikusPopups';
import { AuraPanel } from './AuraPanel';
import { TradícióSection } from './TradicioSection';
import { ArkánumokSection } from './ArkanumokSection';
import { FajMisztériumSection } from './FajMiszteriumSection';
import { ŐsiNyelvSection } from './OsiNyelvSection';
import { MisztikusFortélyokSection } from './MisztikusFortelyokSection';
import { MisztikusPopups } from './MisztikusPopups';
import { HINT_DURATION_MS } from '../../ui-constants';
import { useHint } from '../harcertekek/hooks/useHint';
import './MisztikusScreen.css';

// Misztikus képzettség-azonosítók (kepzettsegek/*.yaml `id`).
const ARKÁNUM_PREFIX = 'arkánum_';
const ŐSI_NYELV_ID = 'ősi_nyelv_ismerete';

export function MisztikusScreen({ data, karakter, képzettségek, setKépzettségek, fortélyok, setFortélyok, gameMode }: MisztikusScreenProps) {
  const konstansok = data.konstansok;
  const { state: popups, actions } = useMisztikusPopups();
  const { hint, showHint } = useHint(HINT_DURATION_MS);
  const [infoTarget, setInfoTarget] = useState<string | null>(null);

  // Aura computation
  const ctx = buildContext(karakter.tulajdonságok, karakter.tsz, konstansok, {});
  const computed = evaluate(data.rules, ctx);
  const aura = computed.get('Aura') ?? 0;
  const me = aura + konstansok.aura.mágiaellenállás_konstans;

  // Section context (shared across all sections)
  const sectionCtx: SectionContext = {
    maxSzint: karakter.tsz,
    gameMode,
    infoTarget,
    onInfoToggle: (key) => setInfoTarget(prev => prev === key ? null : key),
    findDef: (kulcs) => findKepzDef(kulcs, data.kepzettsegDefs),
    név: (kulcs) => képzettségNév(kulcs, data),
    kiterjesztesek: data.kiterjesztesek,
    fortélyFokok: buildFortélyFokok(karakter.fortélyok),
    tulajdonságok: karakter.tulajdonságok,
  };

  const aurahangolásKep = képzettségek.find(k => k.id === 'arkánum_aurahangolás');
  const aurahangolás = aurahangolásKep?.szint ?? 0;
  const önuralom = karakter.tulajdonságok.önuralom;

  // Derived data
  const név = (k: { id: string; elem: string }) => képzettségNév(k, data);
  const tradíció = képzettségek.find(k => k.id === TRADÍCIÓ_ID);
  const arkánumok = képzettségek.filter(k => k.id.startsWith(ARKÁNUM_PREFIX)).sort((a, b) => név(a).localeCompare(név(b), 'hu'));
  const ősiNyelvek = képzettségek.filter(k => k.id === ŐSI_NYELV_ID).sort((a, b) => név(a).localeCompare(név(b), 'hu'));
  const felvettArkIdk = new Set(arkánumok.map(a => a.id));
  const elérhetőArkánumok = data.kepzettsegDefs.filter(d => d.id.startsWith(ARKÁNUM_PREFIX) && !felvettArkIdk.has(d.id));
  const misztFortDefs = data.fortelySummaries.filter(d => d.csoport === 'misztikus');
  const fajNév = karakter.hátterek.faj;
  // A faj misztérium képzettség a faj nevéből ("Faj misztérium: <faj>" def) - id szerint tárolva.
  const fajMisztId = fajNév ? (data.kepzettsegDefs.find(d => d.név === `Faj misztérium: ${fajNév}`)?.id ?? '') : '';
  const fajMisztSzint = (fajMisztId ? képzettségek.find(k => k.id === fajMisztId)?.szint : 0) ?? 0;

  // Képzettség actions
  function addKépzettség(kulcs: string) {
    setKépzettségek(prev => [...prev, { ...bontKépzKulcs(kulcs), szint: 1 }]);
    actions.openSzint(kulcs);
  }
  function removeKépzettség(kulcs: string) {
    setKépzettségek(prev => prev.filter(k => képzKulcs(k) !== kulcs));
  }
  function setSzint(kulcs: string, szint: number) {
    setKépzettségek(prev => prev.map(k => képzKulcs(k) === kulcs ? { ...k, szint } : k));
  }
  function handleSzintPick(szint: number) {
    const target = popups.szintTarget;
    if (!target) return;
    if (szint === 0) setKépzettségek(prev => prev.filter(k => képzKulcs(k) !== target));
    else if (!képzettségek.find(k => képzKulcs(k) === target)) setKépzettségek(prev => [...prev, { ...bontKépzKulcs(target), szint }]);
    else setSzint(target, szint);
    actions.closeSzint();
  }
  function handleTradícióPick(név: string) {
    addKépzettség(`${TRADÍCIÓ_ID}/${név}`);
    actions.closeTradíció();
  }
  function handleAltípusPick(tradíció: string, altípus: string) {
    addKépzettség(`${TRADÍCIÓ_ID}/${tradíció} (${altípus})`);
    actions.closeAltípus();
    actions.closeTradíció();
  }
  function handlePromptConfirm() {
    if (popups.promptTarget && popups.promptValue.trim()) {
      addKépzettség(`${popups.promptTarget}/${popups.promptValue.trim()}`);
      actions.closePrompt();
    }
  }
  function handleFokPick(fok: number) {
    if (popups.misztFokTarget === null) return;
    setFortélyok(prev => prev.map((f, j) => j === popups.misztFokTarget ? { ...f, fok } : f));
    actions.closeFok();
  }

  return (
    <div className="screen miszt-screen">
      <h2>✨ Misztikus</h2>

      <AuraPanel aura={aura} me={me} onMágiaAkarata={actions.openMágiaAkarata} />

      <TradícióSection ctx={sectionCtx} tradíció={tradíció}
        onEdit={actions.openSzint} onDelete={actions.openDelete} onPickTradíció={actions.openTradíció} />

      <ArkánumokSection ctx={sectionCtx} arkánumok={arkánumok}
        elérhetőArkánumok={elérhetőArkánumok} feloldva={!!tradíció || fajMisztSzint > 0}
        onEdit={actions.openSzint} onDelete={actions.openDelete} onAdd={addKépzettség} />

      <FajMisztériumSection ctx={sectionCtx} fajNév={fajNév} fajMisztId={fajMisztId} szint={fajMisztSzint}
        onEdit={actions.openSzint} />

      <ŐsiNyelvSection ctx={sectionCtx} ősiNyelvek={ősiNyelvek}
        onEdit={actions.openSzint} onDelete={actions.openDelete}
        onAdd={() => actions.openPrompt(ŐSI_NYELV_ID)} onHint={showHint} />

      <MisztikusFortélyokSection
        misztFortDefs={misztFortDefs} fortélyok={fortélyok} gameMode={gameMode}
        képzettségek={képzettségek} kepzettsegDefs={data.kepzettsegDefs} infoTarget={infoTarget}
        onInfoToggle={sectionCtx.onInfoToggle}
        onFelvétel={actions.openFelvétel} onFokChange={actions.openFok}
        onDelete={actions.openDeleteFort} onHint={showHint} />

      {hint && <div className="he-hint">{hint}</div>}

      <MisztikusPopups
        state={popups} képzettségek={képzettségek} fortélyok={fortélyok}
        tradícióOpciók={data.tradiciok ?? []} misztFortDefs={misztFortDefs}
        önuralom={önuralom} aurahangolás={aurahangolás}
        képzNév={sectionCtx.név}
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
