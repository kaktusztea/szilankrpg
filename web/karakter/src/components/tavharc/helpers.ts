import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session, TavfegyverAlap } from '../../engine/types';
import type { AlkalmatlanInfo } from './types';
import { buildAktívFeltételek } from '../../engine/feltetelek';

/** Alkalmatlan fegyver hajítás + Alkalmi tárgy fortélyokból származó virtuális fegyverek */
export function getAlkalmatlanInfo(k: Karakter, data: GameData): AlkalmatlanInfo {
  const alkalmatlanFortélyok = k.fortélyok.filter(f => f.név === 'Alkalmatlan fegyver hajítása' && f.spec_elem);
  const nevek = alkalmatlanFortélyok.map(f => f.spec_elem);
  const def = data.tavfegyverek.find(d => d.Fegyver.startsWith('🔆'));

  const alkalmiTárgyFortély = k.fortélyok.find(f => f.név === 'Alkalmatlan tárgyak hajítása');
  const alkalmiTárgyNév = alkalmiTárgyFortély ? 'Alkalmi tárgy' : null;
  const alkalmiTárgyDef = def && alkalmiTárgyFortély
    ? { ...def, Osztó: alkalmiTárgyFortély.fok >= 2 ? '2' : '1' }
    : undefined;

  return { nevek, def, alkalmiTárgyNév, alkalmiTárgyDef };
}

/** Aktív távfegyver definíciójának meghatározása */
export function getAktívTfDef(
  k: Karakter, session: Session, data: GameData, alkalmatlan: AlkalmatlanInfo
): TavfegyverAlap | undefined {
  const tfIdx = session.aktív_távfegyver_index;
  const tfPeldany = k.távfegyverek[tfIdx];
  const alkalmatlanStartIdx = k.távfegyverek.length;
  const alkalmiTárgyIdx = alkalmatlanStartIdx + alkalmatlan.nevek.length;

  if (tfPeldany) {
    return data.tavfegyverek.find(d => d.Fegyver.toLowerCase() === tfPeldany.alap.toLowerCase());
  }
  if (tfIdx >= alkalmatlanStartIdx && tfIdx < alkalmiTárgyIdx) {
    return alkalmatlan.def;
  }
  if (tfIdx === alkalmiTárgyIdx && alkalmatlan.alkalmiTárgyDef) {
    return alkalmatlan.alkalmiTárgyDef;
  }
  return undefined;
}

/** MF fok lekérdezése adott fegyverhez */
export function getMfFok(k: Karakter, alap: string): number {
  return k.fortélyok.find(f => f.név === 'Mesterfegyver' && f.spec_elem === alap)?.fok ?? 0;
}

/** MF követelmény hiba vizsgálat */
export function mfKövetelményHiba(k: Karakter, data: GameData, alap: string): boolean {
  const fok = getMfFok(k, alap);
  if (fok === 0) return false;
  const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return false;
  const tfDef = data.tavfegyverek.find(tf => tf.Fegyver.toLowerCase() === alap.toLowerCase());
  const fegyverHarcmodor = tfDef?.Harcmodor;
  for (const kov of fokDef.követelmények) {
    if (kov.típus === 'képzettség') {
      const szűrtNevek = fegyverHarcmodor ? [fegyverHarcmodor] : (Array.isArray(kov.név) ? kov.név : [kov.név]);
      if (!szűrtNevek.some(n => (k.képzettségek.find(kp => kp.név.toLowerCase() === n.toLowerCase())?.szint ?? 0) >= kov.érték)) return true;
    }
  }
  return false;
}

/** MF követelmény szöveg */
export function mfKövetelményText(k: Karakter, data: GameData, alap: string): string {
  const fok = getMfFok(k, alap);
  if (fok === 0) return '';
  const mfDef = data.fortelySummaries.find(d => d.név === 'Mesterfegyver');
  const fokDef = mfDef?.fokok.find(f => f.fok === fok);
  if (!fokDef?.követelmények?.length) return '';
  const tfDef = data.tavfegyverek.find(tf => tf.Fegyver.toLowerCase() === alap.toLowerCase());
  const fegyverHarcmodor = tfDef?.Harcmodor;
  const kov = fokDef.követelmények[0];
  if (kov.típus === 'képzettség') {
    const név = fegyverHarcmodor ?? (Array.isArray(kov.név) ? kov.név.join(' / ') : kov.név);
    return `⚠ ${név} ≥ ${kov.érték}`;
  }
  return '';
}

/** Fortélyokból származó CÉ bónusz (feltételes, pl. Célzás) */
export function getFortélyCÉ(k: Karakter, data: GameData, session: Session): number {
  const aktívFeltételek = buildAktívFeltételek(session, data);
  let fortélyCÉ = 0;
  for (const def of data.fortelySummaries) {
    const karakterFok = k.fortélyok.find(f => f.név === def.név)?.fok ?? 0;
    const effFok = Math.max(0, karakterFok);
    const fokDef = def.fokok.find(f => f.fok === effFok);
    if (!fokDef?.módosítók) continue;
    for (const mod of fokDef.módosítók) {
      if (mod.cél === 'CÉ' && mod.feltétel && aktívFeltételek.has(mod.feltétel)) {
        fortélyCÉ += mod.érték;
      }
    }
  }
  return fortélyCÉ;
}

/** CÉ összesítése */
export function calcCÉ(params: {
  céAlap: number; önuralom: number; CM: number; harcmodorCÉ: number;
  fegyverCÉ: number; mfCÉ: number; idea: number; fortélyCÉ: number;
}): number {
  return params.céAlap + params.önuralom + params.CM + params.harcmodorCÉ
    + params.fegyverCÉ + params.mfCÉ + params.idea + params.fortélyCÉ;
}

/** Mágikus vs normál CÉ input adaptáció (Kategória alapján) */
export function getCÉInputs(k: Karakter, def: TavfegyverAlap | undefined, idea: number): { önuralom: number; CM: number; idea: number; isMágikus: boolean; mágikusProp: number } {
  const isMágikus = def?.Kategória === 'mágikus';
  const mágikusProp = k.tsz + (k.tulajdonságok.gyorsaság ?? 0) + (k.tulajdonságok.intelligencia ?? 0);
  return {
    önuralom: isMágikus ? mágikusProp : (k.tulajdonságok.önuralom ?? 0),
    CM: isMágikus ? 0 : k.CM,
    idea: isMágikus ? 0 : idea,
    isMágikus,
    mágikusProp,
  };
}

/** Támadás label (harckeret alapú) */
export function calcTámadásLabel(params: {
  harcmodorSzint: number; gyorsaság: number; sebesség: number;
  gyorsÚjratöltésFok: number; konstansok: GameData['konstansok'];
}): string {
  const { harcmodorSzint, gyorsaság, sebesség, gyorsÚjratöltésFok, konstansok } = params;
  const harckeret = harcmodorSzint + gyorsaság;
  if (sebesség <= 0) {
    return gyorsÚjratöltésFok >= konstansok.nyílpuska_gyors_újratöltés_min_fok
      ? '1x' : konstansok.nyílpuska_alap_támadás;
  }
  if (harckeret <= 0) return '1x';
  return `${1 + Math.floor(harckeret / sebesség)}x`;
}

/** VÉ számítás: szorzó × cella (vagy cella - |szorzó| ha szorzó < 1) */
export function calcVÉ(szorzóÖsszeg: number, cella: number): number {
  return szorzóÖsszeg >= 1 ? szorzóÖsszeg * cella : cella - Math.abs(szorzóÖsszeg);
}
