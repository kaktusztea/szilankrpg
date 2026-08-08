import { useState } from 'react';
import { GridPickerPopup } from './popups';
import { TulajdonsagProbaPopup } from './TulajdonsagProbaPopup';

const TUL_VALUES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

interface Props {
  név: string;
  érték: number;
  gameMode: boolean;
  onChange: (v: number) => void;
  fajMin?: number;
  fajMax?: number;
}

export function TulajdonsagCell({ név, érték, gameMode, onChange, fajMin, fajMax }: Props) {
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
          values={TUL_VALUES}
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
          onClose={() => setShowProba(false)}
        />
      )}
    </>
  );
}
