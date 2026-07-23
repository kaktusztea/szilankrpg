interface Props {
  fd: { TÉ: string; VÉ: string; SP: string; Sebesség: string };
  mfFok: number;
  idea: number;
  konstansok: { mesterfegyver_bónuszok?: { fok: number; TÉ: number; VÉ: number; SP: number }[] };
  inactive?: boolean;
}

export function FegyverChip({ fd, mfFok, idea, konstansok, inactive }: Props) {
  const mf = konstansok.mesterfegyver_bónuszok?.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const cls = inactive ? ' he-strike' : '';
  return (
    <div className="he-fegyver-fields he-fegyver-chip-mb">
      <span className="he-field-btn he-field-indicator">
        <span className={`he-stat-label${cls}`}>TÉ:</span>
        <span className={cls}>{(parseInt(fd.TÉ) || 0) + mf.TÉ + idea}</span>
        {' '}<span className={`he-stat-ml${cls}`}>VÉ:</span>
        <span className={cls}>{(parseInt(fd.VÉ) || 0) + mf.VÉ + idea}</span>
        {' '}<span className={`he-stat-ml${cls}`}>SP:</span>
        <span className={cls}>{(parseInt(fd.SP) || 0) + mf.SP + idea}</span>
        {' '}<span className={`he-stat-ml${cls}`}>Sebesség:</span>
        <span className={cls}>{fd.Sebesség}</span>
      </span>
    </div>
  );
}
