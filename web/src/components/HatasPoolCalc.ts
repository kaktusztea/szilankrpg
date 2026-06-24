import type { GameData } from '../engine/data-loader';
import type { Karakter, Session } from '../engine/types';
import { evaluateAlapesetek, AktívAlapeset } from '../engine/alapeset';
import { buildAktívFeltételek } from '../engine/feltetelek';

export interface HatásPoolData {
  taktikaMods: Record<string, number>;
  státuszPerElem: { név: string; alcím?: string; hatások: { cél: string; operátor: string; érték?: number; megjegyzés?: string }[] }[];
  taktikaHatásPerElem: { név: string; hatások: { cél: string; operátor: string; érték?: number; megjegyzés?: string }[] }[];
  hasHatásPool: boolean;
  fortélyEmlékeztetők: { név: string; fok: number; hatás: string }[];
  helyzetFortélyok: Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>;
  manőverBónuszok: { név: string; manőver: string; érték: number }[];
  előnyHátrányMods: { név: string; cél: string; mód: string; érték: number }[];
  alapesetekFiltered: AktívAlapeset[];
  eseményNév: (id: string) => string;
}

export function calcHatásPool(data: GameData, karakter: Karakter, session: Session): HatásPoolData {
  const aktívFeltételek = buildAktívFeltételek(session, data);

  // 1. Taktika harcérték módosítók
  const taktikaMods: Record<string, number> = {};
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef) { for (const [k, v] of Object.entries(fokDef)) { if (k !== 'fok' && typeof v === 'number') taktikaMods[k] = (taktikaMods[k] ?? 0) + v; } }
    } else if (def.módosítók) {
      for (const [k, v] of Object.entries(def.módosítók)) { if (typeof v === 'number') taktikaMods[k] = (taktikaMods[k] ?? 0) + v; }
    }
  }

  // 2. Státusz + Taktika hatások
  const státuszPerElem: HatásPoolData['státuszPerElem'] = [];
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
      státuszPerElem.push({ név: st, alcím: (fokDef as any).alcím, hatások });
    }
  }

  const taktikaHatásPerElem: HatásPoolData['taktikaHatásPerElem'] = [];
  for (const at of session.aktív_taktikák) {
    const def = data.taktikak.find(t => t.név === at.név);
    if (!def) continue;
    if (def.fokozatos && def.fokok && at.fok != null) {
      const fokDef = def.fokok.find(f => f.fok === at.fok);
      if (fokDef?.hatások?.length) taktikaHatásPerElem.push({ név: `${def.név} (${at.fok})`, hatások: fokDef.hatások });
    }
  }
  const hasHatásPool = státuszPerElem.length > 0 || taktikaHatásPerElem.length > 0;

  const eseményNév = (id: string) => {
    const m = id.match(/^(.+?)( \(.+\))$/);
    if (m) { const base = data.esemenyek.find(e => e.id === m[1])?.név ?? m[1]; return base + m[2]; }
    return data.esemenyek.find(e => e.id === id)?.név ?? id;
  };

  // 3. Fortély emlékeztetők + helyzet-kötött fortélyok
  const fortélyEmlékeztetők: HatásPoolData['fortélyEmlékeztetők'] = [];
  const helyzetFortélyok = new Map<string, { név: string; fok: number; hatás: string; aktív: boolean }[]>();
  const manőverBónuszok: HatásPoolData['manőverBónuszok'] = [];
  const előnyHátrányMods: HatásPoolData['előnyHátrányMods'] = [];

  for (const kf of karakter.fortélyok) {
    const def = data.fortelySummaries.find(d => d.név === kf.név);
    if (!def || def.csoport !== 'harci') continue;
    const fokDef = def.fokok.find(fd => fd.fok === kf.fok);
    if (!fokDef) continue;
    const hasMods = fokDef.módosítók && Array.isArray(fokDef.módosítók) && fokDef.módosítók.length > 0;
    let helyzetKötés = '';
    if (hasMods) {
      for (const mod of fokDef.módosítók) {
        if (mod.feltétel && mod.feltétel !== '' && !aktívFeltételek.has(mod.feltétel)) continue;
        if (typeof mod.cél === 'string' && mod.cél.startsWith('manőver:')) {
          manőverBónuszok.push({ név: kf.név, manőver: mod.cél.slice(8), érték: mod.érték });
        }
        if (mod.mód === 'előny' || mod.mód === 'hátrány') {
          előnyHátrányMods.push({ név: kf.név, cél: mod.cél, mód: mod.mód, érték: mod.érték });
        }
        if (mod.feltétel && mod.feltétel.startsWith('harci_helyzet:')) {
          helyzetKötés = mod.feltétel.slice(14);
        }
      }
    }
    if (helyzetKötés && def.emlékeztető && fokDef.hatás?.length) {
      const hNév = data.harciHelyzetek.find(d => d.feltétel_kulcs === `harci_helyzet:${helyzetKötés}`)?.név || helyzetKötés;
      const arr = helyzetFortélyok.get(hNév) || [];
      arr.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' '), aktív: aktívFeltételek.has(`harci_helyzet:${helyzetKötés}`) });
      helyzetFortélyok.set(hNév, arr);
    } else if (def.emlékeztető && fokDef.hatás && fokDef.hatás.length > 0) {
      fortélyEmlékeztetők.push({ név: kf.név, fok: kf.fok, hatás: fokDef.hatás.join(' ') });
    }
  }

  // 4. Alapesetek
  const alapesetek = evaluateAlapesetek(data.fortelySummaries as any, karakter, session);
  const alapesetekFiltered = alapesetek.filter(ae => {
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

  return { taktikaMods, státuszPerElem, taktikaHatásPerElem, hasHatásPool, fortélyEmlékeztetők, helyzetFortélyok, manőverBónuszok, előnyHátrányMods, alapesetekFiltered, eseményNév };
}
