import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, TavfegyverAlap } from '../../engine/types';
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
  for (const def of data.fortelySummaries) {
    const effFok = Math.max(0, k.fortélyok.find(f => f.név === def.név)?.fok ?? 0);
    const módosítók = def.fokok.find(f => f.fok === effFok)?.módosítók;
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
export function calcCÉBontás(k: Karakter, data: GameData, session: Session, def: TavfegyverAlap | undefined, idea: number, fortélyCÉ: number): CÉBontás {
  const konstansok = data.konstansok;
  const céAlap = konstansok.harcérték_alap.CÉ;
  const harcmodorNév = def?.Harcmodor ?? 'Hajítás';
  const harcmodorSzint = k.képzettségek.find(kp => kp.név === harcmodorNév)?.szint ?? 0;
  const harcmodorCÉ = data.harcmodorBonusz.find(b => b.szint === harcmodorSzint)?.CÉ ?? -9;
  const fegyverCÉ = parseInt(def?.CÉ ?? '0') || 0;
  const mfFok = def ? getMfFok(k, k.távfegyverek[session.aktív_távfegyver_index]?.alap ?? '') : 0;
  const mfCÉ = konstansok.mesterfegyver_bónuszok.find(b => b.fok === mfFok)?.CÉ ?? 0;
  const inp = getCÉInputs(k, def, idea);
  const osztó = parseInt(def?.Osztó ?? '1') || 1;
  const cé = calcCÉ({ céAlap, önuralom: inp.önuralom, CM: inp.CM, harcmodorCÉ, fegyverCÉ, mfCÉ, idea: inp.idea, fortélyCÉ });

  return { céAlap, önuralom: inp.önuralom, CM: inp.CM, harcmodorCÉ, harcmodorNév, harcmodorSzint, fegyverCÉ, mfCÉ, idea: inp.idea, fortélyCÉ, cé, osztó, isMágikus: inp.isMágikus, mágikusTulajdonságCÉ: inp.mágikusTulajdonságCÉ };
}

// --- Támadás ---

export function calcTámadásLabel(params: {
  harcmodorSzint: number; gyorsaság: number; sebesség: number;
  gyorsÚjratöltésFok: number; konstansok: GameData['konstansok'];
}): string {
  const { harcmodorSzint, gyorsaság, sebesség, gyorsÚjratöltésFok, konstansok } = params;
  if (sebesség <= 0) {
    return gyorsÚjratöltésFok >= konstansok.nyílpuska_gyors_újratöltés_min_fok
      ? '1x' : konstansok.nyílpuska_alap_támadás;
  }
  const harckeret = harcmodorSzint + gyorsaság;
  if (harckeret <= 0) return '1x';
  return `${1 + Math.floor(harckeret / sebesség)}x`;
}

// --- VÉ ---

export function calcVÉ(szorzóÖsszeg: number, cella: number): number {
  return szorzóÖsszeg >= 1 ? szorzóÖsszeg * cella : cella - Math.abs(szorzóÖsszeg);
}
