import { useState, useCallback } from 'react';
import type { TavharcProps, VirtuálisFegyver, TavharcPopupState } from './types';
import { getAlkalmatlanInfo, getAktívTfDef, getMfFok, getFortélyCÉ, calcCÉBontás, calcTámadásLabel, calcVÉ, calcÚjratöltésEnyhítés, calcSzorzóÖsszeg } from './helpers';
import { TavharcFegyverLista } from './TavharcFegyverLista';
import { TavharcGameSelector } from './TavharcGameSelector';
import { TavharcKalkulator } from './TavharcKalkulator';
import { TavharcReszletek } from './TavharcReszletek';
import { TavharcPopups } from './TavharcPopups';
import './TavharcScreen.css';

export function TavharcScreen({ data, karakter, session, setSession, setKarakter, pushUndo, gameMode }: TavharcProps) {
  const k = karakter;
  const konstansok = data.konstansok;
  const szorzok = data.tavharcSzorzok;

  // --- Fegyver info ---
  const alkalmatlan = getAlkalmatlanInfo(k, data);
  const tfDef = getAktívTfDef(k, session, data, alkalmatlan);
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];

  // --- Idea (local state, not persisted) ---
  const [idea, setIdea] = useState(0);

  // --- CÉ bontás ---
  const fortélyCÉ = getFortélyCÉ(k, data, session, tfPeldany?.alap);
  const bontás = calcCÉBontás(k, data, session, tfDef, idea, fortélyCÉ);

  // --- MF ---
  const mfFok = tfPeldany ? getMfFok(k, tfPeldany.alap) : 0;

  // --- Támadás ---
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const sebesség = parseInt(tfDef?.Sebesség ?? '-1') || -1;
  const újratöltésEnyhítés = calcÚjratöltésEnyhítés(session, k);
  const támadásLabel = bontás.isMágikus ? '—' : calcTámadásLabel({ harcmodorSzint: bontás.harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás: konstansok.nyílpuska_alap_támadás });

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
  const [popup, setPopup] = useState<TavharcPopupState>({ mfTarget: null, deleteTarget: null, ideaPopup: false, távolságPopup: false });
  const closePopup = useCallback((key: keyof TavharcPopupState) => {
    setPopup(s => ({ ...s, [key]: key === 'mfTarget' || key === 'deleteTarget' ? null : false }));
  }, []);

  return (
    <div className="screen tavharc-screen">
      <h2>🏹 Távharc</h2>

      {!gameMode && (
        <TavharcFegyverLista
          data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} pushUndo={pushUndo} gameMode={gameMode}
          idea={idea}
          onMfTarget={i => setPopup(s => ({ ...s, mfTarget: i }))}
          onDeleteTarget={i => setPopup(s => ({ ...s, deleteTarget: i }))}
          onIdeaPopup={() => setPopup(s => ({ ...s, ideaPopup: true }))}
        />
      )}

      {gameMode && (
        <TavharcGameSelector összesFegyver={összesFegyver} tfIdx={tfIdx} setSession={setSession} mfFok={mfFok} idea={idea} isMágikus={bontás.isMágikus} />
      )}

      {tfDef && gameMode && (
        <TavharcKalkulator
          cé={bontás.cé} vé={vé} támadásLabel={támadásLabel} szorzóÖsszeg={szorzóÖsszeg} cella={cella} távolság={távolság}
          szorzok={szorzok} szorzóState={szorzóState} onSzorzóChange={onSzorzóChange}
          onTávolságPopup={() => setPopup(s => ({ ...s, távolságPopup: true }))}
        />
      )}

      {!tfDef && összesFegyver.length === 0 && gameMode && (
        <p className="th-no-fegyver">Nincs távfegyver felvéve</p>
      )}

      <TavharcReszletek bontás={bontás} gameMode={gameMode} karakter={karakter} setKarakter={setKarakter} pushUndo={pushUndo} konstansok={konstansok} />

      <TavharcPopups
        karakter={karakter} setKarakter={setKarakter}
        popup={popup} closePopup={closePopup}
        idea={idea} setIdea={setIdea}
        távolság={távolság} setTávolság={setTávolság}
        osztó={bontás.osztó}
      />
    </div>
  );
}
