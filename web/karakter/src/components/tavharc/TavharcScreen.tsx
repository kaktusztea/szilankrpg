import { useState, useCallback } from 'react';
import type { TavharcProps, VirtuálisFegyver, TavharcPopupState } from './types';
import { getAlkalmatlanInfo, getAktívTfDef, getFortélyCÉ, calcCÉBontás, calcTámadásLabel, calcVÉ, calcÚjratöltésEnyhítés, calcSzorzóÖsszeg } from './helpers';
import { getMfFok } from './mesterfegyver-calc';
import { collectCéDobásInfo, netElőnySzint, collectDobásInfo } from '../harc/combat-roll-info';
import { TavharcLoveskiteres } from './TavharcLoveskiteres';
import { TavharcFegyverLista } from './TavharcFegyverLista';
import { TavharcGameSelector } from './TavharcGameSelector';
import { TavharcKalkulator } from './TavharcKalkulator';
import { TavharcReszletek } from './TavharcReszletek';
import { TavharcPopups } from './TavharcPopups';
import { TavharcKepzettsegekSection } from './TavharcKepzettsegekSection';
import { PopupOverlay } from '../PopupOverlay';
import { SzintGrid } from '../harcertekek/PickerComponents';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { CélzóDobasPopup } from './CelzoDobasPopup';
import './TavharcScreen.css';

