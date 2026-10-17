import type { Kepzettseg } from '../../engine/types';
import type { FortelySummary, FortelyFokSummary, GameData } from '../../engine/data-loader';
import { fortélyNév, képzettségNév, képzettségSzint, isHarcmodorId, bontKépzKulcs, EGYEDI_FORTÉLY_ID, HARCMODOR_ID } from '../../engine/azonosito';

/** Követelmény-alcél feliratok (felszerelés-rész). */
export const FELSZERELÉS_FELIRAT: Record<string, string> = {
  'felszerelés:nagyobb_fegyver': 'nagyobb fegyver',
  'felszerelés:kisebb_fegyver': 'kisebb fegyver',
};
import type { Fortely } from '../../engine/types';

export function displayName(f: Fortely, data: Pick<GameData, 'fortelySummaries'>): string {
  const név = fortélyNév(f, data);
  const base = f.elem && f.id !== EGYEDI_FORTÉLY_ID ? `${név} - ${f.elem}` : név;
  if (f.kiérdemelt) return f.fok > 1 ? `${base} ⭐➕` : `${base} ⭐`;
  return base;
}

export function getFortelyokForCsoport(
  csoport: string,
  fortélyok: Fortely[],
  defsByGroup: Map<string, FortelySummary[]>,
): Fortely[] {
  const csoportDefs = defsByGroup.get(csoport) || [];
  const csoportIdk = new Set(csoportDefs.map(d => d.id));
  const név = (f: Fortely) => f.id === EGYEDI_FORTÉLY_ID ? f.elem : (csoportDefs.find(d => d.id === f.id)?.név ?? f.id);
  const items = fortélyok.filter(f =>
    csoportIdk.has(f.id) || (csoport === 'szabad' && f.id === EGYEDI_FORTÉLY_ID)
  );
  items.sort((a, b) => {
    const nameComp = név(a).localeCompare(név(b));
    if (nameComp !== 0) return nameComp;
    return b.fok - a.fok;
  });
  return items;
}

/** KP cost of the next non-kiérdemelt ("Felvett") szabad fortély: 0 while within the free quota (tsz), else the def's kp_perfok. */
export function calcSzabadFelvettKp(
  id: string,
  fortélyok: Fortely[],
  fortelySummaries: FortelySummary[],
  tsz: number
): number {
  const def = fortelySummaries.find(d => d.id === id);
  const kpPerFok = def?.kp_perfok ?? 6;
  const szabadIdk = new Set(fortelySummaries.filter(d => d.csoport === 'szabad').map(d => d.id));
  const nonKierdemelt = fortélyok.filter(f => (szabadIdk.has(f.id) || f.id === EGYEDI_FORTÉLY_ID) && !f.kiérdemelt).length;
  return nonKierdemelt < tsz ? 0 : kpPerFok;
}

export function calcNyelvPontKeret(nyelvtanulásSzint: number): number {
  return Math.max(0, (nyelvtanulásSzint - 3) * 3);
}

export function calcNyelvTúllépés(slotok: Fortely[], nyelvPontKeret: number): { túllépés: number; overSet: Set<Fortely> } {
  const nyelvismeretSlotok = slotok.filter(s => s.id === 'nyelvismeret');
  const összFok = nyelvismeretSlotok.filter(s => !s.kiérdemelt).reduce((s, f) => s + f.fok, 0)
    + nyelvismeretSlotok.filter(s => !!s.kiérdemelt).reduce((s, f) => s + Math.max(0, f.fok - 1), 0);
  const túllépés = Math.max(0, összFok - nyelvPontKeret);

  let maradékTúl = túllépés;
  const overSet = new Set<Fortely>();
  const fizetősNyelvek = nyelvismeretSlotok.filter(s => !s.kiérdemelt || s.fok > 1);
  for (let j = fizetősNyelvek.length - 1; j >= 0 && maradékTúl > 0; j--) {
    overSet.add(fizetősNyelvek[j]);
    maradékTúl -= fizetősNyelvek[j].kiérdemelt ? fizetősNyelvek[j].fok - 1 : fizetősNyelvek[j].fok;
  }
  return { túllépés, overSet };
}

export function isSlotIngyenes(
  slot: Fortely,
  csoport: string,
  slotok: Fortely[],
  tsz: number,
  def?: FortelySummary
): boolean {
  if (csoport === 'szabad') {
    if (slot.kiérdemelt) return true;
    const nonKierdemeltIdx = slotok.filter(s => !s.kiérdemelt).indexOf(slot);
    return nonKierdemeltIdx < tsz;
  }
  if (def && def.ingyenes_perszint > 0) {
    const ingyenesDb = Math.floor((tsz + 1) / def.ingyenes_perszint);
    const sameTypeSlots = slotok.filter(s => s.id === def.id);
    const posInType = sameTypeSlots.indexOf(slot);
    return posInType < ingyenesDb;
  }
  return false;
}

