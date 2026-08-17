import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';

interface Props {
  /** Called with the manually chosen value. */
  onSelect: (value: number) => void;
  /** Current Előny/Hátrány level for display (optional). */
  szint?: number;
  /** Base value (e.g. TÉ) shown for reference. */
  alapÉrték?: number;
  /** Label for the base value (e.g. "TÉ"). */
  alapLabel?: string;
  /** Dice sides (default 20). */
  sides?: number;
  /** Minimum value (default 0 for k20, 1 for others). */
  min?: number;
  /** Disabled state (synced with the roll button). */
  disabled?: boolean;
  /** Force the picker open (for multi-step flows). */
  forceOpen?: boolean;
}

/**
 * Manual dice picker: a 🎲 icon button that opens a value grid.
 * For players who prefer physical dice rolling.
 */
export function ManualDicePicker({ onSelect, szint, alapÉrték, alapLabel, sides = 20, min, disabled, forceOpen }: Props) {
  const [open, setOpen] = useState(false);
  const isOpen = open || (forceOpen ?? false);

  const szintLabel = szint != null && szint !== 0
    ? szint > 0 ? `Előny+${szint}` : `Hátrány${szint}`
    : null;

  return (
    <>
      <button className="manual-dice-btn" disabled={disabled} onClick={() => setOpen(true)} title="Kézi dobás">🎲</button>
      {isOpen && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="manual-dice-popup">
            <div className="manual-dice-title">Kézi dobás (k{sides})</div>
            {alapÉrték != null && (
              <div className="manual-dice-alap">
                {alapLabel ?? 'Alap'}: {alapÉrték}
                {szintLabel && <span className={`manual-dice-alap-szint ${szint! > 0 ? 'elony' : 'hatrany'}`}> ({szintLabel})</span>}
              </div>
            )}
            {alapÉrték == null && szintLabel && <div className="manual-dice-szint">{szintLabel}</div>}
            <div className="manual-dice-grid">
              {Array.from({ length: sides - (min ?? (sides === 20 ? 0 : 1)) + 1 }, (_, i) => i + (min ?? (sides === 20 ? 0 : 1))).map(v => (
                <button key={v} className="fort-fok-btn"
                  onClick={() => { setOpen(false); onSelect(v); }}>{v}</button>
              ))}
            </div>
          </div>
        </PopupOverlay>
      )}
    </>
  );
}
