import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, TavfegyverAlap, TavharcSzorzok, TavharcSzorzoEntry } from '../../engine/types';
import type { AlkalmatlanInfo, CÉBontás } from './types';
import { buildAktívFeltételek } from '../../engine/feltetelek';

// --- Alkalmatlan fegyver info ---

export function getAlkalmatlanInfo(k: Karakter, data: GameData): AlkalmatlanInfo {
  const nevek = k.fortélyok
    .filter(f => f.név === 'Alkalmatlan fegyver hajítása' && f.spec_elem)
    .map(f => f.spec_elem);
  const def = data.tavfegyverek.find(d => d.Fegyver.startsWith('🔆'));

  const alkalmiTárgyFortély = k.fortélyok.find(f => f.név === 'Alkalmatlan tárgyak hajítása');
  const alkalmiTárgyNév = alkalmiTárgyFortély ? 'Alkalmi tárgy' : null;
  const alkalmiTárgyDef = def && alkalmiTárgyFortély
    ? { ...def, Osztó: alkalmiTárgyFortély.fok >= 2 ? '2' : '1' }
    : undefined;

  return { nevek, def, alkalmiTárgyNév, alkalmiTárgyDef };
}

// --- Aktív távfegyver definíció ---

export function getAktívTfDef(
  k: Karakter, session: Session, data: GameData, alkalmatlan: AlkalmatlanInfo
): TavfegyverAlap | undefined {
  const idx = session.aktív_távfegyver_index;
  const peldany = k.távfegyverek[idx];
  if (peldany) return data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === peldany.alap.toLowerCase());

  const alkStartIdx = k.távfegyverek.length;
  const alkEndIdx = alkStartIdx + alkalmatlan.nevek.length;
  if (idx >= alkStartIdx && idx < alkEndIdx) return alkalmatlan.def;
  if (idx === alkEndIdx && alkalmatlan.alkalmiTárgyDef) return alkalmatlan.alkalmiTárgyDef;
  return undefined;
}

// --- Mesterfegyver ---

export function getMfFok(k: Karakter, alap: string): number {
  return k.fortélyok.find(f => f.név === 'Mesterfegyver' && f.spec_elem === alap)?.fok ?? 0;
}

export function mfKövetelményHiba(k: Karakter, data: GameData, alap: string): boolean {
  const fok = getMfFok(k, alap);
  if (fok === 0) return false;
  const fokDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver')?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return false;
  const harcmodor = data.tavfegyverek.find(tf => tf.Fegyver.toLowerCase() === alap.toLowerCase())?.Harcmodor;
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const nevek = harcmodor ? [harcmodor] : (Array.isArray(kov.név) ? kov.név : [kov.név]);
      if (!nevek.some(n => (k.képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték)) return true;
    }
  }
  return false;
}

export function mfKövetelményText(k: Karakter, data: GameData, alap: string): string {
  const fok = getMfFok(k, alap);
  if (fok === 0) return '';
  const fokDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver')?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return '';
  const harcmodor = data.tavfegyverek.find(tf => tf.Fegyver.toLowerCase() === alap.toLowerCase())?.Harcmodor;
  const kov = fokDef.követelmények[0];
  if (kov.típus !== 'képzettség') return '';
  const név = harcmodor ?? (Array.isArray(kov.név) ? kov.név.join(' / ') : kov.név);
  return `⚠ ${név} ≥ ${kov.érték}`;
}

// --- CÉ kalkuláció ---

export function getFortélyCÉ(k: Karakter, data: GameData, session: Session): number {
  const aktívFeltételek = buildAktívFeltételek(session, data);
  let total = 0;
  // Helyzet hatások: CÉ flat bónuszok aktív helyzetekből
  for (const hNév of session.aktív_helyzetek) {
    const def = data.harciHelyzetek.find(d => d.név === hNév);
    if (!def?.hatások) continue;
    for (const h of def.hatások) {
      if (h.cél === 'CÉ' && h.operátor === 'flat' && h.érték) total += h.érték;
    }
  }
  // Taktika módosítók: CÉ bónuszok aktív taktikákból
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def?.módosítók?.CÉ) continue;
    total += def.módosítók.CÉ;
  }
  // Fortély módosítók: feltételes CÉ bónuszok
  for (const fDef of data.fortelySummaries) {
    const effFok = Math.max(0, k.fortélyok.find(f => f.név === fDef.név)?.fok ?? 0);
    const módosítók = fDef.fokok.find(f => f.fok === effFok)?.módosítók;
    if (!módosítók) continue;
    for (const mod of módosítók) {
      if (mod.cél === 'CÉ' && mod.feltétel && aktívFeltételek.has(mod.feltétel)) total += mod.érték;
    }
  }
  return total;
}

export function calcCÉ(p: { céAlap: number; önuralom: number; CM: number; harcmodorCÉ: number; fegyverCÉ: number; mfCÉ: number; idea: number; fortélyCÉ: number }): number {
  return p.céAlap + p.önuralom + p.CM + p.harcmodorCÉ + p.fegyverCÉ + p.mfCÉ + p.idea + p.fortélyCÉ;
}

/** Mágikus vs normál CÉ input — kategória alapján adaptálja az értékeket */
export function getCÉInputs(k: Karakter, def: TavfegyverAlap | undefined, idea: number) {
  const isMágikus = def?.Kategória === 'mágikus';
  const mágikusTulajdonságCÉ = k.tsz + (k.tulajdonságok.gyorsaság ?? 0) + (k.tulajdonságok.intelligencia ?? 0);
  return {
    önuralom: isMágikus ? mágikusTulajdonságCÉ : (k.tulajdonságok.önuralom ?? 0),
    CM: isMágikus ? 0 : k.CM,
    idea: isMágikus ? 0 : idea,
    isMágikus,
    mágikusTulajdonságCÉ,
  };
}

/** Teljes CÉ bontás kiszámítása egy adott fegyverhez */
export function calcCÉBontás(k: Karakter, data: GameData, session: Session, def: TavfegyverAlap | undefined, idea: number, fortélyCÉ: number, fegyverAlap?: string): CÉBontás {
  const konstansok = data.konstansok;
  const céAlap = konstansok.harcérték_alap.CÉ;
  const harcmodorNév = def?.Harcmodor ?? 'Hajítás';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const harcmodorCÉ = data.harcmodorBonusz.find(b => b.szint === harcmodorSzint)?.CÉ ?? -9;
  const fegyverCÉ = parseInt(def?.CÉ ?? '0') || 0;
  const mfAlap = fegyverAlap ?? k.távfegyverek[session.aktív_távfegyver_index]?.alap ?? '';
  const mfFok = def ? getMfFok(k, mfAlap) : 0;
  const mfCÉ = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok)?.CÉ ?? 0;
  const inp = getCÉInputs(k, def, idea);
  const osztó = parseInt(def?.Osztó ?? '1') || 1;
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
  return k.fortélyok.find(f => f.név === 'Nyílpuska újratöltés fejlesztése')?.fok ?? 0;
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
