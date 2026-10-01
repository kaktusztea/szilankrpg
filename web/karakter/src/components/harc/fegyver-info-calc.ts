import type { Karakter, FegyverAlap, FegyverPeldany } from '../../engine/types';
import type { GameData } from '../../engine/data-loader';
import type { FegyverResult, FegyverResultMód } from './types';
import { lookupFegyver, képzettségSzint } from '../../engine/utils';

/** Egy mód (aktor) megjelenítendő fegyver-harcértékei (csak fegyver, taktika/páncél nélkül). */
export interface FegyverInfoMód {
  aktor: string;
  jelleg: string;
  sebzéstípus: 'elsődleges' | 'másodlagos';
  TÉ: number;
  VÉ: number;
  SP: number;
  Átütés: number;
  támadások: number;
}

/** A fegyver infó popup teljes, megjelenítésre kész adata (pure). */
export interface FegyverInfoAdat {
  név: string;
  /** Harcmodor képzettség neve + a karakter szintje benne. */
  harcmodorNév: string;
  harcmodorSzint: number;
  /** Extrák nevei (a fegyver v2 definícióból). */
  extrák: string[];
  /** A felvett példány anyaga (null ha nincs példány - pl. puszta kéz / pajzs). */
  anyag: string | null;
  /** A felvett példány Ideája (null ha nincs példány). */
  idea: number | null;
  /** A fegyver alapértelmezett Ideája (a v2 harcérték ezt már tartalmazza). */
  ideaDefault: number;
  /** Módonkénti fegyver-harcértékek (elsődleges elöl). */
  módok: FegyverInfoMód[];
}

function toInfoMód(m: FegyverResultMód): FegyverInfoMód {
  return {
    aktor: m.aktor, jelleg: m.jelleg, sebzéstípus: m.sebzéstípus,
    TÉ: m.TÉ, VÉ: m.VÉ, SP: m.SP, Átütés: m.Átütés, támadások: m.támadások,
  };
}

/**
 * A fegyver infó popup adatának összeállítása. A harcértékek a MÁR kiszámolt `FegyverResult`-ból
 * jönnek (csak fegyver-harcérték, taktika/páncél/fogás módosító nélkül). A példány-adat (anyag,
 * Idea) a karakter felvett fegyveréből - ha nincs (puszta kéz / pajzs), null.
 */
export function buildFegyverInfó(
  result: FegyverResult, karakter: Karakter, data: GameData,
): FegyverInfoAdat {
  const fDef: FegyverAlap | undefined = lookupFegyver(data.fegyverek, result.fegyver_név);
  const peldány: FegyverPeldany | undefined = karakter.fegyverek.find(
    fp => (lookupFegyver(data.fegyverek, fp.alap)?.név ?? fp.alap) === result.fegyver_név,
  );

  const kategória = fDef?.kategória ?? '';
  const harcmodorNév = data.konstansok.fegyver_kategória_harcmodor[kategória] ?? 'Közelharc';

  // Elsődleges mód elöl, utána a többi (a táblázat is az elsődlegest mutatja fejlécként).
  const módok = [...result.módok].sort((a, b) =>
    (a.sebzéstípus === 'elsődleges' ? 0 : 1) - (b.sebzéstípus === 'elsődleges' ? 0 : 1),
  ).map(toInfoMód);

  return {
    név: result.fegyver_név,
    harcmodorNév,
    harcmodorSzint: képzettségSzint(karakter, harcmodorNév),
    extrák: (fDef?.extrák ?? []).map(e => e.név),
    anyag: peldány?.anyag ?? null,
    idea: peldány?.idea ?? null,
    ideaDefault: fDef?.idea_default ?? 0,
    módok,
  };
}
