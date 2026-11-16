import { Ikon } from '../common/Ikon';
import { useState } from 'react';
import { SEB_TÍPUSOK, SEB_ALAP_MAX, SEB_BŐVÍTETT_MAX, type SebTípus } from '../../engine/harc/ep-logic';

/** Captions under the seb type letters. */
const SEB_TÍPUS_FELIRAT: Record<string, string> = { S: 'szúró', V: 'vágó', Z: 'zúzó', FP: 'fájdalom' };

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
    <div className="kep-prompt seb-dialog" onClick={e => e.stopPropagation()}>
      <label className="overlay-label-center">Sebesülés</label>
      {/* Type chips with a caption (S / V / Z / FP alone is cryptic); same one-tap flow as before */}
      <div className="seb-dialog-tipusok">
        {SEB_TÍPUSOK.map(t => (
          <button key={t} className={`seb-dialog-tipus${típus === t ? ' active' : ''}`} onClick={() => handleTípus(t)}>
            <b>{t}</b><span>{SEB_TÍPUS_FELIRAT[t]}</span>
          </button>
        ))}
      </div>
      <div className="kep-szint-grid">
        {Array.from({ length: SEB_ALAP_MAX }, (_, i) => i + 1).map(n => (
          <button key={n} className={`fort-fok-btn ${érték === n ? 'active' : ''}`} onClick={() => handleÉrték(n)}>{n}</button>
        ))}
      </div>
      {!expanded && <div className="ep-expand-btn" onClick={() => setExpanded(true)}><Ikon név="lenyit" /></div>}
      {expanded && (
        <div className="kep-szint-grid">
          {Array.from({ length: SEB_BŐVÍTETT_MAX - SEB_ALAP_MAX }, (_, i) => i + SEB_ALAP_MAX + 1).map(n => (
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
    <div className="kep-prompt seb-dialog" onClick={e => e.stopPropagation()}>
      <label className="overlay-label-center">Gyógyulás</label>
      <div className="seb-dialog-tipusok">
        <button disabled={maxÉP === 0} className={`seb-dialog-tipus${típus === 'ÉP' ? ' active' : ''}`} onClick={() => setTípus('ÉP')}><b>ÉP</b><span>életerő</span></button>
        <button disabled={maxFP === 0} className={`seb-dialog-tipus${típus === 'FP' ? ' active' : ''}`} onClick={() => setTípus('FP')}><b>FP</b><span>fájdalom</span></button>
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
