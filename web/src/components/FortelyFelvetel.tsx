import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { FortelySummary } from '../engine/data-loader';
import type { Fortely } from '../engine/types';

/**
 * Generikus fortély felvételi wizard overlay.
 * Lépések: [többszörösség] → [kiérdemelt] → [fok]
 * A hívó oldal a `def`-et és konfigot adja, az eredményt callback-kel kapja.
 */

interface FortélyFelvételProps {
  def: FortelySummary;
  /** Ha true, a Felvett/Kiérdemelt választó megjelenik */
  kiérdemeltOpció: boolean;
  /** Már felvett spec_elem-ek (többszörösnél szűréshez) */
  felvettSpecElemek: string[];
  onDone: (result: Fortely) => void;
  onCancel: () => void;
}

type Step = 'többszörös' | 'kiérdemelt' | 'fok' | null;

export function FortélyFelvétel({ def, kiérdemeltOpció, felvettSpecElemek, onDone, onCancel }: FortélyFelvételProps) {
  const hasTöbbszörös = !!def.többszörös_típus;
  const hasLista = hasTöbbszörös && def.többszörös_lista.length > 0;
  const hasFreeText = hasTöbbszörös && def.többszörös_lista.length === 0;

  // Milyen lépéssel indulunk
  const firstStep: Step = hasTöbbszörös ? 'többszörös' : kiérdemeltOpció ? 'kiérdemelt' : def.maxfok > 1 ? 'fok' : null;

  const [step, setStep] = useState<Step>(firstStep);
  const [specElem, setSpecElem] = useState('');
  const [kiérdemelt, setKiérdemelt] = useState(false);
  const [freetextValue, setFreetextValue] = useState('');

  // Ha nincs lépés → azonnal done
  if (firstStep === null) {
    onDone({ név: def.név, fok: 1, spec_típus: '', spec_elem: '', kiérdemelt: false });
    return null;
  }

  function finish(fok = 1) {
    onDone({ név: def.név, fok, spec_típus: def.többszörös_típus, spec_elem: specElem, kiérdemelt });
  }

  function handleListaSelect(item: string) {
    setSpecElem(item);
    // Lista esetén nincs kiérdemelt, ugrunk fok-ra vagy done
    if (def.maxfok > 1) { setSpecElem(item); setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: item, kiérdemelt: false });
  }

  function handleFreetextOk() {
    if (!freetextValue.trim()) return;
    setSpecElem(freetextValue.trim());
    // Free-text után → kiérdemelt (ha engedélyezett) → fok → done
    if (kiérdemeltOpció) { setSpecElem(freetextValue.trim()); setStep('kiérdemelt'); return; }
    if (def.maxfok > 1) { setSpecElem(freetextValue.trim()); setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: freetextValue.trim(), kiérdemelt: false });
  }

  function handleKiérdemelt(value: boolean) {
    setKiérdemelt(value);
    if (def.maxfok > 1) { setStep('fok'); return; }
    onDone({ név: def.név, fok: 1, spec_típus: def.többszörös_típus, spec_elem: specElem, kiérdemelt: value });
  }

  return createPortal(
    <div className="kep-prompt-overlay" onClick={e => { if ((e.target as HTMLElement).classList.contains('kep-prompt-overlay')) onCancel(); }}>
      <div className="kep-prompt">
        {step === 'többszörös' && hasLista && (
          <>
            <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>{def.név}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
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
            <label style={{ fontWeight: 'bold' }}>{specElem ? `${def.név} - ${specElem}` : def.név}</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => handleKiérdemelt(false)}>Felvett</button>
              <button className="he-field-btn" style={{ padding: '10px 16px', fontSize: '16px' }} onClick={() => handleKiérdemelt(true)}>⭐ Kiérdemelt</button>
            </div>
          </>
        )}
        {step === 'fok' && (
          <>
            <label>{def.név}{specElem ? ` - ${specElem}` : ''} — fok:</label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: def.maxfok }, (_, i) => i + 1).map(n => (
                <button key={n} className="fort-fok-btn" onClick={() => finish(n)}>{n}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
