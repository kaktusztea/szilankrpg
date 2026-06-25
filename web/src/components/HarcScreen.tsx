import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { GameData } from '../engine/data-loader';
import type { Karakter, Session, SebzésRubrika } from '../engine/types';
import { evaluate, buildContext } from '../engine/reactive';
import { buildAktívFeltételek } from '../engine/feltetelek';
import { calcKétkezesHarc } from '../engine/ketkezes';
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
  const { konstansok, harcmodorBonusz } = data;

  const aktívFeltételek = buildAktívFeltételek(session, data);

  // Taktika módosítók kiszámítása az aktív taktikákból
  const taktikaMods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0 };
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      let fokDef = def.fokok.find(f => f.fok === at.fok);
      // Extra fok extrapoláció (fortély_bővítés)
      if (!fokDef && def.fortély_bővítés) {
        const utolsó = def.fokok[def.fokok.length - 1];
        const perFok: Record<string, number> = {};
        for (const [k, v] of Object.entries(utolsó)) { if (k !== 'fok' && k !== 'hatások' && typeof v === 'number') perFok[k] = v / utolsó.fok; }
        fokDef = { fok: at.fok } as typeof utolsó;
        for (const [k, step] of Object.entries(perFok)) (fokDef as any)[k] = Math.round(step * at.fok);
      }
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

  // Taktika VÉ eltolás limit (ökölszabály)
  const véLimit = konstansok.taktika_vé_eltolás_limit;
  taktikaMods['VÉ'] = Math.max(-véLimit, Math.min(véLimit, taktikaMods['VÉ']));

  const harcmodorÖsszeg = Object.values(konstansok.fegyver_kategória_harcmodor).reduce((s: number, név: string) =>
    s + (k.képzettségek.find(kp => kp.név === név)?.szint ?? 0), 0);

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

  // Aktív fegyver computed értékek (Belharc feltételekhez)
  const aktívFegyverFp = session.aktív_fegyver_index >= 0 ? k.fegyverek[session.aktív_fegyver_index] : null;
  const pajzsFegyverNév = k.pajzs?.méret ? (k.pajzs.méret.charAt(0).toUpperCase() + k.pajzs.méret.slice(1) + ' Pajzs') : null;
  const aktívFegyverDef = session.aktív_fegyver_index === -2
    ? data.fegyverek.find(f => f.Fegyver === pajzsFegyverNév)
    : aktívFegyverFp ? data.fegyverek.find(f => f.Fegyver.toLowerCase() === aktívFegyverFp.alap.toLowerCase()) : null;
  const jobbPengehossz = aktívFegyverDef ? (parseFloat(aktívFegyverDef.Pengehossz) || 0) : 0;
  let aktívFegyverPengehossz = jobbPengehossz;
  // Kétkezes harc / hárítófegyver: bal kéz pengehossza is számít (összeg)
  if (session.kétkezes_harc && session.aktív_fegyver_bal_index >= 0 || session.fegyverfogás === 'fegyver_hárító' && session.aktív_fegyver_bal_index >= 0) {
    const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
    const balDef = balFp ? data.fegyverek.find(f => f.Fegyver.toLowerCase() === balFp.alap.toLowerCase()) : null;
    aktívFegyverPengehossz += balDef ? (parseFloat(balDef.Pengehossz) || 0) : 0;
  }
  const aktívFegyverKat = aktívFegyverDef?.Kategória ?? 'közelharci';
  const aktívFegyverHarcmodor = konstansok.fegyver_kategória_harcmodor[aktívFegyverKat] ?? 'Közelharc';
  stringCtx.set('aktív_fegyver_harcmodor', aktívFegyverHarcmodor);
  // Fegyver kategória feltétel hozzáadása
  aktívFeltételek.add(`fegyver_kategória:${aktívFegyverKat}`);

  const ctx = buildContext(k.tulajdonságok, k.tsz, konstansok as any, {
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

  const fortelyMods: Record<string, number> = { KÉ: 0, TÉ: 0, VÉ: 0, SP: 0, CÉ: 0, harckeret: 0, SFÉ: 0 };
  for (const kf of k.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def) continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (!feltételTeljesül(mod.feltétel)) continue;
      // session_toggle fortélyok: TÉ/VÉ módosítók csak ha az aktív
      if (def.session_toggle && (mod.cél === 'TÉ' || mod.cél === 'VÉ') && !(session as unknown as Record<string, unknown>)[kf.név.toLowerCase().replace(/ /g, '_')]) continue;
      if (mod.mód === 'flat') {
        fortelyMods[mod.cél] = (fortelyMods[mod.cél] ?? 0) + mod.érték;
      } else if (mod.mód === 'scaled' && mod.forrás) {
        const forrásÉrték = k.képzettségek.find(kp => kp.név.toLowerCase() === mod.forrás)?.szint ?? 0;
        fortelyMods[mod.cél] = (fortelyMods[mod.cél] ?? 0) + Math.floor(forrásÉrték * mod.arány);
      }
    }
  }
  const fortelyKE = fortelyMods['KÉ'];

  const épValue = computed.get('ÉP') ?? 40;
  const ké = (computed.get('KÉ') ?? 0) + taktikaMods['KÉ'] + fortelyKE;
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
  // Pajzs fegyverként (ha van méret kiválasztva)
  if (pajzsFegyverNév) {
    const pajzsDef = data.fegyverek.find(f => f.Fegyver === pajzsFegyverNév);
    if (pajzsDef) {
      fegyverRows.push({ név: pajzsDef.Fegyver, fDef: pajzsDef, mfFok: 0 });
    }
  }


  const fegyverResults = fegyverRows.map(({ fDef, mfFok }) => {
    const kat = fDef.Kategória;
    const harcmodorNév = konstansok.fegyver_kategória_harcmodor[kat] ?? 'Közelharc';
    const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
    const hb = harcmodorBonusz.find(b => b.szint === harcmodorSzint);
    const mf = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };

    // Evaluate reactive rules with weapon-specific context
    // Override módosítók: fegyver-specifikus feltétel ("fegyver:X") → alap SP felülírás
    let alapSP = parseInt(fDef.SP) || 0;
    for (const kf of k.fortélyok) {
      const fDef2 = data.fortelySummaries.find(d => d.név === kf.név);
      if (!fDef2) continue;
      const fokDef2 = fDef2.fokok.find(fd => fd.fok === kf.fok);
      if (!fokDef2?.módosítók) continue;
      for (const mod of fokDef2.módosítók) {
        if (mod.mód !== 'override' || mod.cél !== 'SP') continue;
        if (typeof mod.feltétel === 'string' && mod.feltétel.startsWith('fegyver:')) {
          const fegyverNév = mod.feltétel.slice('fegyver:'.length);
          if (fDef.Fegyver.toLowerCase() === fegyverNév.toLowerCase()) alapSP = mod.érték;
        }
      }
    }
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
      fegyver_alap_SP: alapSP,
      fegyver_erőbónusz_limit: fDef['Erőbónusz limit'] !== '' ? parseInt(fDef['Erőbónusz limit']) : 99,
      fegyver_sebesség: parseInt(fDef.Sebesség) || 6,
      fegyver_mf_TÉ: mf.TÉ,
      fegyver_mf_VÉ: mf.VÉ,
      fegyver_mf_SP: mf.SP,
      fegyver_fortély_TÉ: fortelyMods['TÉ'],
      fegyver_fortély_VÉ: fortelyMods['VÉ'],
      fegyver_fortély_SP: fortelyMods['SP'],
      fegyver_fortély_harckeret: fortelyMods['harckeret'],
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
      alap_TÉ: parseInt(fDef.TÉ) || 0,
      alap_VÉ: parseInt(fDef.VÉ) || 0,
    };
  });

  // Fegyver override aktív harci helyzetekből (pl. Belharci helyzet: fegyver TÉ/VÉ=0 ha pengehossz>0)
  const belharciAktív = session.aktív_helyzetek.includes('Belharci helyzet');
  for (const helyzetNév of session.aktív_helyzetek) {
    const hDef = data.harciHelyzetek.find(h => h.név === helyzetNév);
    if (!hDef?.fegyver_override) continue;
    const overFeltétel = hDef.fegyver_override.feltétel;
    if (!feltételTeljesül(overFeltétel)) continue;
    for (const mod of hDef.fegyver_override.módosítók) {
      for (const r of fegyverResults) {
        if (mod.cél === 'fegyver_TÉ' && mod.mód === 'override') r.TÉ -= r.alap_TÉ;
        if (mod.cél === 'fegyver_VÉ' && mod.mód === 'override') r.VÉ -= r.alap_VÉ;
      }
    }
  }

  // Kétkezes harc összevont kalkuláció
  let kétkezesResult: (typeof fegyverResults[0] & { sumPengehossz: number }) | null = null;
  if (session.kétkezes_harc && session.aktív_fegyver_bal_index >= 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    const balFp = k.fegyverek[session.aktív_fegyver_bal_index];
    if (jobbFp && balFp) {
      kétkezesResult = calcKétkezesHarc({
        jobbFp, balFp, fegyverek: data.fegyverek, karakter: k,
        konstansok: konstansok as any, harcmodorBonusz, fortelyMods,
      });
    }
  }

  // Fegyver override a kétkezes result-ra is
  if (kétkezesResult) {
    for (const helyzetNév of session.aktív_helyzetek) {
      const hDef = data.harciHelyzetek.find(h => h.név === helyzetNév);
      if (!hDef?.fegyver_override) continue;
      if (!feltételTeljesül(hDef.fegyver_override.feltétel)) continue;
      for (const mod of hDef.fegyver_override.módosítók) {
        if (mod.cél === 'fegyver_TÉ' && mod.mód === 'override') kétkezesResult.TÉ -= kétkezesResult.alap_TÉ;
        if (mod.cél === 'fegyver_VÉ' && mod.mód === 'override') kétkezesResult.VÉ -= kétkezesResult.alap_VÉ;
      }
    }
  }

  // Pajzs VÉ — lookup méret alapján
  const PAJZS_MÉRET_NÉV: Record<string, string> = { kis: 'Kis Pajzs', közepes: 'Közepes Pajzs', nagy: 'Nagy Pajzs' };
  const pajzsDef = (session.aktív_pajzs || session.fegyverfogás === 'fegyver_pajzs') && k.pajzs.méret ? data.pajzsok.find(p => p.Pajzs === PAJZS_MÉRET_NÉV[k.pajzs.méret]) : null;
  const pajzsVÉ = pajzsDef ? parseInt(pajzsDef.VÉ) || 0 : 0;

  // Pajzs TÉ büntetés: konstansok lookup + fortély mérséklés
  const pajzsTÉBüntetés = (() => {
    if (session.fegyverfogás !== 'fegyver_pajzs' || !k.pajzs.méret) return 0;
    const entry = konstansok.pajzs_TÉ_büntetés?.find((e: { méret: string; büntetés: number }) => e.méret === k.pajzs.méret);
    const alap = entry?.büntetés ?? 0;
    const mérséklés = fortelyMods['pajzs_TÉ_mérséklés'] ?? 0;
    return Math.min(0, alap + mérséklés);
  })();

  // Hárítófegyver VÉ
  let hárítóVÉ = 0;
  let hárítóNév = '';
  const hasHárítóFortély = k.fortélyok.some(f => f.név === 'Hárítófegyver használat');
  if (session.fegyverfogás === 'fegyver_hárító' && session.aktív_fegyver_bal_index >= 0 && hasHárítóFortély) {
    const hFp = k.fegyverek[session.aktív_fegyver_bal_index];
    if (hFp) {
      const hDef = data.fegyverek.find(d => d.Fegyver.toLowerCase() === hFp.alap.toLowerCase());
      if (hDef?.Hárító === '1') {
        hárítóVÉ = parseInt(hDef.VÉ) || 0;
        hárítóNév = hFp.alap;
        // Mesterfegyver VÉ bónusz a hárítófegyverre
        const hDisplayName = hDef.Alapnév || hDef.Fegyver;
        const hMfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === hDisplayName || f.spec_elem === hFp.alap));
        if (hMfEntry) {
          const hMf = konstansok.mesterfegyver_bónuszok.find(b => b.fok === hMfEntry.fok);
          if (hMf) hárítóVÉ += hMf.VÉ;
        }
      }
    }
  }

  // Fogás összesítő sor (pajzs / hárító)
  let fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null = null;
  if (session.fegyverfogás === 'fegyver_pajzs' && pajzsVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + Pajzs', VÉ_bónusz: pajzsVÉ, TÉ_büntetés: pajzsTÉBüntetés };
  } else if (session.fegyverfogás === 'fegyver_hárító' && hárítóVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + ' + hárítóNév, VÉ_bónusz: hárítóVÉ, TÉ_büntetés: 0 };
  }

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
  const maxVéCsökk = Math.max(0, ...(kétkezesResult ? [kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ']] : fogásResult ? fegyverResults.map(r => r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ']) : fegyverResults.map(r => r.VÉ + pajzsVÉ + taktikaMods['VÉ'])));

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
          <tr><th>{belharciAktív ? <span style={{ color: '#ef9a9a' }}>BELHARC</span> : 'Fegyver'}</th><th>Tám</th><th className="te-col">TÉ</th><th className="ve-col">VÉ</th><th>SP</th><th>Ph</th></tr>
        </thead>
        <tbody>
          {kétkezesResult && (
            <tr style={{ border: '2px solid #90caf9' }}>
              <td style={belharciAktív && kétkezesResult.sumPengehossz > 0 ? { color: '#e53935' } : undefined}>{kétkezesResult.fegyver_név}</td>
              <td style={{ cursor: 'pointer' }} onClick={() => setTámInfo({ név: kétkezesResult.fegyver_név, sebesség: kétkezesResult.sebesség, harckeret: kétkezesResult.harckeret })}>{kétkezesResult.támadások}</td>
              <td>{kétkezesResult.TÉ + téLevonás + taktikaMods['TÉ'] + (kétkezesResult.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, kétkezesResult.VÉ + pajzsVÉ + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
              <td>{kétkezesResult.SP + taktikaMods['SP']} {kétkezesResult.sebzésmód}</td>
              <td>{kétkezesResult.pengehossz}({kétkezesResult.sumPengehossz})</td>
            </tr>
          )}
          {!kétkezesResult && fogásResult && (() => {
            const jobbFp = k.fegyverek[session.aktív_fegyver_index];
            const jobbNév = jobbFp ? (data.fegyverek.find(d => d.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase())?.Fegyver ?? '') : '';
            const r = fegyverResults.find(fr => fr.fegyver_név === jobbNév) ?? fegyverResults[0];
            if (!r) return null;
            return (
              <tr style={{ border: '2px solid #90caf9' }}>
                <td>{fogásResult.név}</td>
                <td style={{ cursor: 'pointer' }} onClick={() => setTámInfo({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
                <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + fogásResult.TÉ_büntetés + (r.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
                <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + fogásResult.VÉ_bónusz + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
                <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
                <td>{r.pengehossz}</td>
              </tr>
            );
          })()}
          {fegyverResults.map((r, i) => (
            <tr key={i} style={(() => {
              if (kétkezesResult || fogásResult) return { opacity: 0.4 };
              const jobbFp = k.fegyverek[session.aktív_fegyver_index];
              const jobbNév = session.aktív_fegyver_index === -2 ? (pajzsFegyverNév ?? '') : jobbFp ? (data.fegyverek.find(d => d.Fegyver.toLowerCase() === jobbFp.alap.toLowerCase())?.Fegyver ?? '') : 'Puszta kéz';
              if (r.fegyver_név !== jobbNév) return { opacity: 0.4 };
              return undefined;
            })()}>
              <td style={belharciAktív && r.pengehossz > 0 ? { color: '#e53935' } : undefined}>{r.fegyver_név}</td>
              <td style={{ cursor: 'pointer' }} onClick={() => setTámInfo({ név: r.fegyver_név, sebesség: r.sebesség, harckeret: r.harckeret })}>{r.támadások}</td>
              <td>{r.TÉ + téLevonás + taktikaMods['TÉ'] + (r.támadások > 1 ? konstansok.több_támadás_TÉ_levonás : 0)}</td>
              <td className={véFlash === 'down' ? 've-flash-down' : véFlash === 'up' ? 've-flash-up' : ''}>{Math.max(0, r.VÉ + (fogásResult ? 0 : pajzsVÉ) + taktikaMods['VÉ'] - session.vé_csökkenés)}</td>
              <td>{r.SP + taktikaMods['SP']} {r.sebzésmód}</td>
              <td>{r.pengehossz}</td>
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