export function buildDefsByGroup(fortelySummaries: FortelySummary[]): Map<string, FortelySummary[]> {
  const map = new Map<string, FortelySummary[]>();
  for (const d of fortelySummaries) {
    const vizCsoport = d.alcsoport === 'tavharc' ? 'távharc' : d.csoport;
    const arr = map.get(vizCsoport) || [];
    arr.push(d);
    map.set(vizCsoport, arr);
  }
  return map;
}

export function checkKövetelmények(
  fokDef: FortelyFokSummary | undefined,
  képzettségek: Kepzettseg[],
  fortélyok: { id: string; fok: number }[],
  /** A hiány-feliratok fortély-/képzettség-neveihez (a követelmények id-vel hivatkoznak). */
  data: Pick<GameData, 'kepzettsegDefs' | 'fortelySummaries'>,
  fegyverHarcmodorNév?: string,
  /** A karakter fajának ajánlott fortélyai max fokkal (data.fajFortélyok[faj], fortély-id kulcs) - a `faj` típushoz. */
  fajFortélyok: Record<string, number> = {},
  fortélyId = '',
): string[] {
  if (!fokDef?.követelmények?.length) return [];
  const hiányzó: string[] = [];
  const fortélyFok = (id: string) => fortélyok.reduce((m, f) => (f.id === id && f.fok > m ? f.fok : m), 0);
  for (const kov of fokDef.követelmények) {
    const refek = Array.isArray(kov.név) ? kov.név : [kov.név];
    if (kov.típus === 'képzettség') {
      // "harcmodor" elem nélkül (pl. Kétkezes harc: a nagyobb / kisebb fegyver harcmodora): felvételkor a fegyver
      // még nem ismert → bármely közelharci harcmodor legmagasabb szintje (a pontos ellenőrzés a Harc fülön).
      const szint = (r: string) => r === HARCMODOR_ID
        ? Math.max(0, ...képzettségek.filter(kp => kp.id === HARCMODOR_ID).map(kp => kp.szint))
        : képzettségSzint(képzettségek, r);
      const teljesül = refek.some(r => szint(r) >= kov.érték);
      if (!teljesül) {
        // Csupa harcmodor-elem (VAGY-lista) → „Harcmodor"; egyébként a nevek „/"-lel.
        const isHarcmodor = Array.isArray(kov.név) && refek.every(r => { const b = bontKépzKulcs(r); return isHarcmodorId(b.id) && !!b.elem; });
        const fegyverRész = kov.alcél ? ` (${FELSZERELÉS_FELIRAT[kov.alcél] ?? kov.alcél})` : '';
        const név = isHarcmodor || refek[0] === HARCMODOR_ID
          ? (fegyverHarcmodorNév ? `Harcmodor - ${fegyverHarcmodorNév}` : 'Harcmodor') + fegyverRész
          : refek.map(r => képzettségNév(r, data)).join('/');
        hiányzó.push(`${név} ≥ ${kov.érték}`);
      }
    } else if (kov.típus === 'fortély') {
      if (fortélyFok(refek[0]) < kov.érték) hiányzó.push(`${fortélyNév(refek[0], data)} fortély ≥ ${kov.érték}. fok`);
    } else if (kov.típus === 'tiltó_fortély') {
      // Tiltó követelmény: a megnevezett fortély megléte (fok >= érték) KIZÁRÓ ok.
      if (fortélyFok(refek[0]) >= kov.érték) hiányzó.push(`Nem lehet: ${fortélyNév(refek[0], data)} fortély`);
    } else if (kov.típus === 'faj') {
      // A faj ajánlja-e ezt a fortélyt legalább `érték` fokig (érzék / ajánlott fortélyok, md: hatterek.faji).
      if ((fajFortélyok[fortélyId] ?? 0) < kov.érték) hiányzó.push(`Faj Háttér (${fortélyNév(fortélyId, data)} ≥ ${kov.érték}. fok)`);
    }
    // típus 'min_fegyverméret': NEM felvételi feltétel - harci-helyzet-kötött, fegyverfüggő
    // WARNING (l. getMinFegyverhosszWarning). Itt tudatosan kihagyjuk, nem blokkolja a felvételt.
  }
  return hiányzó;
}
