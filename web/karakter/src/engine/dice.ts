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
 * Előny/Hátrány dobás (md/030_08_01, §37):
 *  - szint > 0 (Előny+N): (N+1) db kocka, a LEGNAGYOBB számít
 *  - szint < 0 (Hátrány-N): (|N|+1) db kocka, a LEGKISEBB számít
 *  - szint == 0: egyetlen kocka (sima dobás)
 */
export interface ProbaDobás { rolls: number[]; eredmény: number }

/**
 * Előny/Hátrány szint → megjelenítendő címke: `Előny+2`, `Hátrány-1`, `''` (sima dobás).
 * Egyetlen hely, ahol ez a formázás el van döntve.
 */
export function előnyHátrányLabel(szint: number): string {
  if (szint > 0) return `Előny+${szint}`;
  if (szint < 0) return `Hátrány${szint}`;
  return '';
}

export function rollElőnyHátrányDie(szint: number, sides: number): ProbaDobás {
  const count = Math.abs(szint) + 1;
  const rolls = Array.from({ length: count }, () => rollDie(sides));
  const eredmény = szint < 0 ? Math.min(...rolls) : Math.max(...rolls);
  return { rolls, eredmény };
}

/** Előny/Hátrány k10-zel (Képzettségpróba). */
export function rollElőnyHátrány(szint: number): ProbaDobás {
  return rollElőnyHátrányDie(szint, 10);
}

/** Előny/Hátrány k6-tal (Tulajdonságpróba, md/010_05_04). */
export function rollElőnyHátrányK6(szint: number): ProbaDobás {
  return rollElőnyHátrányDie(szint, 6);
}

/** Előny/Hátrány k20-szal (Támadó dobás, Sebzésdobás). */
export function rollElőnyHátrányK20(szint: number): ProbaDobás {
  return rollElőnyHátrányDie(szint, 20);
}
