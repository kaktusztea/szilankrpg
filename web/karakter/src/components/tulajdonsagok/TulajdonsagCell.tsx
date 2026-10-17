import { useState } from 'react';
import { GridPickerPopup } from './popups';
import { TulajdonsagProbaPopup } from './TulajdonsagProbaPopup';
import type { PróbaKonstansok } from '../../engine/data-types';

interface Props {
  név: string;
  érték: number;
  gameMode: boolean;
  onChange: (v: number) => void;
  fajMin?: number;
  fajMax?: number;
  /** Felszerelés-túlterhelés Hátrány (ha ez Fizikai tulajdonság), különben 0. */
  felszEH?: number;
  fortélyBónuszok?: { érték: number; leírás: string }[];
  felszNemHarcol?: boolean;
  próba: PróbaKonstansok;
  /** konstansok.tulajdonság_érték - a szerkesztő grid értékei. */
  tartomány: { min: number; max: number };
}

export function TulajdonsagCell({ név, érték, gameMode, onChange, fajMin, fajMax, felszEH = 0, felszNemHarcol = false, fortélyBónuszok, próba, tartomány }: Props) {
  const [editing, setEditing] = useState(false);
  const [showProba, setShowProba] = useState(false);

  const label = név.charAt(0).toUpperCase() + név.slice(1);
  const overLimit = fajMax !== undefined && érték > fajMax;
  const underLimit = fajMin !== undefined && érték < fajMin;
  const hasWarning = overLimit || underLimit;

  function handleClick() {
    if (gameMode) {
      setShowProba(true);
    } else {
      setEditing(true);
    }
  }

  return (
    <>
      <div
        className={`tul-cell${!gameMode ? ' editable' : ' tul-cell-game'}${hasWarning ? ' tul-warn' : ''}`}
        onClick={handleClick}
      >
        <span className="tul-label">{label}:</span>
        <span className={`tul-value${hasWarning ? ' tul-value-warn' : ''}`}>{érték}</span>
        {hasWarning && (
          <div className="tul-warn-info">{overLimit ? `Faj max: ${fajMax}` : `Faj min: ${fajMin}`}</div>
        )}
      </div>
      {editing && (
        <GridPickerPopup
          label={label}
          values={Array.from({ length: tartomány.max - tartomány.min + 1 }, (_, i) => tartomány.min + i)}
          current={érték}
          onSelect={v => { onChange(v); setEditing(false); }}
          onCancel={() => setEditing(false)}
          gridClass="tul-val-grid"
        />
      )}
      {showProba && (
        <TulajdonsagProbaPopup
          tulajdonságNév={név}
          érték={érték}
          felszEH={felszEH}
          fortélyBónuszok={fortélyBónuszok}
          felszNemHarcol={felszNemHarcol}
          próba={próba}
          onClose={() => setShowProba(false)}
        />
      )}
    </>
  );
}
