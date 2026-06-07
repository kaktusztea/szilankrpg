import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import { testKarakter8 } from '../testdata';
import { calcFegyverHarcertekek } from '../engine/harcertek';
import { calcPancel } from '../engine/pancel';
import { evaluate, buildContext } from '../engine/reactive';
import { EpTable } from './EpTable';
import './HarcScreen.css';

function calcFtEnyhítés(képzettségek: { név: string; szint: number }[], ftTable: { szint: number; enyhítés: number }[]): number {
  const ftSzint = képzettségek.find(kp => kp.név === 'Fájdalomtűrés')?.szint ?? 0;
  let enyhítés = 0;
  for (const row of ftTable) {
    if (ftSzint >= row.szint) enyhítés = row.enyhítés;
  }
  return enyhítés;
}

export function HarcScreen({ data, tulajdonságok, képzettségek, onNavigate }: { data: GameData; tulajdonságok: any; képzettségek: { név: string; szint: number }[]; onNavigate?: (tabId: string) => void }) {
  const [véCsökkenés, setVéCsökkenés] = useState(0);
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerVéFlash(dir: 'down' | 'up') {
    setVéFlash(dir);
    if (véFlashTimer.current) clearTimeout(véFlashTimer.current);
    véFlashTimer.current = setTimeout(() => setVéFlash(''), 1000);
  }

  function changeVé(newVal: number) {
    const dir = newVal > véCsökkenés ? 'down' : 'up';
    setVéCsökkenés(newVal);
    triggerVéFlash(dir);
  }
  const [aktManöverPont, setAktManöverPont] = useState(99);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);

  useEffect(() => {
    if (!showVéResetConfirm) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setShowVéResetConfirm(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showVéResetConfirm]);

  const k = testKarakter8;
  const { konstansok, harcmodorBonusz } = data;

  // Reactive engine: ÉP, KÉ, TÉ_alap, VÉ_alap, CÉ_alap, Manőver pont, felszerelés
  const fortelyKE = 4 + 1; // Gyors kezdeményezés 2.fok + Harckeret növelés 1.fok
  const harcmodorÖsszeg = [6, 8, 4, 0, 0].reduce((a, b) => a + b, 0);
  const ctx = buildContext(tulajdonságok, k.tsz, konstansok as any, {
    fortélyMod_KÉ: fortelyKE,
    harcmodor_összeg: harcmodorÖsszeg,
    HM_TÉ: k.HM_TÉ,
    HM_VÉ: k.HM_VÉ,
    CM: k.CM,
    felszerelés_terhelés: 0,
  });
  const computed = evaluate(data.rules, ctx);

  const épValue = computed.get('ÉP') ?? 40;
  const ké = computed.get('KÉ') ?? 0;
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const pancel = calcPancel(
    k.páncél, konstansok.páncél_struktúrák, konstansok.páncél_fémalapanyagok,
    konstansok.páncél_csatolt_tag_mgt, 3, konstansok.merevvértviselet_bónuszok, k.tulajdonságok.erő,
  );

  // Fegyverek
  const fegyverNevek = ['Puszta kéz', 'Kard, lovag'];
  const fegyverResults = fegyverNevek.map(név => {
    const fDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === név.toLowerCase());
    if (!fDef) return null;
    const isFegyver = név !== 'Puszta kéz';
    const harcmodorSzint = isFegyver ? 8 : 6; // Kardvívás 8 / Közelharc 6
    const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
    const mfFok = isFegyver ? 2 : 0;
    return calcFegyverHarcertekek(
      k.tulajdonságok, k.HM_TÉ, k.HM_VÉ, harcmodorSzint,
      { TÉ: hb?.TÉ ?? 0, VÉ: hb?.VÉ ?? 0 }, fDef, mfFok,
      konstansok.mesterfegyver_bónuszok, konstansok.harcérték_alap,
      0, 0, 0, 1, pancel.MGT, 0,
    );
  });

  // Pajzs VÉ (Közepes pajzs, 2.fok)
  const pajzsVÉ = 10;

  // ÉP alapú TÉ levonás (sebesülés kategória)
  const oszlopMéret = épValue / 4;
  const téLevonások = [0, -3, -6, -9];
  // aktKategória kell a sebesülés tracking-hez — egyelőre 0 (nincs seb state itt, EpTable kezeli)
  // TODO: EpTable-ből felbubble-olni a kitöltött rubrikák számát
  const [sebCount, setSebCount] = useState(0);
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / oszlopMéret) - 1);
  const téLevonás = téLevonások[aktKat];

  // Max VÉ csökkenés: a legnagyobb fegyver VÉ + pajzs (amíg MIND el nem éri a 0-t)
  const maxVéCsökk = Math.max(...fegyverResults.filter(Boolean).map(r => r!.VÉ + pajzsVÉ));

  return (
    <div className="screen harc-screen">
      <div className="harc-header">
        <div className="ke-box"><span className="label">KÉ</span><span className="value">{ké}</span></div>
        <div className="sfe-box">
          <span className="label">SFÉ ({pancel.lefedettség}%)</span>
          <div className="sfe-values">
            <span className="sfe-line">Fizikai: <strong>{pancel.sfé_fizikai}</strong></span>
            <span className="sfe-line" style={{ color: '#aaa' }}>Energia: <strong>{pancel.sfé_energia}</strong></span>
          </div>
        </div>
        <div className="ve-csokk-box">
          <span className="label">VÉ csökkenés</span>
          <span className="value">{véCsökkenés === 0 ? 0 : -véCsökkenés}</span>
          <div className="ve-btns">
            <button disabled={véCsökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(véCsökkenés + 1, maxVéCsökk))}>-1</button>
            <button disabled={véCsökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(véCsökkenés + 2, maxVéCsökk))}>-2</button>
            <button disabled={véCsökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(véCsökkenés + 3, maxVéCsökk))}>-3</button>
            <button disabled={véCsökkenés === 0} onClick={() => changeVé(Math.max(0, véCsökkenés - 1))}>+1</button>
            <button disabled={véCsökkenés === 0} onClick={() => setShowVéResetConfirm(true)}>⟲</button>
          </div>
        </div>
        <div className="mp-box">
          <span className="label">MP</span>
          <span className="value">{Math.min(aktManöverPont, manöverPont)}/{manöverPont}</span>
          <div className="ve-btns">
            <button onClick={() => setAktManöverPont(Math.max(0, Math.min(aktManöverPont, manöverPont) - 1))}>-1</button>
            <button disabled={Math.min(aktManöverPont, manöverPont) === manöverPont} onClick={() => setAktManöverPont(manöverPont)}>⟲</button>
          </div>
        </div>
      </div>

      <div className="harc-nav-btns">
        <button onClick={() => onNavigate?.('taktikak')}>Harci taktika</button>
        <button onClick={() => onNavigate?.('helyzetek')}>Harci helyzet</button>
        <button onClick={() => onNavigate?.('manoverek')}>Manőver</button>
      </div>
      <table className="harc-table">
        <thead>
          <tr><th>Fegyver</th><th>Tám</th><th className="te-col">TÉ</th><th className="ve-col">VÉ</th><th>SP</th><th>Ph</th></tr>
        </thead>
        <tbody>
          {fegyverResults.map((r, i) => r && (
            <tr key={i}>
              <td>{r.fegyver_név}</td>
              <td>{r.támadások}</td>
              <td>{r.TÉ + téLevonás}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + pajzsVÉ - véCsökkenés)}</td>
              <td>{r.SP} {r.sebzésmód}</td>
              <td>{r.pengehossz}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="harc-section">
        <EpTable ÉP={épValue} onSebCountChange={setSebCount} ftEnyhítés={calcFtEnyhítés(képzettségek, data.konstansok.fájdalomtűrés_enyhítés)} onNavigate={képzettségek.some(k => k.név === 'Fájdalomtűrés') ? () => { onNavigate?.('tulajdonsagok'); setTimeout(() => { document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 200); } : undefined} />
      </div>

      {showVéResetConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn-del-confirm" style={{ fontSize: '16px', padding: '6px 14px' }} onClick={() => { changeVé(0); setShowVéResetConfirm(false); }}>VÉ Reset</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