export function TavharcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, képzettségek, setKépzettségek, gameMode }: TavharcProps) {
  const k = karakter;
  const konstansok = data.konstansok;
  const szorzok = data.tavharcSzorzok;

  // --- Fegyver info ---
  const alkalmatlan = getAlkalmatlanInfo(k, data);
  const tfDef = getAktívTfDef(k, session, data, alkalmatlan);
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];

  // --- Célzó dobás popup ---
  const [showCéDobás, setShowCéDobás] = useState(false);

  // --- CÉ bontás ---
  // Per-fegyver CÉ-Idea delta (Modell 2, spec §17): az aktív példány Ideája a idea_default-tól eltérve
  // módosít 1:1 a CÉ-hez. A v2 CÉ a idea_default-ot MÁR tartalmazza.
  const ideaDelta = (tfPeldany?.idea ?? 0) - (tfDef?.idea_default ?? 0);
  const fortélyCÉ = getFortélyCÉ(k, data, session, tfPeldany?.alap);
  const bontás = calcCÉBontás(k, data, session, tfDef, ideaDelta, fortélyCÉ);

  // --- MF ---
  const mfFok = tfPeldany ? getMfFok(k, tfPeldany.alap) : 0;

  // --- Támadás ---
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const sebesség = tfDef?.Sebesség ?? -1;
  const újratöltésEnyhítés = calcÚjratöltésEnyhítés(session, k);
  const támadásLabel = bontás.isMágikus ? '-' : calcTámadásLabel({ harcmodorSzint: bontás.harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás: konstansok.nyílpuska_alap_támadás });

  // --- Távolság & VÉ ---
  const [távolság, setTávolság] = useState(10);
  const cella = Math.ceil(távolság / bontás.osztó);

  // --- Szorzók (grouped) ---
  const [szorzóState, setSzorzóState] = useState({
    célMozgásId: szorzok.célpont_mozgás[0]?.id ?? 1,
    lövészMozgásId: szorzok.lövész_mozgás[0]?.id ?? 1,
    méretId: szorzok.célpont_méret.find(m => m.szorzó === 0)?.id ?? 4,
    észlelhetőségId: szorzok.észlelhetőség[0]?.id ?? 0,
    szélId: szorzok.szél[0]?.id ?? 0,
  });

  const szorzóÖsszeg = calcSzorzóÖsszeg(szorzok, szorzóState);

  const vé = calcVÉ(szorzóÖsszeg, cella);
  const onSzorzóChange = useCallback((key: keyof typeof szorzóState, id: number) => {
    setSzorzóState(s => ({ ...s, [key]: id }));
  }, []);

  // --- Virtuális fegyver lista ---
  const összesFegyver: VirtuálisFegyver[] = [
    ...k.távfegyverek.map(tf => ({ alap: tf.alap, locked: false })),
    ...alkalmatlan.nevek.map(név => ({ alap: név, locked: true })),
    ...(alkalmatlan.alkalmiTárgyNév ? [{ alap: alkalmatlan.alkalmiTárgyNév, locked: true }] : []),
  ];

  // --- Popup state (grouped) ---
  const [popup, setPopup] = useState<TavharcPopupState>({ mfTarget: null, deleteTarget: null, ideaPopup: null, távolságPopup: false });
  const closePopup = useCallback((key: keyof TavharcPopupState) => {
    setPopup(s => ({ ...s, [key]: key === 'mfTarget' || key === 'deleteTarget' || key === 'ideaPopup' ? null : false }));
  }, []);

  // --- Képzettség popup state ---
  const [kepzSzintTarget, setKepzSzintTarget] = useState<string | null>(null);
  const [deleteKepzTarget, setDeleteKepzTarget] = useState<string | null>(null);

  const closeKepzPopup = useCallback(() => {
    if (kepzSzintTarget) {
      const kp = képzettségek.find(k => k.név === kepzSzintTarget);
      if (kp && kp.szint === 0) setKépzettségek(prev => prev.filter(k => k.név !== kepzSzintTarget));
    }
    setKepzSzintTarget(null);
  }, [kepzSzintTarget, képzettségek, setKépzettségek]);

  return (
    <div className="screen tavharc-screen">
      <h2>🏹 Távharc</h2>

      <TavharcKepzettsegekSection
        data={data} karakter={karakter} képzettségek={képzettségek} setKépzettségek={setKépzettségek}
        gameMode={gameMode}
        onDeleteKepz={név => setDeleteKepzTarget(név)}
        onKepzSzint={név => setKepzSzintTarget(név)}
      />

      {!gameMode && (
        <TavharcFegyverLista
          data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} pushUndo={pushUndo} képzettségek={képzettségek} setKépzettségek={setKépzettségek} gameMode={gameMode}
          onMfTarget={i => setPopup(s => ({ ...s, mfTarget: i }))}
          onDeleteTarget={i => setPopup(s => ({ ...s, deleteTarget: i }))}
          onIdeaPopup={i => setPopup(s => ({ ...s, ideaPopup: i }))}
        />
      )}

      {gameMode && (
        <TavharcGameSelector összesFegyver={összesFegyver} tfIdx={tfIdx} setSession={setSession} mfFok={mfFok} idea={tfPeldany?.idea ?? 0} isMágikus={bontás.isMágikus} />
      )}

      {tfDef && gameMode && (
        <TavharcKalkulator
          cé={bontás.cé} vé={vé} támadásLabel={támadásLabel} szorzóÖsszeg={szorzóÖsszeg} cella={cella} távolság={távolság}
          szorzok={szorzok} szorzóState={szorzóState} onSzorzóChange={onSzorzóChange}
          onTávolságPopup={() => setPopup(s => ({ ...s, távolságPopup: true }))}
          onCéDobás={() => setShowCéDobás(true)}
          karakter={k} konstansok={konstansok} tavfegyverek={data.tavfegyverek}
        />
      )}

      {gameMode && !tfDef && (
        <TavharcLoveskiteres karakter={k} konstansok={konstansok} tavfegyverek={data.tavfegyverek} />
      )}

      {!tfDef && összesFegyver.length === 0 && gameMode && (
        <p className="th-no-fegyver">Nincs távfegyver felvéve</p>
      )}

      <TavharcReszletek bontás={bontás} gameMode={gameMode} karakter={karakter} setKarakter={setKarakter} pushUndo={pushUndo} konstansok={konstansok} />

      <TavharcPopups
        karakter={karakter} setKarakter={setKarakter}
        popup={popup} closePopup={closePopup}
        távolság={távolság} setTávolság={setTávolság}
        osztó={bontás.osztó}
      />

      {kepzSzintTarget && (
        <PopupOverlay onClose={closeKepzPopup}>
          <SzintGrid
            label={`Távolsági harcmodor: ${kepzSzintTarget} - szint:`}
            maxSzint={data.konstansok.arányok.képzettség_max_szint}
            current={képzettségek.find(kp => kp.név === kepzSzintTarget)?.szint ?? 0}
            onSelect={n => {
              setKépzettségek(prev => prev.map(kp => kp.név === kepzSzintTarget ? { ...kp, szint: n } : kp));
              setKepzSzintTarget(null);
            }}
          />
        </PopupOverlay>
      )}

      {deleteKepzTarget && (
        <DeleteConfirmPopup
          label={`Távolsági harcmodor: ${deleteKepzTarget}`}
          buttonText="Képzettség törlése"
          onConfirm={() => { setKépzettségek(prev => prev.filter(kp => kp.név !== deleteKepzTarget)); setDeleteKepzTarget(null); }}
          onClose={() => setDeleteKepzTarget(null)}
        />
      )}

      {showCéDobás && (() => {
        const céInfo = collectCéDobásInfo(session, k, data);
        const dobásInfo = collectDobásInfo(session, k, data);
        // Raw SP (nem tavSP): a SebzesPopup maga ismeri fel az SP_NINCS (-99) sentinelt → "nem sebez".
        const fegyverSP = tfDef?.SP ?? 0;
        const fegyverÁtütés = tfDef?.Átütés ?? 0;
        return (
          <CélzóDobasPopup
            cé={bontás.cé}
            vé={vé}
            sp={fegyverSP}
            átütés={fegyverÁtütés}
            céHatások={céInfo.céHatások}
            céMegjegyzések={céInfo.céMegjegyzések}
            sebzésHatások={dobásInfo.sebzésHatások}
            defaultSzint={netElőnySzint(céInfo.céHatások)}
            onClose={() => setShowCéDobás(false)}
          />
        );
      })()}
    </div>
  );
}
