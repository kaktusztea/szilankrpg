import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
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
  const [showVéResetConfirm, setShowVéResetConfirm] = useState(false);
  const [támInfo, setTámInfo] = useState<{ név: string; sebesség: number; harckeret: number } | null>(null);

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
    setShowVéHistory(true);
  }

  useEffect(() => {
    if (!showVéResetConfirm && !showVéHistory && !támInfo) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setShowVéResetConfirm(false); setShowVéHistory(false); setTámInfo(null); } }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showVéResetConfirm, showVéHistory, támInfo]);

  const k = karakter;
  const { konstansok, harcmodorBonusz } = data;

  // §16: Fortély módosítók — mindig aktív (feltétel="") + feltételes (aktív taktika/helyzet/szituáció)
  const aktívFeltételek = new Set<string>();
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (def) aktívFeltételek.add(def.feltétel_kulcs);
  }
  for (const h of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === h);
    if (def) aktívFeltételek.add(def.feltétel_kulcs);
  }
  for (const sz of session.aktív_szituációk) {
    const def = data.szituaciok.find(d => d.név === sz);
    if (def) aktívFeltételek.add(def.feltétel_kulcs);
  }

  const fortelyMods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0, CÉ: 0, harckeret: 0, SFÉ: 0 };
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.feltétel !== '' && !aktívFeltételek.has(mod.feltétel)) continue;
      if (mod.mód === 'flat') {
        fortelyMods[mod.cél] = (fortelyMods[mod.cél] ?? 0) + mod.érték;
      } else if (mod.mód === 'scaled' && mod.forrás) {
        const forrásÉrték = k.képzettségek.find(kp => kp.név.toLowerCase() === mod.forrás)?.szint ?? 0;
        fortelyMods[mod.cél] = (fortelyMods[mod.cél] ?? 0) + Math.floor(forrásÉrték * mod.arány);
      }
    }
  }
  const fortelyKE = fortelyMods['KÉ'];

  // Taktika módosítók kiszámítása az aktív taktikákból
  const taktikaMods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef) {
        if (fokDef.TÉ) taktikaMods['TÉ'] += fokDef.TÉ;
        if (fokDef.VÉ) taktikaMods['VÉ'] += fokDef.VÉ;
        if (fokDef.KÉ) taktikaMods['KÉ'] += fokDef.KÉ;
        if (fokDef.SP) taktikaMods['SP'] += fokDef.SP;
      }
    } else if (def.módosítók) {
      if (def.módosítók.TÉ) taktikaMods['TÉ'] += def.módosítók.TÉ;
      if (def.módosítók.VÉ) taktikaMods['VÉ'] += def.módosítók.VÉ;
      if (def.módosítók.KÉ) taktikaMods['KÉ'] += def.módosítók.KÉ;
      if (def.módosítók.SP) taktikaMods['SP'] += def.módosítók.SP;
    }
  }

  const harcmodorÖsszeg = [
    k.képzettségek.find(kp => kp.név === 'Közelharc')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Kardvívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Rombolás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Lándzsavívás')?.szint ?? 0,
    k.képzettségek.find(kp => kp.név === 'Ostorharc')?.szint ?? 0,
  ].reduce((a, b) => a + b, 0);

  // Páncél + lookup tables — all logic now in rules.json
  const merevvértFok = k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const csatoltMgt = konstansok.páncél_csatolt_tag_mgt;

  const lookupArrays = new Map<string, Record<string, number | string>[]>();
  lookupArrays.set('csatolt_mgt_merev', Object.entries(csatoltMgt.merevvért_fém).map(([n, v]) => ({ név: n, érték: v })));
  lookupArrays.set('csatolt_mgt_fém', Object.entries(csatoltMgt.hajlékonyvért_fém).map(([n, v]) => ({ név: n, érték: v })));
  lookupArrays.set('csatolt_mgt_nemfém', Object.entries(csatoltMgt.hajlékonyvért_nem_fém).map(([n, v]) => ({ név: n, érték: v })));
  lookupArrays.set('struktúrák', konstansok.páncél_struktúrák.map(s => ({ név: s.struktúra, mgt: s.mgt, sfé_fizikai: s.sfé_fizikai, sfé_energia: s.sfé_energia, merev: s.merev ? 1 : 0, fém: s.fém ? 1 : 0 })));
  lookupArrays.set('fémalapanyagok', konstansok.páncél_fémalapanyagok.map(a => ({ anyag: a.anyag, mgt: a.mgt, sfé_bónusz: a.sfé_bónusz })));
  lookupArrays.set('méret_tábla', [{ név: 'passzol', érték: 0 }, { név: 'nem passzol', érték: 3 }, { név: 'borzalmas', érték: 6 }]);
  lookupArrays.set('merevvért_tábla', konstansok.merevvértviselet_bónuszok.map(b => ({ fok: b.fok, csökkentés: b.TÉ_büntetés_csökkentés })));

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_alap', k.páncél.alap);
  stringCtx.set('páncél_fémalapanyag', k.páncél.fémalapanyag);
  stringCtx.set('páncél_kidolgozottság', k.páncél.kidolgozottság);
  stringCtx.set('páncél_méret_illeszkedés', k.páncél.méret_illeszkedés);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok as any, {
    fortélyMod_KÉ: fortelyKE,
    harcmodor_összeg: harcmodorÖsszeg,
    HM_TÉ: k.HM_TÉ,
    HM_VÉ: k.HM_VÉ,
    CM: k.CM,
    felszerelés_terhelés: 0,
    alakzatharc_szint: 0,
    merevvért_fok: merevvértFok,
    páncél_van: k.páncél.alap ? 1 : 0,
    páncél_végtagvédettség: k.páncél.végtagvédettség,
    páncél_sisak: k.páncél.sisak ? 1 : 0,
    páncél_idea: k.páncél.idea,
    páncél_rongálódás: k.páncél.rongálódás,
  });
  const computed = evaluate(data.rules, ctx, lookupArrays, stringCtx);

  const épValue = computed.get('ÉP') ?? 40;
  const ké = (computed.get('KÉ') ?? 0) + taktikaMods['KÉ'];
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const sfé_fizikai = (session.aktív_páncél ? (computed.get('sfé_fizikai') ?? 0) : 0) + fortelyMods['SFÉ'];
  const sfé_energia = (session.aktív_páncél ? (computed.get('sfé_energia') ?? 0) : 0) + fortelyMods['SFÉ'];
  const páncélLefedettség = session.aktív_páncél ? (computed.get('páncél_lefedettség') ?? 0) : 0;

  // Fegyverek — build from karakter.fegyverek, expand MK pairs
  const fegyverRows: { név: string; fDef: typeof data.fegyverek[0]; mfFok: number }[] = [];
  // Always include Puszta kéz
  const pusztaKez = data.fegyverek.find(f => f.Fegyver.toLowerCase() === 'puszta kéz');
  if (pusztaKez) fegyverRows.push({ név: pusztaKez.Fegyver, fDef: pusztaKez, mfFok: 0 });
  // Karakter fegyverek
  for (const fp of k.fegyverek) {
    const fDef = data.fegyverek.find(f => f.Fegyver.toLowerCase() === fp.alap.toLowerCase());
    if (!fDef) continue;
    const displayName = fDef.Alapnév || fDef.Fegyver;
    const mfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === displayName || f.spec_elem === fp.alap));
    const mfFok = mfEntry?.fok ?? 0;
    fegyverRows.push({ név: fDef.Fegyver, fDef, mfFok });
    // If MK pair exists, add 2K row with same MF/idea
    if (fDef.MK_pár) {
      const párDef = data.fegyverek.find(f => f.Fegyver === fDef.MK_pár);
      if (párDef) fegyverRows.push({ név: párDef.Fegyver, fDef: párDef, mfFok });
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
      HM_TÉ: k.HM_TÉ,
      HM_VÉ: k.HM_VÉ,
      felszerelés_mgt: 0,
      merevvért_fok: merevvértFok,
      páncél_van: k.páncél.alap ? 1 : 0,
      páncél_végtagvédettség: k.páncél.végtagvédettség,
      páncél_sisak: k.páncél.sisak ? 1 : 0,
      páncél_idea: k.páncél.idea,
      páncél_rongálódás: k.páncél.rongálódás,
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
      fegyver_fortély_TÉ: fortelyMods['TÉ'],
      fegyver_fortély_VÉ: fortelyMods['VÉ'],
      fegyver_fortély_SP: fortelyMods['SP'],
      fegyver_fortély_harckeret: fortelyMods['harckeret'],
      fortélyMod_KÉ: fortelyKE,
      harcmodor_összeg: harcmodorÖsszeg,
      alakzatharc_szint: 0,
    });
    const fComp = evaluate(data.rules, fCtx, lookupArrays, stringCtx);

    return {
      fegyver_név: fDef.Fegyver,
      TÉ: fComp.get('fegyver_TÉ') ?? 0,
      VÉ: fComp.get('fegyver_VÉ') ?? 0,
      SP: fComp.get('fegyver_SP') ?? 0,
      támadások: fComp.get('fegyver_támadások') ?? 1,
      harckeret: fComp.get('fegyver_harckeret') ?? 0,
      sebesség: parseInt(fDef.Sebesség) || 6,
      pengehossz: parseFloat(fDef.Pengehossz) || 0,
      sebzésmód: fDef['Sebzés módja'],
    };
  });

  // Pajzs VÉ
  const pajzsVÉ = session.aktív_pajzs ? 10 : 0;

  // ÉP TÉ levonás
  const oszlopMéret = épValue / 4;
  const téLevonások = (konstansok.egészség_kategória_levonás as { szint: string; módosítók: { cél: string; érték: number }[] }[])
    .map(ek => {
      const téMod = ek.módosítók.find(m => m.cél === 'TÉ');
      return téMod?.érték ?? 0;
    });
  const [sebCount, setSebCount] = useState(0);
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / oszlopMéret) - 1);
  const téLevonás = téLevonások[aktKat];

  // Max VÉ csökkenés
  const maxVéCsökk = Math.max(0, ...fegyverResults.map(r => r.VÉ + pajzsVÉ + taktikaMods['VÉ']));

  // MP
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  return (
    <div className="screen harc-screen">
      <div className="harc-header">
        <div className="ke-box"><span className="label">KÉ</span><span className="value">{ké}</span></div>
        <div className="sfe-box">
          <span className="label">SFÉ ({páncélLefedettség}%)</span>
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
              <td style={{ cursor: 'pointer' }} onClick={() => setTámInfo({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
              <td>{r.TÉ + téLevonás + taktikaMods['TÉ']}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + pajzsVÉ + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
              <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
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
          téLevonások={téLevonások}
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

      {támInfo && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label style={{ fontWeight: 'bold' }}>{támInfo.név}</label>
            <div style={{ fontSize: '15px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>Sebesség: {támInfo.sebesség}</span>
              <span>Harckeret: {támInfo.harckeret}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
