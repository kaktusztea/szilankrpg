/** Shared Előny/Hátrány radio chip picker for combat rolls. */

const ELŐNY_OPCIÓK = [
  { label: 'Előny+2', rövid: 'E+2', szint: 2 },
  { label: 'Előny+1', rövid: 'E+1', szint: 1 },
  { label: 'Alap', rövid: 'Alap', szint: 0 },
  { label: 'Hátrány-1', rövid: 'H-1', szint: -1 },
  { label: 'Hátrány-2', rövid: 'H-2', szint: -2 },
] as const;

interface Props {
  szint: number;
  /** If provided and differs from szint, marks the computed chip with a discrete border. */
  eredeti?: number;
  onChange: (szint: number) => void;
  /** Rövid feliratok (E+2 … H-2) keskeny helyre (pl. manőver-popup); a teljes név az aria-label-ben. */
  rövid?: boolean;
}

export function ElonyPicker({ szint, eredeti, onChange, rövid }: Props) {
  return (
    <div className="tamado-elony-list">
      {ELŐNY_OPCIÓK.map(opt => (
        <button
          key={opt.szint}
          className={`tamado-elony-chip${szint === opt.szint ? ' active' : ''}${eredeti !== undefined && eredeti !== szint && opt.szint === eredeti ? ' eredeti' : ''}`}
          onClick={() => onChange(opt.szint)}
          aria-label={opt.label}
          aria-pressed={szint === opt.szint}
        >
          {rövid ? opt.rövid : opt.label}
        </button>
      ))}
    </div>
  );
}
