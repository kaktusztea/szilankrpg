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
  /** Kompakt, egy soros vízszintes elrendezés (E+2 E+1 - H-1 H-2) - helytakarékos a dobás-popupokban. */
  kompakt?: boolean;
}

export function ElonyPicker({ szint, eredeti, onChange, rövid, kompakt }: Props) {
  // Kompakt (vízszintes) módban fordított sorrend: H-2 H-1 - E+1 E+2 (balról hátrány, jobbra előny).
  const opciók = kompakt ? [...ELŐNY_OPCIÓK].reverse() : ELŐNY_OPCIÓK;
  return (
    <div className={`tamado-elony-list${kompakt ? ' tamado-elony-kompakt' : ''}`}>
      {opciók.map(opt => (
        <button
          key={opt.szint}
          className={`tamado-elony-chip${opt.szint === 0 ? ' tamado-elony-alap' : ''}${szint === opt.szint ? ' active' : ''}${eredeti !== undefined && eredeti !== szint && opt.szint === eredeti ? ' eredeti' : ''}`}
          onClick={() => onChange(opt.szint)}
          aria-label={opt.label}
          aria-pressed={szint === opt.szint}
        >
          {opt.szint === 0 && kompakt ? '-' : (rövid ? opt.rövid : opt.label)}
        </button>
      ))}
    </div>
  );
}
