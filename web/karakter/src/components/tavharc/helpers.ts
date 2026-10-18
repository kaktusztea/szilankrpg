import type { GameData } from '../../engine/data-loader';
import { képzettségSzint, fortélyFok } from '../../engine/azonosito';
import type { Karakter, Session, TavfegyverAlap, TavharcSzorzok, TavharcSzorzoEntry } from '../../engine/types';
import type { AlkalmatlanInfo, CÉBontás } from './types';
import { buildAktívFeltételek } from '../../engine/feltetelek';
import { getMfFok } from './mesterfegyver-calc';
import { SP_NINCS } from '../../engine/types';
import { gyűjtFortélyEffektek, értékCélra } from '../../engine/effekt';

// --- Alkalmatlan fegyver info ---

export function getAlkalmatlanInfo(k: Karakter, data: GameData): AlkalmatlanInfo {
  const nevek = k.fortélyok
    .filter(f => f.id === 'alkalmatlan_fegyver_hajítása' && f.elem)
    .map(f => f.elem);
  const def = data.tavfegyverek.find(d => d.név.startsWith('🔆'));

  const alkalmiTárgyFortély = k.fortélyok.find(f => f.id === 'alkalmatlan_tárgyak_hajítása');
  const alkalmiTárgyNév = alkalmiTárgyFortély ? 'Alkalmi tárgy' : null;
  // Osztó: alapból 1, a fortély `alkalmi_tárgy_osztó` override-ja (2. fok: 2) cseréli.
  const alkalmiTárgyDef = def && alkalmiTárgyFortély
    ? { ...def, Osztó: értékCélra(gyűjtFortélyEffektek(k, k.session, data, new Set(), f => !f), 'alkalmi_tárgy_osztó', 1) }
    : undefined;

  return { nevek, def, alkalmiTárgyNév, alkalmiTárgyDef };
}

// --- Aktív távfegyver definíció ---

export function getAktívTfDef(
  k: Karakter, session: Session, data: GameData, alkalmatlan: AlkalmatlanInfo
): TavfegyverAlap | undefined {
  const idx = session.aktív_távfegyver_index;
  const peldany = k.távfegyverek[idx];
  if (peldany) return data.tavfegyverek.find(d => d.név.toLowerCase() === peldany.alap.toLowerCase());

  const alkStartIdx = k.távfegyverek.length;
  const alkEndIdx = alkStartIdx + alkalmatlan.nevek.length;
  if (idx >= alkStartIdx && idx < alkEndIdx) return alkalmatlan.def;
  if (idx === alkEndIdx && alkalmatlan.alkalmiTárgyDef) return alkalmatlan.alkalmiTárgyDef;
  return undefined;
}

// --- Mesterfegyver: l. mesterfegyver-calc.ts ---

// --- CÉ kalkuláció ---

export function getFortélyCÉ(k: Karakter, data: GameData, session: Session, fegyverAlap?: string): number {
  const aktívFeltételek = buildAktívFeltételek(session, data);
  let total = 0;
  // Resolve target weapon def (explicit or from session index)
  const tfPeldanyR = fegyverAlap
    ? { alap: fegyverAlap }
    : k.távfegyverek[session.aktív_távfegyver_index];
  const tfDefR = tfPeldanyR
    ? data.tavfegyverek.find(d => d.név.toLowerCase() === tfPeldanyR.alap.toLowerCase())
    : undefined;
  // Helyzet hatások: CÉ flat bónuszok aktív helyzetekből
  for (const hNév of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === hNév);
    if (!def?.hatások) continue;
    for (const h of def.hatások) {
      if (h.cél === 'CÉ' && h.mód === 'flat' && h.érték) total += h.érték;
    }
  }
  // Taktika módosítók: CÉ bónuszok aktív taktikákból
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def?.módosítók?.CÉ) continue;
    // szűrő_harcmodorok: bónusz csak akkor jár ha az aktív távfegyver harcmodora egyezik
    if (def.szűrő_harcmodorok?.length) {
      if (!tfDefR || !def.szűrő_harcmodorok.includes((tfDefR.harcmodor ?? '').toLowerCase())) continue;
    }
    total += def.módosítók.CÉ;
  }
  // Fortély módosítók: feltételes CÉ bónuszok
  for (const fDef of data.fortelySummaries) {
    const effFok = fortélyFok(k.fortélyok, fDef.id);
    const módosítók = fDef.fokok.find(f => f.fok === effFok)?.módosítók;
    if (!módosítók) continue;
    for (const mod of módosítók) {
      if (mod.cél !== 'CÉ' || !mod.feltétel || !aktívFeltételek.has(mod.feltétel)) continue;
      // If feltétel references a taktika with szűrő_harcmodorok, check weapon compatibility
      if (mod.feltétel.startsWith('taktika:')) {
        const tDef = data.taktikak.find(t => t.feltétel_kulcs === mod.feltétel);
        if (tDef?.szűrő_harcmodorok?.length) {
          if (!tfDefR || !tDef.szűrő_harcmodorok.includes((tfDefR.harcmodor ?? '').toLowerCase())) continue;
        }
      }
      total += mod.érték;
    }
  }
  return total;
}

