import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, SebzésRubrika } from '../engine/types';
import { evaluate, buildContext } from '../engine/reactive';
import { lookupFegyver } from '../engine/helpers';
import { buildAktívFeltételek } from '../engine/feltetelek';
import { calcTaktikaMods, buildPancelLookups, calcFortelyMods, buildFegyverRows, calcFegyverResults, applyFegyverOverrides, calcKétkezes, calcFogás, calcFtEnyhítés } from './HarcCalc';
import { EpTable } from './EpTable';
import './HarcScreen.css';

export function HarcScreen({ data, karakter, session, setSession, pushUndo, onNavigate }: {
  data: GameData;
  karakter: Karakter;
  session: Session;
  setSession: React.Dispatch<React.SetStateAction<Session>>;
  pushUndo: (leírás: string) => void;
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
    if (diff !== 0) pushUndo(`${diff > 0 ? 'VÉ csökkenés' : 'VÉ visszanyerés'}: ${diff > 0 ? '-' : '+'}${Math.abs(diff)}`);
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
  const { konstansok } = data;

  const aktívFeltételek = buildAktívFeltételek(session, data);

  // Taktika módosítók
  const taktikaMods = calcTaktikaMods(session, data);

  const harcmodorÖsszeg = [...new Set(Object.values(konstansok.fegyver_kategória_harcmodor) as string[])].reduce((s: number, név: string) =>
    s + (k.képzettségek.find(kp => kp.név === név)?.szint ?? 0), 0);

  // Páncél
  const merevvértFok = k.fortélyok.find(f => f.név === 'Merevvértviselet')?.fok ?? 0;
  const lookupArrays = buildPancelLookups(konstansok);

  const stringCtx = new Map<string, string>();
  stringCtx.set('páncél_alap', k.páncél.alap);
  stringCtx.set('páncél_fémalapanyag', k.páncél.fémalapanyag);
  stringCtx.set('páncél_kidolgozottság', k.páncél.kidolgozottság);
  stringCtx.set('páncél_méret_illeszkedés', k.páncél.méret_illeszkedés);

  // Aktív fegyver computed értékek (Belharc feltételekhez)
  const aktívFegyverFp = session.aktív_fegyver_index >= 0 ? k.fegyverek[session.aktív_fegyver_index] : null;
  const pajzsFegyverNév = k.pajzs?.méret ? (k.pajzs.méret.charAt(0).toUpperCase() + k.pajzs.méret.slice(1) + ' Pajzs') : null;
  const aktívFegyverDef = session.aktív_fegyver_index === -2
    ? lookupFegyver(data.fegyverek, pajzsFegyverNév ?? '')
    : aktívFegyverFp ? lookupFegyver(data.fegyverek, aktívFegyverFp.alap) : null;
  const jobbPengehossz = aktívFegyverDef ? (parseFloat(aktívFegyverDef.Pengehossz) || 0) : 0;
  let aktívFegyverPengehossz = jobbPengehossz;
  // Kétkezes harc / hárítófegyver: bal kéz pengehossza is számít (összeg)
  if (session.kétkezes_harc && session.aktív_fegyver_bal_index >= 0 || session.fegyverfogás === 'fegyver_hárító' && session.aktív_fegyver_bal_index >= 0) {
    const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
    const balDef = balFp ? lookupFegyver(data.fegyverek, balFp.alap) : null;
    aktívFegyverPengehossz += balDef ? (parseFloat(balDef.Pengehossz) || 0) : 0;
  }
  const aktívFegyverKat = aktívFegyverDef?.Kategória ?? 'közelharci';
  const aktívFegyverHarcmodor = konstansok.fegyver_kategória_harcmodor[aktívFegyverKat] ?? 'Közelharc';
  stringCtx.set('aktív_fegyver_harcmodor', aktívFegyverHarcmodor);
  // Fegyver kategória feltétel hozzáadása
  aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok, {
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
    aktív_fegyver_pengehossz: aktívFegyverPengehossz,
  });
  const computed = evaluate(data.rules, ctx, lookupArrays, stringCtx);

  // Kalkulált feltétel kontextus — generikus: computed + session + ctx + stringCtx + aktívFeltételek
  function getFeltételÉrték(forrás: string): number | boolean | string | undefined {
    if (aktívFeltételek.has(forrás)) return true;
    if (forrás in session) return (session as unknown as Record<string, unknown>)[forrás] as number | boolean;
    if (computed.has(forrás)) return computed.get(forrás)!;
    if (ctx.has(forrás)) return ctx.get(forrás)!;
    if (stringCtx.has(forrás)) return stringCtx.get(forrás)!;
    // Prefix kulcs ami NINCS az aktívFeltételek-ben → false
    if (forrás.includes(':')) return false;
    return undefined;
  }

  function feltételTeljesül(feltétel: unknown): boolean {
    if (!feltétel || feltétel === '') return true;
    if (typeof feltétel === 'string') return aktívFeltételek.has(feltétel);
    if (Array.isArray(feltétel)) {
      return feltétel.every((pred: { forrás: string; operátor: string; érték: unknown }) => {
        const val = getFeltételÉrték(pred.forrás);
        if (val === undefined) return false;
        const normVal = typeof val === 'boolean' ? (val ? 1 : 0) : val;
        const normExp = typeof pred.érték === 'boolean' ? (pred.érték ? 1 : 0) : pred.érték;
        switch (pred.operátor) {
          case '==': return normVal === normExp;
          case '!=': return normVal !== normExp;
          case '>=': return (normVal as number) >= (normExp as number);
          case '<=': return (normVal as number) <= (normExp as number);
          case '>': return (normVal as number) > (normExp as number);
          case '<': return (normVal as number) < (normExp as number);
          default: return false;
        }
      });
    }
    return false;
  }

  const fortelyMods = calcFortelyMods(k, session, data, aktívFeltételek, feltételTeljesül);
  const fortelyKE = fortelyMods['KÉ'];

  const épValue = computed.get('ÉP') ?? 40;
  const ké = (computed.get('KÉ') ?? 0) + taktikaMods['KÉ'] + fortelyKE;
  const manöverPont = computed.get('manőver_pont') ?? 0;
  const sfé_fizikai = (session.aktív_páncél ? (computed.get('sfé_fizikai') ?? 0) : 0) + fortelyMods['SFÉ'];
  const sfé_energia = (session.aktív_páncél ? (computed.get('sfé_energia') ?? 0) : 0) + fortelyMods['SFÉ'];
  const páncélLefedettség = session.aktív_páncél ? (computed.get('páncél_lefedettség') ?? 0) : 0;

  // Fegyverek
  const fegyverRows = buildFegyverRows(k, data, pajzsFegyverNév);

  const fegyverResults = calcFegyverResults(fegyverRows, k, data, fortelyMods, merevvértFok, harcmodorÖsszeg, lookupArrays, stringCtx);

  // Fegyver override aktív harci helyzetekből
  const belharciAktív = session.aktív_helyzetek.includes('Belharci helyzet');
  applyFegyverOverrides(fegyverResults, session, data, feltételTeljesül);

  // Kétkezes harc
  const kétkezesResult = calcKétkezes(k, session, data, fortelyMods, feltételTeljesül);

  // Pajzs / Hárító / Fogás
  const { pajzsVÉ, fogásResult } = calcFogás(k, session, data, fortelyMods);

  // ÉP TÉ levonás
  const oszlopMéret = épValue / konstansok.sebesülés_kategóriák_száma;
  const téLevonások = (konstansok.egészség_kategória_levonás as { szint: string; módosítók: { cél: string; érték: number }[] }[])
    .map(ek => {
      const téMod = ek.módosítók.find(m => m.cél === 'TÉ');
      return téMod?.érték ?? 0;
    });
  const [sebCount, setSebCount] = useState(0);
  const aktKat = sebCount === 0 ? 0 : Math.min(3, Math.ceil(sebCount / oszlopMéret) - 1);
  const téLevonás = téLevonások[aktKat];

  // Auto Sérült státusz S3/S4 alapján
  useEffect(() => {
    const inS3 = sebCount > 2 * oszlopMéret;
    const inS4 = sebCount > 3 * oszlopMéret;
    const targetFok = inS4 ? 2 : inS3 ? 1 : 0;
    const current = session.aktív_státuszok.find(s => s.startsWith('Sérült ('));
    const currentFok = current ? parseInt(current.match(/\((\d+)\)/)?.[1] ?? '0') : 0;
    if (targetFok === currentFok) return;
    setSession(prev => {
      const filtered = prev.aktív_státuszok.filter(s => !s.startsWith('Sérült ('));
      if (targetFok === 0) return { ...prev, aktív_státuszok: filtered };
      return { ...prev, aktív_státuszok: [...filtered, `Sérült (${targetFok})`] };
    });
  }, [sebCount, oszlopMéret]);

  // Max VÉ csökkenés
  const maxVéCsökk = Math.max(0, ...(kétkezesResult
    ? [kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ']]
    : fogásResult
      ? fegyverResults.map(r => r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'])
      : fegyverResults.map(r => r.VÉ + pajzsVÉ + taktikaMods['VÉ'])));

  // MP
  const aktMP = Math.max(0, manöverPont - session.manőver_pont_használt);

  return (
    <div className="screen harc-screen">
      <h2>🗡️ Harc</h2>
      <div className="harc-header">
        <div className="ke-box"><span className="label">KÉ</span><span className="value">{ké}</span></div>
        <div className="sfe-box">
          <span className="label">SFÉ (<span style={{ fontFamily: 'monospace' }}>{páncélLefedettség}%</span>)</span>
          <div className="sfe-values">
            <span className="sfe-line">Fizikai: <strong>{sfé_fizikai}</strong></span>
            <span className="sfe-line" style={{ color: '#aaa' }}>Energia: <strong>{sfé_energia}</strong></span>
          </div>
        </div>
        <div className="ve-csokk-box">
          <span className="label" onClick={handleVéLabelTap}>VÉ csökkenés</span>
          <span className="value" onClick={handleVéLabelTap}>{session.vé_csökkenés === 0 ? 0 : -session.vé_csökkenés}</span>
          <div className="ve-btns">
            {(konstansok.vé_csökkentés_gombok as number[]).map(n => (
              <button key={n} disabled={session.vé_csökkenés >= maxVéCsökk} onClick={() => changeVé(Math.min(session.vé_csökkenés + n, maxVéCsökk))}>-{n}</button>
            ))}
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

      <table className="harc-table">
        <thead>
          <tr><th>{belharciAktív ? <span className="harc-belharc-label">BELHARC</span> : 'Fegyver'}</th><th>Tám</th><th className="te-col">TÉ</th><th className="ve-col">VÉ</th><th>SP</th><th>Ph</th></tr>
        </thead>
        <tbody>
          {kétkezesResult && (
            <tr style={{ border: '2px solid #90caf9' }}>
              <td style={belharciAktív && kétkezesResult.sumPengehossz > 0 ? { color: '#e53935' } : undefined}>{kétkezesResult.fegyver_név}</td>
              <td className="harc-tam-clickable" onClick={() => setTámInfo({ név: kétkezesResult.fegyver_név, sebesség: kétkezesResult.sebesség, harckeret: kétkezesResult.harckeret })}>{kétkezesResult.támadások}</td>
              <td>{kétkezesResult.TÉ + téLevonás + taktikaMods['TÉ'] + (kétkezesResult.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
              <td>{kétkezesResult.SP + taktikaMods['SP']} {kétkezesResult.sebzésmód}</td>
              <td className={fortelyMods['pengehossz'] ? 'ph-bonus' : undefined}>{kétkezesResult.pengehossz + fortelyMods['pengehossz']}({kétkezesResult.sumPengehossz + fortelyMods['pengehossz']})</td>
            </tr>
          )}
          {!kétkezesResult && fogásResult && (() => {
            const jobbFp = k.fegyverek[session.aktív_fegyver_index];
            const jobbNév = jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : '';
            const r = fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? fegyverResults[0];
            if (!r) return null;
            return (
              <tr style={{ border: '2px solid #90caf9' }}>
                <td>{fogásResult.név}</td>
                <td className="harc-tam-clickable" onClick={() => setTámInfo({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
                <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + fogásResult.TÉ_büntetés + (r.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
                <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
                <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
                <td className={fortelyMods['pengehossz'] ? 'ph-bonus' : undefined}>{r.pengehossz + fortelyMods['pengehossz']}</td>
              </tr>
            );
          })()}
          {fegyverResults.map((r, i) => (
            <tr key={i} style={(() => {
              if (kétkezesResult || fogásResult) return { opacity: 0.4 };
              const jobbFp = k.fegyverek[session.aktív_fegyver_index];
              const jobbNév = session.aktív_fegyver_index === -2 ? (pajzsFegyverNév ?? '') : jobbFp ? (lookupFegyver(data.fegyverek, jobbFp.alap)?.Fegyver ?? '') : 'Puszta kéz';
              if (r.fegyver_név !== jobbNév) return { opacity: 0.4 };
              return undefined;
            })()}>
              <td style={belharciAktív && r.pengehossz > 0 ? { color: '#e53935' } : undefined}>{r.fegyver_név}</td>
              <td className="harc-tam-clickable" onClick={() => setTámInfo({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
              <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + (r.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + (fogásResult ? 0 : pajzsVÉ) + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
              <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
              <td className={fortelyMods['pengehossz'] ? 'ph-bonus' : undefined}>{r.pengehossz + fortelyMods['pengehossz']}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="harc-section">
        <EpTable
          ÉP={épValue}
          kategóriák={konstansok.sebesülés_kategóriák_száma}
          onSebCountChange={setSebCount}
          ftEnyhítés={calcFtEnyhítés(k.képzettségek, data.konstansok.fájdalomtűrés_enyhítés)}
          téLevonások={téLevonások}
          onNavigate={k.képzettségek.some(kp => kp.név === 'Fájdalomtűrés') ? () => {
            onNavigate?.('tulajdonsagok');
            setTimeout(() => { document.querySelector('[data-kep="Fájdalomtűrés"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 200);
          } : undefined}
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
