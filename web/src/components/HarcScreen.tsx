import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
import { calcPancelInputs } from '../engine/pancel';
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

  // Reactive engine — fortély KÉ módosítók (TODO: full §16 fortély modifier system)
  // For now: sum always-active KÉ modifiers from known fortélyok
  let fortelyKE = 0;
  const gkFok = k.fortélyok.find(f => f.név === 'Gyors kezdeményezés')?.fok ?? 0;
  fortelyKE += gkFok * 2; // Gyors kezdeményezés: +2 KÉ/fok
  const hknFok = k.fortélyok.find(f => f.név === 'Harckeret növelés')?.fok ?? 0;
  fortelyKE += hknFok; // Harckeret növelés: +1 KÉ/fok
  const harcmodorÖsszeg = [
    k.képzettségek.find(kp => kp.név === 'Közelharc')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Kardvívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Rombolás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Lándzsavívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Ostorharc')?.szint ?? 0,
  ].reduce((a, b) => a + b, 0);

  // Páncél: compute inputs for reactive engine
  const merevvértFok = k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const pancelResult = calcPancelInputs(
    k.páncél, konstansok.páncél_struktúrák, konstansok.páncél_fémalapanyagok,
    merevvértFok, konstansok.merevvértviselet_bónuszok,
  );

  // Build lookup tables for csatolt_mgt (string-keyed)
  const csatoltMgt = konstansok.páncél_csatolt_tag_mgt;
  const csatoltArrays = new Map<string, Record<string, number | string>[]>();
  csatoltArrays.set('csatolt_mgt_merev', Object.entries(csatoltMgt.merevvért_fém).map(([k, v]) => ({ név: k, érték: v })));
  csatoltArrays.set('csatolt_mgt_fém', Object.entries(csatoltMgt.hajlékonyvért_fém).map(([k, v]) => ({ név: k, érték: v })));
  csatoltArrays.set('csatolt_mgt_nemfém', Object.entries(csatoltMgt.hajlékonyvért_nem_fém).map(([k, v]) => ({ név: k, érték: v })));

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_kidolgozottság', pancelResult.strings.páncél_kidolgozottság);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok as any, {
    fortélyMod_KÉ: fortelyKE,
    harcmodor_összeg: harcmodorÖsszeg,
    HM_TÉ: k.HM_TÉ,
    HM_VÉ: k.HM_VÉ,
    CM: k.CM,
    felszerelés_terhelés: 0,
    alakzatharc_szint: 0,
    ...pancelResult.numeric,
  });
  const baseArrays = new Map([...csatoltArrays]);
  const computed = evaluate(data.rules, ctx, baseArrays, stringCtx);

  const épValue = computed.get('ÉP') ?? 40;
  const ké = computed.get('KÉ') ?? 0;
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const sfé_fizikai = computed.get('sfé_fizikai') ?? 0;
  const sfé_energia = computed.get('sfé_energia') ?? 0;

  // Fegyverek — build from karakter.fegyverek, expand MK pairs
  const fegyverRows: { név: string; fDef: typeof data.fegyverek[0]; mfFok: number }[] = [];
  // Always include Puszta kéz
  const pusztaKez = data.fegyverek.find(f => f.Fegyver.toLowerCase() === 'puszta kéz');
  if (pusztaKez) fegyverRows.push({ név: pusztaKez.Fegyver, fDef: pusztaKez, mfFok: 0 });
  // Karakter fegyverek
  for (const fp of k.fegyverek) {
    const fDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === fp.alap.toLowerCase());
    if (!fDef) continue;
    fegyverRows.push({ név: fDef.Fegyver, fDef, mfFok: fp.mesterfegyver_fok });
    // If MK pair exists, add 2K row with same MF/idea
    if (fDef.MK_pár) {
      const párDef = data.fegyverek.find(f => f.Fegyver === fDef.MK_pár);
      if (párDef) fegyverRows.push({ név: párDef.Fegyver, fDef: párDef, mfFok: fp.mesterfegyver_fok });
    }
  }

  const fegyverResults = fegyverRows.map(({ fDef, mfFok }) => {
    const kat = fDef.Kategória;
    const KATEGÓRIA_HARCMODOR: Record<string, string> = { közelharci: 'Közelharc', kardvívó: 'Kardvívás', romboló: 'Rombolás', lándzsavívó: 'Lándzsavívás', ostorharc: 'Ostorharc' };
    const harcmodorNév = KATEGÓRIA_HARCMODOR[kat] ?? 'Közelharc';
    const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
    const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
    const mf = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

    // Evaluate reactive rules with weapon-specific context
    const fCtx = buildContext(k.tulajdonságok, k.tsz, konstansok as any, {
      ...pancelResult.numeric,
      HM_TÉ: k.HM_TÉ,
      HM_VÉ: k.HM_VÉ,
      felszerelés_mgt: 0,
      fegyver_harcmodor_TÉ: hb?.TÉ ?? 0,
      fegyver_harcmodor_VÉ: hb?.VÉ ?? 0,
      fegyver_harcmodor_szint: harcmodorSzint,
      fegyver_alap_TÉ: parseInt(fDef.TÉ) || 0,
      fegyver_alap_VÉ: parseInt(fDef.VÉ) || 0,
      fegyver_alap_SP: parseInt(fDef.SP) || 0,
      fegyver_erőbónusz_limit: parseInt(fDef['Erőbónusz limit']) || 99,
      fegyver_sebesség: parseInt(fDef.Sebesség) || 6,
      fegyver_mf_TÉ: mf.TÉ,
      fegyver_mf_VÉ: mf.VÉ,
      fegyver_mf_SP: mf.SP,
      fegyver_fortély_TÉ: 0,
      fegyver_fortély_VÉ: 0,
      fegyver_fortély_SP: 0,
      fegyver_fortély_harckeret: hknFok, // Harckeret növelés fortély
      fortélyMod_KÉ: fortelyKE,
      harcmodor_összeg: harcmodorÖsszeg,
      alakzatharc_szint: 0,
    });
    const fComp = evaluate(data.rules, fCtx, baseArrays, stringCtx);

    return {
      fegyver_név: fDef.Fegyver,
      TÉ: fComp.get('fegyver_TÉ') ?? 0,
      VÉ: fComp.get('fegyver_VÉ') ?? 0,
      SP: fComp.get('fegyver_SP') ?? 0,
      támadások: fComp.get('fegyver_támadások') ?? 1,
      pengehossz: parseFloat(fDef.Pengehossz) || 0,
      sebzésmód: fDef['Sebzés módja'],
    };
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
  const maxVéCsökk = Math.max(0, ...fegyverResults.map(r => r.VÉ + pajzsVÉ));

  // MP
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  return (
    <div className="screen harc-screen">
      <div className="harc-header">
        <div className="ke-box"><span className="label">KÉ</span><span className="value">{ké}</span></div>
        <div className="sfe-box">
          <span className="label">SFÉ ({pancelResult.numeric.páncél_lefedettség}%)</span>
          <div className="sfe-values">
            <span className="sfe-line">Fizikai: <strong>{sfé_fizikai}</strong></span>
            <span className="sfe-line" style={{ color: '#aaa' }}>Energia: <strong>{sfé_energia}</strong></span>
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
          {fegyverResults.map((r, i) => (
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
