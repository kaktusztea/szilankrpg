interface Props {
  fd: { TÉ: number; VÉ: number; SP: number; Sebesség: number | null };
  mfFok: number;
  ideaHatás: { TÉ: number; VÉ: number; SP: number };
  konstansok: { mesterfegyver_bónuszok?: { fok: number; TÉ: number; VÉ: number; SP: number }[] };
  inactive?: boolean;
}

export function FegyverChip({ fd, mfFok, ideaHatás, konstansok, inactive }: Props) {
  const mf = konstansok.mesterfegyver_bónuszok?.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const cls = inactive ? ' he-strike' : '';
  return (
    <div className="he-fegyver-fields he-fegyver-chip-mb">
      <span className="he-field-btn he-field-indicator">
        <span className={`he-stat-label${cls}`}>TÉ:</span>
        <span className={cls}>{fd.TÉ + mf.TÉ + ideaHatás.TÉ}</span>
        {' '}<span className={`he-stat-ml${cls}`}>VÉ:</span>
        <span className={cls}>{fd.VÉ + mf.VÉ + ideaHatás.VÉ}</span>
        {' '}<span className={`he-stat-ml${cls}`}>SP:</span>
        <span className={cls}>{fd.SP + mf.SP + ideaHatás.SP}</span>
        {' '}<span className={`he-stat-ml${cls}`}>Sebesség:</span>
        <span className={cls}>{fd.Sebesség}</span>
      </span>
    </div>
  );
}
