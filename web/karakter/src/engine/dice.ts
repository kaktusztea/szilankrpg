/** Dice rolling — single source of randomness for combat rolls. */

/** Roll a single die with `sides` faces → integer in [1, sides]. */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** k20 roll (Kezdeményezés, Támadó dobás). */
export function rollK20(): number {
  return rollDie(20);
}

/** k10 roll (Lövéskitérés, próbák). */
export function rollK10(): number {
  return rollDie(10);
}

/**
 * Előny/Hátrány dobás k10-zel (md/030_08_01, §37):
 *  - szint > 0 (Előny+N): (N+1) db k10, a legnagyobb számít
 *  - szint < 0 (Hátrány-N): (|N|+1) db k10, a legkisebb számít
 *  - szint == 0: egyetlen k10 (sima dobás)
 */
export interface ProbaDobás { rolls: number[]; eredmény: number }
export function rollElőnyHátrány(szint: number): ProbaDobás {
  const count = Math.abs(szint) + 1;
  const rolls = Array.from({ length: count }, () => rollK10());
  const eredmény = szint < 0 ? Math.min(...rolls) : Math.max(...rolls);
  return { rolls, eredmény };
}
