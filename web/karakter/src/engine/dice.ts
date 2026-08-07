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
