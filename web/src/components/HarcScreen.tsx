import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
import { calcFegyverHarcertekek } from '../engine/harcertek';
import { calcPancel } from '../engine/pancel';
import { evaluate, buildContext } from '../engine/reactive';
import { EpTable } from './EpTable';
import type { SebzésRubrika } from '../engine/types';
import './HarcScreen.css';

function calcFtEnyhítés(képzettségek: { név: string; szint: number }[], ftTable: { szint: number; enyhítés: number }[]): number {
  const ftSzint = képzettségek.find(kp => kp.név === 'Fájdalomtűrés')?.szint ?? 0;
  let enyhítés = 0;
  for (const row of ftTable) {
    if (ftSzint >= row.szint) enyhítés = row.enyhítés;
  }
  return enyhítés;
}

export function HarcScreen({ data, karakter, session, setSession, onNavigate }: {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  onNavigate?: (tabId: string) => void;
}) {
  const [véFlash, setVéFlash] = useState<'' | 'down' | 'up'>('');
  const véFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showVéHistory, setShowVéHistory] = useState(false);
  const lastTapVéLabel = useRef(0);
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);

  function triggerVéFlash(dir: 'down' | 'up') {
    setVéFlash(dir);
    if (véFlashTimer.current) clearTimeout(véFlashTimer.current);
    véFlashTimer.current = setTimeout(() => setVéFlash(''), 1000);
  }

  function changeVé(newVal: number) {
    const diff = newVal - session.vé_csökkenés;
    const dir = diff > 0 ? 'down' : 'up';
    setSession(prev => ({
      ...prev,
      vé_csökkenés: newVal,
      vé_history: newVal === 0 ? [] : [...prev.vé_history, diff > 0 ? -diff : Math.abs(diff)],
    }));
    triggerVéFlash(dir);
  }

  function handleVéLabelTap() {
    if (session.vé_csökkenés === 0) return;
    const now = Date.now();
    if (now - lastTapVéLabel.current < 350) {
      setShowVéHistory(true);
      lastTapVéLabel.current = 0;
    } else {
      lastTapVéLabel.current = now;
    }
  }

  useEffect(() => {
    if (!showVéResetConfirm && !showVéHistory) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowVéResetConfirm(false); setShowVéHistory(false); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showVéResetConfirm, showVéHistory]);

  const k = karakter;
  const { konstansok, harcmodorBonusz } = data;

  // Reactive engine
  const fortelyKE = 4 + 1; // Gyors kezdeményezés 2.fok + Harckeret növelés 1.fok
  const harcmodorÖsszeg = [
    k.képzettségek.find(kp => kp.név === 'Közelharc')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Kardvívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Rombolás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Lándzsavívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Ostorharc')?.szint ?? 0,
  ].reduce((a, b) => a + b, 0);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok as any, {
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
    const harcmodorSzint = isFegyver ? 8 : 6;
    const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
    const mfFok = isFegyver ? 2 : 0;
    return calcFegyverHarcertekek(
      k.tulajdonságok, k.HM_TÉ, k.HM_VÉ, harcmodorSzint,
      { TÉ: hb?.TÉ ?? 0, VÉ: hb?.VÉ ?? 0 }, fDef, mfFok,
      konstansok.mesterfegyver_bónuszok, konstansok.harcérték_alap,
      0, 0, 0, 1, pancel.MGT, 0,
    );
  });

  // Pajzs VÉ
  const pajzsVÉ = 10;

  // ÉP TÉ levonás
  const oszlopMéret = épValue / 4;
  const téLevonások = [0, -3, -6, -9];
  const [sebCount, setSebCount] = useState(0);
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / oszlopMéret) - 1);
  const téLevonás = téLevonások[aktKat];

  // Max VÉ csökkenés
  const maxVéCsökk = Math.max(...fegyverResults.filter(Boolean).map(r => r!.VÉ + pajzsVÉ));

  // MP
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

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
          <span className="label" onClick={handleVéLabelTap}>VÉ csökkenés</span>
          <span className="value" onClick={handleVéLabelTap}>{session.vé_csökkenés === 0 ? 0 : -session.vé_csökkenés}</span>
          <div className="ve-btns">
            <button disabled={session.vé_csökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(session.vé_csökkenés + 1, maxVéCsökk))}>-1</button>
            <button disabled={session.vé_csökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(session.vé_csökkenés + 2, maxVéCsökk))}>-2</button>
            <button disabled={session.vé_csökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(session.vé_csökkenés + 3, maxVéCsökk))}>-3</button>
            <button disabled={session.vé_csökkenés === 0} onClick={() => changeVé(Math.max(0, session.vé_csökkenés - 1))}>+1</button>
            <button disabled={session.vé_csökkenés === 0} onClick={() => setShowVéResetConfirm(true)}>⟲</button>
          </div>
        </div>
        <div className="mp-box">
          <span className="label">MP</span>
          <span className="value">{aktMP}/{manöverPont}</span>
          <div className="ve-btns">
            <button disabled={aktMP === 0} onClick={() => setSession(prev => ({ ...prev, manőver_pont_használt: prev.manőver_pont_használt + 1 }))}>-1</button>
            <button disabled={session.manőver_pont_használt === 0} onClick={() => setSession(prev => ({ ...prev, manőver_pont_használt: 0 }))}>⟲</button>
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
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + pajzsVÉ - session.vé_csökkenés)}</td>
              <td>{r.SP} {r.sebzésmód}</td>
              <td>{r.pengehossz}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="harc-section">
        <EpTable
          ÉP={épValue}
          onSebCountChange={setSebCount}
          ftEnyhítés={calcFtEnyhítés(k.képzettségek, data.konstansok.fájdalomtűrés_enyhítés)}
          onNavigate={k.képzettségek.some(kp => kp.név === 'Fájdalomtűrés') ? () => { onNavigate?.('tulajdonsagok'); setTimeout(() => { document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 200); } : undefined}
          sebzések={session.sebzések}
          onSebzésekChange={(sebzések: SebzésRubrika[]) => setSession(prev => ({ ...prev, sebzések }))}
        />
      </div>

      {showVéResetConfirm && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="btn-del-confirm" style={{ fontSize: '16px', padding: '6px 14px' }} onClick={() => { changeVé(0); setShowVéResetConfirm(false); }}>VÉ Reset</button>
          </div>
        </div>,
        document.body
      )}

      {showVéHistory && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold' }}>VÉ csökkenés történet</label>
            <div style={{ fontSize: '15px', color: 'var(--text)' }}>
              {session.vé_history.length === 0 ? '—' : session.vé_history.map(v => (v > 0 ? `+${v}` : String(v))).join('; ')}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
