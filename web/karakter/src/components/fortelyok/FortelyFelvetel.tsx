import { useState } from 'react';
import type { FortelySummary } from '../../engine/data-loader';
import type { Fortely } from '../../engine/types';
import { PopupOverlay } from '../PopupOverlay';

/**
 * Generikus fortély felvételi wizard overlay.
 * Lépések: [többszörösség] → [kiérdemelt] → [fok]
 */

interface FortélyFelvételProps {
  def: FortelySummary;
  kiérdemeltOpció: boolean;
  felvettSpecElemek: string[];
  onDone: (result: Fortely) => void;
  onCancel: () => void;
}

type Step = 'többszörös' | 'kiérdemelt' | 'fok' | null;

export function FortélyFelvétel({ def, kiérdemeltOpció, felvettSpecElemek, onDone, onCancel }: FortélyFelvételProps) {
  const hasTöbbszörös = !!def.többszörös_típus;
  const hasLista = hasTöbbszörös && def.többszörös_lista.length > 0;
  const hasFreeText = hasTöbbszörös && def.többszörös_lista.length === 0;

  const firstStep: Step = hasTöbbszörös ? 'többszörös' : kiérdemeltOpció ? 'kiérdemelt' : def.maxfok > 1 ? 'fok' : null;

  const [step, setStep] = useState<Step>(firstStep);
  const [specElem, setSpecElem] = useState('');
  const [kiérdemelt, setKiérdemelt] = useState(false);
  const [freetextValue, setFreetextValue] = useState('');

  if (firstStep === null) {
    onDone({ név: def.név, fok: 1, spec_típus: '', spec_elem: '', kiérdemelt: false });
    return null;
  }

  function finish(fok = 1) {
    onDone({ név: def.név, fok, spec_típus: def.többszörös_típus, spec_elem: specElem, kiérdemelt });
  }

  function handleListaSelect(item: string) {
    setSpecElem(item);
    if (def.maxfok > 1) { setSpecElem(item); setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: item, kiérdemelt: false });
  }

  function handleFreetextOk() {
    if (!freetextValue.trim()) return;
    const val = freetextValue.trim();
    setSpecElem(val);
    if (kiérdemeltOpció) { setSpecElem(val); setStep('kiérdemelt'); return; }
    if (def.maxfok > 1) { setSpecElem(val); setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: val, kiérdemelt: false });
  }

  function handleKiérdemelt(value: boolean) {
    setKiérdemelt(value);
    if (def.maxfok > 1) { setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: specElem, kiérdemelt: value });
  }

  return (
    <PopupOverlay onClose={onCancel}>
      {step === 'többszörös' && hasLista && (
        <>
          <label className="kep-prompt-label-bold-mb">{def.név}</label>
          <div className="kep-prompt-flex-col-list">
            {def.többszörös_lista.filter(l => !felvettSpecElemek.includes(l)).map(l => (
              <button key={l} className="he-field-btn" onClick={() => handleListaSelect(l)}>{l}</button>
            ))}
          </div>
        </>
      )}
      {step === 'többszörös' && hasFreeText && (
        <>
          <label>{def.név}: {def.többszörös_típus}</label>
          <input autoFocus maxLength={30} value={freetextValue} onChange={e => setFreetextValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleFreetextOk(); if (e.key === 'Escape') onCancel(); }} />
          <div className="kep-prompt-btns">
            <button onClick={handleFreetextOk} disabled={!freetextValue.trim()}>OK</button>
          </div>
        </>
      )}
      {step === 'kiérdemelt' && (
        <>
          <label className="kep-prompt-label-bold">{specElem ? `${def.név} - ${specElem}` : def.név}</label>
          <div className="kep-prompt-flex-btns-mt">
            <button className="he-field-btn kep-prompt-btn-lg" onClick={() => handleKiérdemelt(false)}>Felvett</button>
            <button className="he-field-btn kep-prompt-btn-lg" onClick={() => handleKiérdemelt(true)}>⭐ Kiérdemelt</button>
          </div>
        </>
      )}
      {step === 'fok' && (
        <>
          <label>{def.név}{specElem ? ` - ${specElem}` : ''} — fok:</label>
          <div className="kep-prompt-flex-fok">
            {Array.from({ length: def.maxfok }, (_, i) => i + 1).map(n => (
              <button key={n} className="fort-fok-btn" onClick={() => finish(n)}>{n}</button>
            ))}
          </div>
        </>
      )}
    </PopupOverlay>
  );
}
