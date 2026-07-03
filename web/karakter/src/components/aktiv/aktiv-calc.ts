import type { GameData } from '../../engine/data-loader';
import type { Karakter, Session } from '../../engine/types';
import type { AktívAlapeset } from '../../engine/alapeset';
import { evaluateAlapesetek } from '../../engine/alapeset';
import { buildAktívFeltételek } from '../../engine/feltetelek';

// --- Types ---

export interface HatásEntry { cél: string; operátor: string; érték?: number; megjegyzés?: string }
export interface StátuszPerElem { név: string; alcím?: string; hatások: HatásEntry[] }
export interface TaktikaHatásPerElem { név: string; hatások: HatásEntry[] }
export interface FortélyEmlékeztető { név: string; fok: number; hatás: string }
export interface HelyzetFortélyEntry { név: string; fok: number; hatás: string; aktív: boolean }
export interface ManőverBónusz { név: string; manőver: string; érték: number }
export interface AktivCalcData {
  státuszPerElem: StátuszPerElem[];
  taktikaHatásPerElem: TaktikaHatásPerElem[];
  fortélyEmlékeztetők: FortélyEmlékeztető[];
  helyzetFortélyok: Map<string, HelyzetFortélyEntry[]>;
  manőverBónuszok: ManőverBónusz[];
  alapesetekFiltered: AktívAlapeset[];
  eseményNév: (id: string) => string;
}

// --- Sub-calculators ---

export function calcStátuszHatások(session: Session, data: GameData): StátuszPerElem[] {
  const result: StátuszPerElem[] = [];
  for (const st of session.aktív_státuszok) {
    const match = st.match(/^(.+) \((\d+)\)$/);
    if (!match) continue;
    const stNév = match[1];
    const baseName = stNév.includes(': ') ? stNév.split(': ')[0] : stNév;
    const subName = stNév.includes(': ') ? stNév.split(': ')[1] : '';
    const def = data.statuszok.find(s => s.név === baseName);
    const fokDef = def?.fokok.find(f => f.fok === parseInt(match[2]));
    if (fokDef) {
      const hatások = fokDef.hatások.map(h => subName ? { ...h, cél: `${h.cél} (${subName.toLowerCase()})` } : h);
      result.push({ név: st, alcím: (fokDef as any).alcím, hatások });
    }
  }
  return result;
}

export function calcTaktikaHatások(session: Session, data: GameData): TaktikaHatásPerElem[] {
  const result: TaktikaHatásPerElem[] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef?.hatások?.length) result.push({ név: `${def.név} (${at.fok})`, hatások: fokDef.hatások });
    }
  }
  return result;
}

/** Check if a modifier's feltétel is satisfied by the active conditions. */
function isFeltételAktív(feltétel: unknown, aktívFeltételek: Set<string>): boolean {
  if (!feltétel || feltétel === '') return true;
  if (typeof feltétel === 'string') return aktívFeltételek.has(feltétel);
  if (Array.isArray(feltétel)) {
    const hFelt = (feltétel as { forrás: string }[]).find(p => p.forrás?.startsWith('harci_helyzet:'));
    return !hFelt || aktívFeltételek.has(hFelt.forrás);
  }
  return true;
}

/** Extract helyzet binding key from a modifier's feltétel (if any). */
function extractHelyzetKötés(feltétel: unknown): string {
  if (typeof feltétel === 'string' && feltétel.startsWith('harci_helyzet:')) return feltétel.slice(14);
  if (Array.isArray(feltétel)) {
    const hFelt = (feltétel as { forrás: string }[]).find(p => p.forrás?.startsWith('harci_helyzet:'));
    if (hFelt) return hFelt.forrás.slice(14);
  }
  return '';
}

