/** Shared Előny/Hátrány radio chip picker for combat rolls. */

const ELŐNY_OPCIÓK = [
  { label: 'Előny+2', szint: 2 },
  { label: 'Előny+1', szint: 1 },
  { label: 'Alap', szint: 0 },
  { label: 'Hátrány-1', szint: -1 },
  { label: 'Hátrány-2', szint: -2 },
] as const;

interface Props {
  szint: number;
  /** If provided and differs from szint, marks the computed chip with a discrete border. */
  eredeti?: number;
  onChange: (szint: number) => void;
}

export function ElonyPicker({ szint, eredeti, onChange }: Props) {
  return (
    <div className="tamado-elony-list">
      {ELŐNY_OPCIÓK.map(opt => (
        <button
          key={opt.szint}
          className={`tamado-elony-chip${szint === opt.szint ? ' active' : ''}${eredeti !== undefined && eredeti !== szint && opt.szint === eredeti ? ' eredeti' : ''}`}
          onClick={() => onChange(opt.szint)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