export function calcCÉ(p: { céAlap: number; önuralom: number; CM: number; harcmodorCÉ: number; fegyverCÉ: number; mfCÉ: number; idea: number; fortélyCÉ: number }): number {
  return p.céAlap + p.önuralom + p.CM + p.harcmodorCÉ + p.fegyverCÉ + p.mfCÉ + p.idea + p.fortélyCÉ;
}

/** Mágikus vs normál CÉ input - kategória alapján adaptálja az értékeket */
function getCÉInputs(k: Karakter, def: TavfegyverAlap | undefined, idea: number) {
  const isMágikus = def?.kategória === 'mágikus';
  const mágikusTulajdonságCÉ = k.tsz + (k.tulajdonságok.gyorsaság ?? 0) + (k.tulajdonságok.intelligencia ?? 0);
  return {
    önuralom: isMágikus ? mágikusTulajdonságCÉ : (k.tulajdonságok.önuralom ?? 0),
    // CM mindig számít - mágikus fegyvernél is (szabálykönyv 076: a mágikus
    // CÉ formula tartalmaz + CM-et; csak az Önuralmat váltja TSz+Gyo+Int).
    CM: k.CM,
    idea: isMágikus ? 0 : idea,
    isMágikus,
    mágikusTulajdonságCÉ,
  };
}

/** Teljes CÉ bontás kiszámítása egy adott fegyverhez */
export function calcCÉBontás(k: Karakter, data: GameData, session: Session, def: TavfegyverAlap | undefined, idea: number, fortélyCÉ: number, fegyverAlap?: string): CÉBontás {
  const konstansok = data.konstansok;
  const céAlap = konstansok.harcérték_alap.CÉ;
  const harcmodorNév = def?.harcmodor ?? 'Hajítás';
  const harcmodorSzint = képzettségSzint(k.képzettségek, `távolsági_harcmodor/${harcmodorNév.toLowerCase()}`);
  const harcmodorCÉ = data.harcmodorBonusz.find(b => b.szint === harcmodorSzint)?.CÉ ?? -9;
  const fegyverCÉ = def?.CÉ ?? 0;
  const mfAlap = fegyverAlap ?? k.távfegyverek[session.aktív_távfegyver_index]?.alap ?? '';
  const mfFok = def ? getMfFok(k, mfAlap) : 0;
  const mfCÉ = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok)?.CÉ ?? 0;
  const inp = getCÉInputs(k, def, idea);
  const osztó = def?.Osztó ?? 1;
  const cé = calcCÉ({ céAlap, önuralom: inp.önuralom, CM: inp.CM, harcmodorCÉ, fegyverCÉ, mfCÉ, idea: inp.idea, fortélyCÉ });

  return { céAlap, önuralom: inp.önuralom, CM: inp.CM, harcmodorCÉ, harcmodorNév, harcmodorSzint, fegyverCÉ, mfCÉ, idea: inp.idea, fortélyCÉ, cé, osztó, isMágikus: inp.isMágikus, mágikusTulajdonságCÉ: inp.mágikusTulajdonságCÉ };
}

// --- Támadás ---

export function calcTámadásLabel(params: {
  harcmodorSzint: number; gyorsaság: number; sebesség: number;
  újratöltésEnyhítés: number; alapTámadás: string;
}): string {
  const { harcmodorSzint, gyorsaság, sebesség, újratöltésEnyhítés, alapTámadás } = params;
  if (sebesség <= 0) {
    // ponytail: újratöltésEnyhítés >= 1 = fortély enyhíti a helyzetet → 1x
    return újratöltésEnyhítés >= 1 ? '1x' : alapTámadás;
  }
  const harckeret = harcmodorSzint + gyorsaság;
  if (harckeret <= 0) return '1x';
  return `${1 + Math.floor(harckeret / sebesség)}x`;
}