export function calcFortélyPool(
  karakter: Karakter, data: GameData, aktívFeltételek: Set<string>,
): { fortélyEmlékeztetők: FortélyEmlékeztető[]; helyzetFortélyok: Map<string, HelyzetFortélyEntry[]>; manőverBónuszok: ManőverBónusz[] } {
  const fortélyEmlékeztetők: FortélyEmlékeztető[] = [];
  const helyzetFortélyok = new Map<string, HelyzetFortélyEntry[]>();
  const manőverBónuszok: ManőverBónusz[] = [];

  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def || def.csoport !== 'harci') continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef) continue;

    let helyzetKötés = '';

    // Process modifiers: collect manőver bónusz, előny/hátrány, helyzet kötés
    if (fokDef.módosítók && Array.isArray(fokDef.módosítók) && fokDef.módosítók.length > 0) {
      for (const mod of fokDef.módosítók) {
        if (!isFeltételAktív(mod.feltétel, aktívFeltételek)) continue;

        if (typeof mod.cél === 'string' && mod.cél.startsWith('manőver:')) {
          manőverBónuszok.push({ név: kf.név, manőver: mod.cél.slice(8), érték: mod.érték });
        }

        const kötés = extractHelyzetKötés(mod.feltétel);
        if (kötés) helyzetKötés = kötés;
      }
    }

    // Categorize: helyzet-bound vs emlékeztető
    if (helyzetKötés) {
      const hNév = data.harciHelyzetek.find(d => d.feltétel_kulcs === `harci_helyzet:${helyzetKötés}`)?.név || helyzetKötés;
      const arr = helyzetFortélyok.get(hNév) || [];
      arr.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás?.join(' ') ?? '', aktív: aktívFeltételek.has(`harci_helyzet:${helyzetKötés}`) });
      helyzetFortélyok.set(hNév, arr);
    } else if (def.emlékeztető && fokDef.hatás && fokDef.hatás.length > 0) {
      fortélyEmlékeztetők.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' ') });
    }
  }
  return { fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok };
}

export function calcAlapesetPool(
  data: GameData, karakter: Karakter, session: Session,
  aktívFeltételek: Set<string>,
  helyzetFortélyok: Map<string, HelyzetFortélyEntry[]>,
): AktívAlapeset[] {
  const alapesetek = evaluateAlapesetek(data.fortelySummaries as any, karakter, session, aktívFeltételek);
  return alapesetek.filter(ae => {
    const hFelt = ae.módosítók.find(m => m.feltétel?.startsWith('harci_helyzet:'));
    if (hFelt) {
      const hId = hFelt.feltétel.slice(14);
      const hNév = data.harciHelyzetek.find(d => d.feltétel_kulcs === `harci_helyzet:${hId}`)?.név || hId;
      const arr = helyzetFortélyok.get(hNév) || [];
      arr.push({ név: `⚠ ${ae.fortély_név}`, fok: 0, hatás: ae.hatástext.join(' '), aktív: session.aktív_helyzetek.includes(hNév) });
      helyzetFortélyok.set(hNév, arr);
      return false;
    }
    return true;
  });
}

// --- Orchestrator ---

export function calcAktivData(data: GameData, karakter: Karakter, session: Session): AktivCalcData {
  const aktívFeltételek = buildAktívFeltételek(session, data);

  const státuszPerElem = calcStátuszHatások(session, data);
  const taktikaHatásPerElem = calcTaktikaHatások(session, data);

  const eseményNév = (id: string) => {
    const m = id.match(/^(.+?)( \(.+\))$/);
    if (m) { const base = data.esemenyek.find(e => e.id === m[1])?.név ?? m[1]; return base + m[2]; }
    return data.esemenyek.find(e => e.id === id)?.név ?? id;
  };

  const { fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok } = calcFortélyPool(karakter, data, aktívFeltételek);
  const alapesetekFiltered = calcAlapesetPool(data, karakter, session, aktívFeltételek, helyzetFortélyok);

  return { státuszPerElem, taktikaHatásPerElem, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, alapesetekFiltered, eseményNév };
}
