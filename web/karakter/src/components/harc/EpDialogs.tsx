import { useState } from 'react';
import type { SebTípus } from './ep-logic';

/** Sebesülés dialógus: típus + érték választás → onConfirm. */
export function SebDialog({ onConfirm }: { onConfirm: (t: SebTípus, v: number) => void }) {
  const [típus, setTípus] = useState<SebTípus | ''>('');
  const [érték, setÉrték] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  function handleTípus(t: SebTípus) {
    if (érték !== null) { onConfirm(t, érték); } else { setTípus(t); }
  }

  function handleÉrték(n: number) {
    if (típus) { onConfirm(típus as SebTípus, n); } else { setÉrték(n); }
  }

  return (
    <div className="kep-prompt" onClick={e => e.stopPropagation()}>
      <label>Sebesülés</label>
      <div className="ep-dialog-row">
        {(['S', 'V', 'Z', 'FP'] as SebTípus[]).map(t => (
          <button key={t} className={`fort-fok-btn ${típus === t ? 'active' : ''}`} onClick={() => handleTípus(t)}>{t}</button>
        ))}
      </div>
      <div className="kep-szint-grid">
        {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
          <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => handleÉrték(n)}>{n}</button>
        ))}
      </div>
      {!expanded && <div className="ep-expand-btn" onClick={() => setExpanded(true)}>▾</div>}
      {expanded && (
        <div className="kep-szint-grid">
          {Array.from({ length: 25 }, (_, i) => i + 16).map(n => (
            <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => handleÉrték(n)}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Gyógyulás dialógus: típus + érték választás → onConfirm. */
export function GyógyDialog({ maxÉP, maxFP, onConfirm }: { maxÉP: number; maxFP: number; onConfirm: (t: 'FP' | 'ÉP', v: number) => void }) {
  const autoType = maxÉP > 0 && maxFP === 0 ? 'ÉP' : maxFP > 0 && maxÉP === 0 ? 'FP' : '';
  const [típus, setTípus] = useState<'FP' | 'ÉP' | ''>(autoType);
  const max = típus === 'ÉP' ? maxÉP : típus === 'FP' ? maxFP : 0;

  function handleÉrték(n: number) {
    if (típus) onConfirm(típus as 'FP' | 'ÉP', n);
  }

  return (
    <div className="kep-prompt" onClick={e => e.stopPropagation()}>
      <label>Gyógyulás</label>
      <div className="ep-dialog-row">
        <button disabled={maxÉP === 0} className={`fort-fok-btn ${típus === 'ÉP' ? 'active' : ''}`} onClick={() => setTípus('ÉP')}>ÉP</button>
        <button disabled={maxFP === 0} className={`fort-fok-btn ${típus === 'FP' ? 'active' : ''}`} onClick={() => setTípus('FP')}>FP</button>
      </div>
      {típus && (
        <div className="kep-szint-grid">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <button key={n} className="fort-fok-btn" onClick={() => handleÉrték(n)}>{n}</button>
          ))}
        </div>
      )}
    </div>
  );
}
