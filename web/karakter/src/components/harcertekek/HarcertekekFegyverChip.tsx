interface Props {
  fd: { TÉ: number; VÉ: number; SP: number; Sebesség: number | null };
  mfFok: number;
  ideaHatás: { TÉ: number; VÉ: number; SP: number };
  konstansok: { mesterfegyver_bónuszok?: { fok: number; TÉ: number; VÉ: number; SP: number }[] };
  inactive?: boolean;
  ár?: string;
}

export function FegyverChip({ fd, mfFok, ideaHatás, konstansok, inactive, ár }: Props) {
  const mf = konstansok.mesterfegyver_bónuszok?.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
  const cls = inactive ? ' he-strike' : '';
  // Plain stats (no box), two lines: TÉ / VÉ / SP, then Sebesség / Ár. Labels neutral (no TÉ/VÉ colors: the card already has enough color).
  return (
    <div className={`he-stat-sor${cls}`}>
      <div className="he-stat-fo">
        TÉ <b>{fd.TÉ + mf.TÉ + ideaHatás.TÉ}</b>
        <span className="he-stat-sep"> · </span>VÉ <b>{fd.VÉ + mf.VÉ + ideaHatás.VÉ}</b>
        <span className="he-stat-sep"> · </span>SP <b>{fd.SP + mf.SP + ideaHatás.SP}</b>
      </div>
      <div>
        Sebesség <b>{fd.Sebesség ?? '-'}</b>
        {ár !== undefined && <><span className="he-stat-sep"> · </span>Ár <b>{ár}x</b></>}
      </div>
    </div>
  );
}
