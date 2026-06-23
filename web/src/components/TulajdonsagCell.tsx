import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function TulajdonsagCell({ név, érték, gameMode, onChange, fajMin, fajMax }: {
  név: string; érték: number; gameMode: boolean; onChange: (v: number) => void; fajMin?: number; fajMax?: number;
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setEditing(false); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing]);

  const label = név.charAt(0).toUpperCase() + név.slice(1);
  const overLimit = fajMax !== undefined && érték > fajMax;
  const underLimit = fajMin !== undefined && érték < fajMin;
  const hasWarning = overLimit || underLimit;

  return (
    <>
      <div
        className={`tul-cell ${!gameMode ? 'editable' : ''} ${hasWarning ? 'tul-warn' : ''}`}
        onClick={() => { if (!gameMode) setEditing(true); }}
      >
        <span className="tul-label">{label}:</span>
        <span className={`tul-value ${hasWarning ? 'tul-value-warn' : ''}`}>{érték}</span>
        {hasWarning && (
          <div className="tul-warn-info">{overLimit ? `Faj max: ${fajMax}` : `Faj min: ${fajMin}`}</div>
        )}
      </div>
      {editing && createPortal(
        <div className="kep-prompt-overlay">
          <div className="kep-prompt">
            <label>{label}</label>
            <div className="kep-szint-grid tul-val-grid">
              {[-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(n => (
                <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => { onChange(n); setEditing(false); }}>{n}</button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
