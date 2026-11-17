import type { Karakter } from '../../engine/types';
import { képzettségSzint } from '../../engine/azonosito';
import type { GameData } from '../../engine/data-loader';
import { gyűjtFortélyEffektek, értékCélra } from '../../engine/effekt';

// Lövéskitérés (védekező Akrobatika próba, md/073 + kategóriák md/078).
// A célszámot a bejövő fegyver kategóriája + a táv-sáv adja (konstansok.lövéskitérés); a UI sávonként választ.

/** A kitérő karakter Akrobatika próba módosítója: Akrobatika szint + Gyorsaság + fortély-bónusz (`lövéskitérés` cél). */
export function calcAkrobatikaÉrték(k: Karakter, data: GameData): number {
  const akrobatika = képzettségSzint(k.képzettségek, 'akrobatika');
  const gyorsaság = k.tulajdonságok.gyorsaság ?? 0;
  const fortély = értékCélra(gyűjtFortélyEffektek(k, k.session, data, new Set(), f => !f), 'lövéskitérés');
  return akrobatika + gyorsaság + fortély;
}

/** Success chance (0..1) of `bázis` + k10 >= `célszám`. */
export function lövéskitérésEsély(bázis: number, célszám: number): number {
  return Math.max(0, Math.min(1, (11 - (célszám - bázis)) / 10));
}
