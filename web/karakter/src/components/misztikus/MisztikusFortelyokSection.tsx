import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import { FortelyInfoPanel } from '../fortelyok/FortelyInfoPanel';
import { MAX_FORTÉLY_FOK } from '../ui-constants';

interface Props {
  misztFortDefs: FortelySummary[];
  fortélyok: Fortely[];
  gameMode: boolean;
  képzettségek: { név: string; szint: number }[];
  infoTarget: string | null;
  onInfoToggle: (key: string) => void;
  onFelvétel: (def: FortelySummary) => void;
  onFokChange: (globalIdx: number) => void;
  onDelete: (globalIdx: number) => void;
  onHint: (msg: string) => void;
}

export function MisztikusFortélyokSection({ misztFortDefs, fortélyok, gameMode, képzettségek, infoTarget, onInfoToggle, onFelvétel, onFokChange, onDelete, onHint }: Props) {
  const misztFortSlotok = fortélyok
    .filter(f => misztFortDefs.some(d => d.név === f.név))
    .sort((a, b) => a.név.localeCompare(b.név, 'hu'));

  const felvehető = misztFortDefs.filter(d => {
    if (!d.többszörös_típus) return !misztFortSlotok.some(s => s.név === d.név);
    if (d.többszörös_lista.length > 0) return d.többszörös_lista.some(l => !misztFortSlotok.some(s => s.név === d.név && s.spec_elem === l));
    return true;
  });

  if (gameMode && misztFortSlotok.length === 0) return null;

  return (
    <section className="miszt-section">
      <h3 className="miszt-section-title">Misztikus fortélyok</h3>
      {misztFortSlotok.map((f, i) => {
        const def = misztFortDefs.find(d => d.név === f.név);
        const maxfok = def?.maxfok ?? 1;
        const globalIdx = fortélyok.indexOf(f);
        const infoKey = `mf-${globalIdx}`;
        const isOpen = infoTarget === infoKey;
        const fokDef = def?.fokok.find(fd => fd.fok === f.fok);

        return (
          <div key={`${f.név}-${f.spec_elem}-${i}`} className="fort-row-wrapper">
            <div className="kep-row miszt-fort-row"
              onClick={() => {
                if (gameMode) { onInfoToggle(infoKey); return; }
                if (maxfok > 1) onFokChange(globalIdx);
                else onHint('1 fok a maximum');
              }}>
              <span className="kep-név miszt-fort-name">
                {f.spec_elem ? `${f.név} - ${f.spec_elem}` : f.név}{f.kiérdemelt ? ' ⭐' : ''}
              </span>
              {!gameMode && (
                <button className="fort-delete" onClick={e => { e.stopPropagation(); onDelete(globalIdx); }}>✕</button>
              )}
              <span className="fort-fok-dots">
                {Array.from({ length: MAX_FORTÉLY_FOK }, (_, di) => (
                  <span key={di} className={`fort-dot${di < f.fok ? ' filled' : ''}${di >= maxfok ? ' fort-dot-hidden' : ''}`} />
                ))}
              </span>
            </div>
            {gameMode && isOpen && def && (
              <FortelyInfoPanel
                def={def} fokDef={fokDef}
                kiterjesztiNormál={def.kiterjeszti_normál}
                kiterjesztiErős={def.kiterjeszti_erős}
                képzettségek={képzettségek}
              />
            )}
          </div>
        );
      })}
      {!gameMode && felvehető.length > 0 && (
        <select className="he-add-select" value="" onChange={e => {
          if (!e.target.value) return;
          const def = misztFortDefs.find(d => d.név === e.target.value);
          if (def) onFelvétel(def);
        }}>
          <option value="">+ Misztikus fortély...</option>
          {felvehető.map(d => <option key={d.név} value={d.név}>{d.név}</option>)}
        </select>
      )}
    </section>
  );
}
