import type { Fortely, FortelyDef, Modosito, ModMode } from './types';

export interface ModifierAccumulator {
  [cél: string]: number;
}

/**
 * Összegyűjti a karakter fortélyaiból az aktív (feltétel=="") módosítókat.
 * A szituációs (feltétel!="") módosítókat külön adja vissza.
 */
export function collectModifiers(
  karakterFortelyok: Fortely[],
  fortelyDefs: Map<string, FortelyDef>,
  kepzettsegSzintek: Map<string, number>,
  aktivSzituációk: Set<string>,
): { always: ModifierAccumulator; situational: ModifierAccumulator } {
  const always: ModifierAccumulator = {};
  const situational: ModifierAccumulator = {};

  for (const kf of karakterFortelyok) {
    const def = fortelyDefs.get(kf.név);
    if (!def) continue;

    const fokDef = def.fokok.find(f => f.fok === kf.fok);
    if (!fokDef) continue;

    const mods = fokDef.módosítók;
    if (!mods || typeof mods === 'string') continue;

    for (const mod of mods as Modosito[]) {
      const érték = resolveModValue(mod, kepzettsegSzintek);

      if (mod.feltétel === '') {
        always[mod.cél] = (always[mod.cél] ?? 0) + érték;
      } else if (aktivSzituációk.has(mod.feltétel)) {
        situational[mod.cél] = (situational[mod.cél] ?? 0) + érték;
      }
    }
  }

  return { always, situational };
}

function resolveModValue(mod: Modosito, kepzettsegSzintek: Map<string, number>): number {
  switch (mod.mód as ModMode) {
    case 'flat':
      return mod.érték;
    case 'scaled': {
      const forrásÉrték = kepzettsegSzintek.get(mod.forrás) ?? 0;
      return Math.floor(forrásÉrték * mod.arány);
    }
    case 'override':
      return mod.érték; // override kezelése a hívó oldalon történik
    default:
      return 0;
  }
}
