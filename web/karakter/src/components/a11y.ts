import type { KeyboardEvent } from 'react';

/**
 * Kattintható, de NEM <button> elem (pl. a sorban más gomb / link is van - gomb a gombban érvénytelen HTML)
 * billentyűzettel is elérhetővé tétele: role="button", fókuszálható, Enter / Szóköz = kattintás.
 */
export function kattinthatóProps(onActivate: () => void, disabled = false) {
  return {
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled || undefined,
    onClick: () => { if (!disabled) onActivate(); },
    onKeyDown: (e: KeyboardEvent) => {
      if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      onActivate();
    },
  };
}
