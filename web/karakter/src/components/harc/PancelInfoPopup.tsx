import { PopupOverlay } from '../PopupOverlay';
import type { Karakter, PancelPeldany } from '../../engine/types';

interface Props {
  karakter: Karakter;
  sfé_fizikai: number;
  sfé_energia: number;
  mgt: number;
  lefedettség: number;
  setKarakter: React.Dispatch<React.SetStateAction<Karakter | null>>;
  onClose: () => void;
}

/**
 * Páncél info overlay: all armor stats at a glance.
 * Rongálódás and Végtagvédettség are editable (tap cycles value).
 */
export function PancelInfoPopup({ karakter, sfé_fizikai, sfé_energia, mgt, lefedettség, setKarakter, onClose }: Props) {
  const p = karakter.páncél;
  const hasAlap = !!p.alap;

  function updatePancel(patch: Partial<PancelPeldany>) {
    setKarakter(prev => prev ? { ...prev, páncél: { ...prev.páncél, ...patch } } : prev);
  }

  if (!hasAlap) {
    return (
      <PopupOverlay onClose={onClose}>
        <div className="pancel-info-popup">
          <div className="ke-dobas-header">Páncél</div>
          <div className="pancel-info-empty">Nincs páncél kiválasztva</div>
        </div>
      </PopupOverlay>
    );
  }

  return (
    <PopupOverlay onClose={onClose}>
      <div className="pancel-info-popup">
        <div className="ke-dobas-header">Páncél</div>

        <div className="pancel-info-grid">
          <InfoRow label="Struktúra" value={p.alap} />
          <InfoRow label="SFÉ" value={`${sfé_fizikai}F / ${sfé_energia}E`} highlight />
          <InfoRow label="MGT" value={String(mgt)} highlight />
          <InfoRow label="Lefedettség" value={`${lefedettség}%`} />
          {p.fémalapanyag && <InfoRow label="Fémalapanyag" value={p.fémalapanyag} />}
          <InfoRow label="Kidolgozottság" value={p.kidolgozottság} />
          <InfoRow label="Méret" value={p.méret_illeszkedés} />
          <InfoRow label="Sisak" value={p.sisak ? 'igen' : 'nem'} />
          <InfoRow label="Idea" value={String(p.idea)} />

          {/* Editable fields */}
          <div className="pancel-info-row pancel-info-editable">
            <span className="pancel-info-label">Rongálódás</span>
            <div className="pancel-info-stepper">
              <button className="pancel-step-btn" disabled={p.rongálódás <= 0}
                onClick={() => updatePancel({ rongálódás: p.rongálódás - 1 })}>−</button>
              <span className="pancel-step-value">{p.rongálódás}</span>
              <button className="pancel-step-btn" disabled={p.rongálódás >= 5}
                onClick={() => updatePancel({ rongálódás: p.rongálódás + 1 })}>+</button>
            </div>
          </div>

          <div className="pancel-info-row pancel-info-editable">
            <span className="pancel-info-label">Végtagvédettség</span>
            <div className="pancel-info-stepper">
              <button className="pancel-step-btn" disabled={p.végtagvédettség <= 0}
                onClick={() => updatePancel({ végtagvédettség: p.végtagvédettség - 1 })}>−</button>
              <span className="pancel-step-value">{p.végtagvédettség}</span>
              <button className="pancel-step-btn" disabled={p.végtagvédettség >= 4}
                onClick={() => updatePancel({ végtagvédettség: p.végtagvédettség + 1 })}>+</button>
            </div>
          </div>
        </div>
      </div>
    </PopupOverlay>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="pancel-info-row">
      <span className="pancel-info-label">{label}</span>
      <span className={`pancel-info-value${highlight ? ' pancel-info-highlight' : ''}`}>{value}</span>
    </div>
  );
}
