import { useState } from 'react';
import { PopupOverlay } from '../PopupOverlay';

interface Props {
  /** Called with the manually chosen value (0-20). */
  onSelect: (value: number) => void;
  /** Current Előny/Hátrány level for display (optional). */
  szint?: number;
}

/**
 * Manual dice picker: a 🎲 icon button that opens a value grid (0-20).
 * For players who prefer physical dice rolling.
 */
export function ManualDicePicker({ onSelect, szint }: Props) {
  const [open, setOpen] = useState(false);

  const szintLabel = szint != null && szint !== 0
    ? szint > 0 ? `Előny+${szint}` : `Hátrány${szint}`
    : null;

  return (
    <>
      <button className="manual-dice-btn" onClick={() => setOpen(true)} title="Kézi dobás">🎲</button>
      {open && (
        <PopupOverlay onClose={() => setOpen(false)}>
          <div className="manual-dice-popup">
            <div className="manual-dice-title">Kézi dobás (k20)</div>
            {szintLabel && <div className="manual-dice-szint">{szintLabel}</div>}
            <div className="manual-dice-grid">
              {Array.from({ length: 21 }, (_, i) => i).map(v => (
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
