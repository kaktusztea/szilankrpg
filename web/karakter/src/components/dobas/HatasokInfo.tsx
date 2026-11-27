import type { DobásHatás } from '../../engine/harc/combat-roll-info';
import './dobas.css';

/** Dobás-hatás badge felirata (Előny/Hátrány/Enyhít, különben a megjegyzés). */
export function hatásBadgeLabel(h: DobásHatás): string {
  if (h.operátor === 'előny') return `Előny+${Math.abs(h.érték)}`;
  if (h.operátor === 'hátrány') return `Hátrány-${Math.abs(h.érték)}`;
  if (h.operátor === 'enyhít') return `Enyhít+${Math.abs(h.érték)}`;
  return h.megjegyzés ?? '-';
}
