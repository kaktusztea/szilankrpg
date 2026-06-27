import type { CSSProperties } from 'react';

interface Props {
  fd: { TÉ: string; VÉ: string; SP: string; Sebesség: string };
  mfFok: number;
  idea: number;
  konstansok: { mesterfegyver_bónuszok?: { fok: number; TÉ: number; VÉ: number; SP: number }[] };
  strike?: CSSProperties;
}

export function FegyverChip({ fd, mfFok, idea, konstansok, strike }: Props) {
  const mf = konstansok.mesterfegyver_bónuszok?.find(b => b.fok === mfFok) ?? { TÉ: 0, VÉ: 0, SP: 0 };
  return (
    <div className="he-fegyver-fields he-fegyver-chip-mb">
      <span className="he-field-btn he-field-indicator">
        <span className="he-stat-label" style={strike}>TÉ:</span>
        <span style={strike}>{(parseInt(fd.TÉ) || 0) + mf.TÉ + idea}</span>
        {' '}<span className="he-stat-ml">VÉ:</span>{(parseInt(fd.VÉ) || 0) + mf.VÉ + idea}
        {' '}<span className="he-stat-ml" style={strike}>SP:</span>
        <span style={strike}>{(parseInt(fd.SP) || 0) + mf.SP + idea}</span>
        {' '}<span className="he-stat-ml" style={strike}>Sebesség:</span>
        <span style={strike}>{fd.Sebesség}</span>
      </span>
    </div>
  );
}