// --- VÉ ---

export function calcVÉ(szorzóÖsszeg: number, cella: number): number {
  return szorzóÖsszeg >= 1 ? szorzóÖsszeg * cella : cella - Math.abs(szorzóÖsszeg);
}

// --- Újratöltés ---

export function calcÚjratöltésEnyhítés(session: Session, k: Karakter): number {
  if (!session.aktív_helyzetek.includes('Nyílpuska újratöltés')) return 0;
  return fortélyFok(k.fortélyok, 'nyílpuska_újratöltés_fejlesztése');
}

// --- Szorzó összeg ---

export interface SzorzóState {
  célMozgásId: number;
  lövészMozgásId: number;
  méretId: number;
  észlelhetőségId: number;
  szélId: number;
}

export function calcSzorzóÖsszeg(szorzok: TavharcSzorzok, state: SzorzóState): number {
  const get = (list: TavharcSzorzoEntry[], id: number) => list.find(e => e.id === id)?.szorzó ?? 0;
  return get(szorzok.célpont_mozgás, state.célMozgásId)
    + get(szorzok.lövész_mozgás, state.lövészMozgásId)
    + get(szorzok.célpont_méret, state.méretId)
    + get(szorzok.észlelhetőség, state.észlelhetőségId)
    + get(szorzok.szél, state.szélId);
}

// --- Lövéskitérés: l. loveskiteres-calc.ts ---

// --- Távharci SP (engine_spec §17.6) ---

/** Íj: az Erőbónusz csak az adott Erőre tervezett íjnál jár (md/068_08) - a Sebzés popupban kikapcsolható (alapból BE). */
const ÍJ_TERVEZETT_ERŐ_EXTRA = 'tavharc_ij_erobonusz_tervezett';

export interface TávSP {
  /** Az SP a biztos tagokkal (alap + Erőbónusz + Mesterfegyver); SP_NINCS / mágikus: a nyers érték. */
  sp: number;
  /** Bontás a Sebzés popup „Statikus bónuszok" listájához. */
  bónuszok: { forrás: string; érték: number }[];
  /** Íjnál a kapcsolható Erőbónusz (nincs benne az `sp`-ben); egyébként 0. */
  tervezettÍjErő: number;
  /** Az íj Erőbónuszát a fegyver Erőbónusz-limitje vágta (Erő > limit) - a UI jelzi. */
  íjErőLimitált: boolean;
}

/**
 * Távfegyver SP = alap SP + Erőbónusz (min(Erő, erőbónusz_limit); íjnál a Sebzés popupban kapcsolható sor, alapból BE)
 * + Mesterfegyver SP (konstansok.mesterfegyver_bónuszok). Fortély-SP nincs: az egyetlen ilyen feltétel (Orvtámadás)
 * távharcban nem végezhető; a Pajzshasználat pajzs-kötött. Idea: csak a CÉ-re hat (§17.7).
 */
export function calcTávSP(k: Karakter, data: GameData, def: TavfegyverAlap | undefined, mfAlap: string): TávSP {
  if (!def || def.SP === SP_NINCS || def.kategória === 'mágikus') return { sp: def?.SP ?? 0, bónuszok: [], tervezettÍjErő: 0, íjErőLimitált: false };
  const erő = Math.max(0, Math.min(k.tulajdonságok.erő, def.erőbónusz_limit ?? 0));
  const íj = (def.extrák ?? []).includes(ÍJ_TERVEZETT_ERŐ_EXTRA);
  const mfSP = data.konstansok.mesterfegyver_bónuszok.find(b => b.fok === getMfFok(k, mfAlap))?.SP ?? 0;
  const bónuszok = [
    ...(!íj && erő ? [{ forrás: 'Erőbónusz', érték: erő }] : []),
    ...(mfSP ? [{ forrás: `Mesterfegyver - ${mfAlap}`, érték: mfSP }] : []),
  ];
  return {
    sp: def.SP + bónuszok.reduce((s, b) => s + b.érték, 0), bónuszok, tervezettÍjErő: íj ? erő : 0,
    íjErőLimitált: íj && erő > 0 && k.tulajdonságok.erő > (def.erőbónusz_limit ?? 0),
  };
}
