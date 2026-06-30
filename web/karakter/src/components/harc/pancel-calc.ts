import type { Karakter, Session } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import { lookupFegyver } from '../../engine/utils';

/** Páncél lookup táblák építése */
export function buildPancelLookups(konstansok: any): Map<string, Record<string, number | string>[]> {
  const lookupArrays = new Map<string, Record<string, number | string>[]>();
  const csatoltMgt = konstansok.páncél_csatolt_tag_mgt;
  lookupArrays.set('csatolt_mgt_merev', Object.entries(csatoltMgt.merevvért_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('csatolt_mgt_fém', Object.entries(csatoltMgt.hajlékonyvért_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('csatolt_mgt_nemfém', Object.entries(csatoltMgt.hajlékonyvért_nem_fém).map(([n, v]) => ({ név: n, érték: v as number })));
  lookupArrays.set('struktúrák', konstansok.páncél_struktúrák.map((s: any) => ({
    név: s.struktúra, mgt: s.mgt, sfé_fizikai: s.sfé_fizikai,
    sfé_energia: s.sfé_energia, merev: s.merev ? 1 : 0, fém: s.fém ? 1 : 0
  })));
  lookupArrays.set('fémalapanyagok', konstansok.páncél_fémalapanyagok.map((a: any) => ({ anyag: a.anyag, mgt: a.mgt, sfé_bónusz: a.sfé_bónusz })));
  lookupArrays.set('méret_tábla', (konstansok.páncél_méret_illeszkedés as { fokozat: string; mgt: number }[]).map(m => ({ név: m.fokozat, érték: m.mgt })));
  lookupArrays.set('merevvért_tábla', konstansok.merevvértviselet_bónuszok.map((b: any) => ({ fok: b.fok, csökkentés: b.TÉ_büntetés_csökkentés })));
  return lookupArrays;
}

/** Pajzs és Hárítófegyver VÉ + Fogás összesítő */
export function calcFogas(k: Karakter, session: Session, data: GameData, _fortelyMods: Record<string, number>): {
  pajzsVÉ: number;
  fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null;
} {
  const { konstansok } = data;

  // Pajzs VÉ és TÉ büntetés: egyetlen lookup a pajzs_hatások táblából (méret × Pajzshasználat fok)
  const pajzsFok = k.fortélyok.find(f => f.név === 'Pajzshasználat')?.fok ?? 0;
  const hasPajzs = (session.aktív_pajzs || session.fegyverfogás === 'fegyver_pajzs') && k.pajzs.méret;
  let pajzsVÉ = 0;
  let pajzsTÉBüntetés = 0;
  if (hasPajzs) {
    const hatások = (konstansok.pajzs_hatások as Record<string, { fok: number; VÉ: number; TÉ: number }[]>)?.[k.pajzs.méret];
    const entry = hatások?.find(h => h.fok === pajzsFok) ?? hatások?.[0];
    if (entry) {
      pajzsVÉ = entry.VÉ;
      pajzsTÉBüntetés = Math.min(0, entry.TÉ);
    }
  }

  let hárítóVÉ = 0;
  let hárítóNév = '';
  const hasHárítóFortély = k.fortélyok.some(f => f.név === 'Hárítófegyver használat');
  if (session.fegyverfogás === 'fegyver_hárító' && session.aktív_fegyver_bal_index >= 0 && hasHárítóFortély) {
    const hFp = k.fegyverek[session.aktív_fegyver_bal_index];
    if (hFp) {
      const hDef = lookupFegyver(data.fegyverek, hFp.alap);
      if (hDef?.Hárító === '1') {
        hárítóVÉ = parseInt(hDef.VÉ) || 0;
        hárítóNév = hFp.alap;
        const hDisplayName = hDef.Alapnév || hDef.Fegyver;
        const hMfEntry = k.fortélyok.find(f => f.név === 'Mesterfegyver' && (f.spec_elem === hDisplayName || f.spec_elem === hFp.alap));
        if (hMfEntry) {
          const hMf = konstansok.mesterfegyver_bónuszok.find((b: any) => b.fok === hMfEntry.fok);
          if (hMf) hárítóVÉ += hMf.VÉ;
        }
      }
    }
  }

  let fogásResult: { név: string; VÉ_bónusz: number; TÉ_büntetés: number } | null = null;
  if (session.fegyverfogás === 'fegyver_pajzs' && pajzsVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + Pajzs', VÉ_bónusz: pajzsVÉ, TÉ_büntetés: pajzsTÉBüntetés };
  } else if (session.fegyverfogás === 'fegyver_hárító' && hárítóVÉ > 0) {
    const jobbFp = k.fegyverek[session.aktív_fegyver_index];
    fogásResult = { név: (jobbFp?.alap ?? 'Fegyver') + ' + ' + hárítóNév, VÉ_bónusz: hárítóVÉ, TÉ_büntetés: 0 };
  }

  return { pajzsVÉ, fogásResult };
}

/** Fájdalomtűrés enyhítés lookup */
export function calcFtEnyhites(képzettségek: { név: string; szint: number }[], ftTable: { szint: number; enyhítés: number }[]): number {
  const ftSzint = képzettségek.find(kp => kp.név === 'Fájdalomtűrés')?.szint ?? 0;
  let enyhítés = 0;
  for (const row of ftTable) {
    if (ftSzint >= row.szint) enyhítés = row.enyhítés;
  }
  return enyhítés;
}
