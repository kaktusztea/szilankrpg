import { useState, useEffect } from 'react';
import type { TavharcProps, VirtuálisFegyver } from './types';
import { getAlkalmatlanInfo, getAktívTfDef, getMfFok, getFortélyCÉ, calcCÉ, getCÉInputs, calcTámadásLabel, calcVÉ } from './helpers';
import { TavharcFegyverLista } from './TavharcFegyverLista';
import { TavharcGameSelector } from './TavharcGameSelector';
import { TavharcKalkulator } from './TavharcKalkulator';
import { TavharcReszletek } from './TavharcReszletek';
import { TavharcPopups } from './TavharcPopups';
import './TavharcScreen.css';

export function TavharcScreen({ data, karakter, session, setSession, setKarakter, gameMode }: TavharcProps) {
  const k = karakter;
  const konstansok = data.konstansok;
  const szorzok = data.tavharcSzorzok;

  // Alkalmatlan fegyver info
  const alkalmatlan = getAlkalmatlanInfo(k, data);

  // Aktív távfegyver definíció
  const tfDef = getAktívTfDef(k, session, data, alkalmatlan);
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];

  // MF
  const mfFok = tfPeldany ? getMfFok(k, tfPeldany.alap) : 0;
  const mfBónusz = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok);
  const mfCÉ = mfBónusz?.CÉ ?? 0;

  // Idea
  const [idea, setIdea] = useState(0);

  // Harcmodor
  const harcmodorNév = tfDef?.Harcmodor ?? 'Hajítás';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const harcmodorCÉ = data.harcmodorBonusz.find(b => b.szint === harcmodorSzint)?.CÉ ?? -9;

  // CÉ
  const céAlap = konstansok.harcérték_alap.CÉ;
  const önuralom = k.tulajdonságok.önuralom ?? 0;
  const fegyverCÉ = parseInt(tfDef?.CÉ ?? '0') || 0;
  const fortélyCÉ = getFortélyCÉ(k, data, session);
  const { önuralom: céÖnuralom, CM: céCM, idea: céIdea, isMágikus, mágikusProp: mágikusTulajdonságCÉ } = getCÉInputs(k, tfDef, idea);
  const cé = calcCÉ({ céAlap, önuralom: céÖnuralom, CM: céCM, harcmodorCÉ, fegyverCÉ, mfCÉ, idea: céIdea, fortélyCÉ });

  // Támadás
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const sebesség = parseInt(tfDef?.Sebesség ?? '-1') || -1;
  const gyorsÚjratöltésFok = k.fortélyok.find(f => f.név === konstansok.nyílpuska_gyors_újratöltés_fortély)?.fok ?? 0;
  const támadásLabel = isMágikus ? '—' : calcTámadásLabel({ harcmodorSzint, gyorsaság, sebesség, gyorsÚjratöltésFok, konstansok });

  // Távolság & VÉ
  const [távolság, setTávolság] = useState(10);
  const osztó = parseInt(tfDef?.Osztó ?? '1') || 1;
  const cella = Math.ceil(távolság / osztó);

  // Szorzó pickerek
  const [célMozgásId, setCélMozgásId] = useState(szorzok.célpont_mozgás[0]?.id ?? 1);
  const [lövészMozgásId, setLövészMozgásId] = useState(szorzok.lövész_mozgás[0]?.id ?? 1);
  const [méretId, setMéretId] = useState(szorzok.célpont_méret.find(m => m.szorzó === 0)?.id ?? 4);
  const [észlelhetőségId, setÉszlelhetőségId] = useState(szorzok.észlelhetőség[0]?.id ?? 0);
  const [szélId, setSzélId] = useState(szorzok.szél[0]?.id ?? 0);

  const getSzorzó = (list: typeof szorzok.célpont_mozgás, id: number) => list.find(e => e.id === id)?.szorzó ?? 0;
  const szorzóÖsszeg = getSzorzó(szorzok.célpont_mozgás, célMozgásId)
    + getSzorzó(szorzok.lövész_mozgás, lövészMozgásId)
    + getSzorzó(szorzok.célpont_méret, méretId)
    + getSzorzó(szorzok.észlelhetőség, észlelhetőségId)
    + getSzorzó(szorzok.szél, szélId);

  const vé = calcVÉ(szorzóÖsszeg, cella);

  // Virtuális fegyver lista
  const összesFegyver: VirtuálisFegyver[] = [
    ...k.távfegyverek.map(tf => ({ alap: tf.alap, locked: false })),
    ...alkalmatlan.nevek.map(név => ({ alap: név, locked: true })),
    ...(alkalmatlan.alkalmiTárgyNév ? [{ alap: alkalmatlan.alkalmiTárgyNév, locked: true }] : []),
  ];

  // Popup states
  const [mfTarget, setMfTarget] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [ideaPopup, setIdeaPopup] = useState(false);
  const [távolságPopup, setTávolságPopup] = useState(false);

  // Escape bezárás
  useEffect(() => {
    if (mfTarget === null && deleteTarget === null && !ideaPopup && !távolságPopup) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setMfTarget(null); setDeleteTarget(null); setIdeaPopup(false); setTávolságPopup(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mfTarget, deleteTarget, ideaPopup, távolságPopup]);

  return (
    <div className="screen tavharc-screen">
      <h2>🏹 Távharc</h2>

      {!gameMode && (
        <TavharcFegyverLista
          data={data} karakter={karakter} session={session} setSession={setSession} setKarakter={setKarakter} gameMode={gameMode}
          idea={idea} fortélyCÉ={fortélyCÉ}
          onMfTarget={setMfTarget} onDeleteTarget={setDeleteTarget} onIdeaPopup={() => setIdeaPopup(true)}
        />
      )}

      {gameMode && (
        <TavharcGameSelector összesFegyver={összesFegyver} tfIdx={tfIdx} setSession={setSession} mfFok={mfFok} idea={idea} isMágikus={isMágikus} />
      )}

      {tfDef && gameMode && (
        <TavharcKalkulator
          cé={cé} vé={vé} támadásLabel={támadásLabel} szorzóÖsszeg={szorzóÖsszeg} cella={cella} távolság={távolság}
          szorzok={szorzok}
          célMozgásId={célMozgásId} setCélMozgásId={setCélMozgásId}
          lövészMozgásId={lövészMozgásId} setLövészMozgásId={setLövészMozgásId}
          méretId={méretId} setMéretId={setMéretId}
          észlelhetőségId={észlelhetőségId} setÉszlelhetőségId={setÉszlelhetőségId}
          szélId={szélId} setSzélId={setSzélId}
          onTávolságPopup={() => setTávolságPopup(true)}
        />
      )}

      {!tfDef && összesFegyver.length === 0 && gameMode && (
        <p className="th-no-fegyver">Nincs távfegyver felvéve</p>
      )}

      <TavharcReszletek
        fegyverCÉ={fegyverCÉ} osztó={osztó} mfCÉ={mfCÉ} idea={idea} fortélyCÉ={fortélyCÉ}
        harcmodorCÉ={harcmodorCÉ} harcmodorNév={harcmodorNév} harcmodorSzint={harcmodorSzint}
        önuralom={önuralom} CM={k.CM} céAlap={céAlap} cé={cé}
        gameMode={gameMode} karakter={karakter} setKarakter={setKarakter} konstansok={konstansok}
        isMágikus={isMágikus} mágikusTulajdonságCÉ={mágikusTulajdonságCÉ}
      />

      <TavharcPopups
        karakter={karakter} setKarakter={setKarakter}
        mfTarget={mfTarget} setMfTarget={setMfTarget}
        deleteTarget={deleteTarget} setDeleteTarget={setDeleteTarget}
        ideaPopup={ideaPopup} setIdeaPopup={setIdeaPopup}
        távolságPopup={távolságPopup} setTávolságPopup={setTávolságPopup}
        idea={idea} setIdea={setIdea}
        távolság={távolság} setTávolság={setTávolság}
        osztó={osztó}
      />
    </div>
  );
}
