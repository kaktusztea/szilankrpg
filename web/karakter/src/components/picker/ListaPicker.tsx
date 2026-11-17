import { useState } from 'react';
import { Ikon } from '../common/Ikon';
import { PickerOverlay } from './PickerOverlay';

interface ListaOpció {
  érték: string;
  név: string;
  disabled?: boolean;
  /** Small second line under the name (e.g. why it is disabled). */
  megjegyzés?: string;
  /** Short stats on the same line, right of the name (e.g. "CÉ: 5, SP: 8, Osz: 3"). */
  infó?: string;
  /** Toggle-like row: choosing it keeps the picker open (the row's infó shows the new state). */
  marad?: boolean;
}

interface ListaPickerProps {
  title: string;
  opciók: ListaOpció[];
  /** Currently selected value (✓ + green border), if any. */
  aktív?: string;
  onVálaszt: (érték: string) => void;
  onClose: () => void;
}

/** Overlay list picker replacing native <select>s: one tap = choose + close. */
export function ListaPicker({ title, opciók, aktív, onVálaszt, onClose }: ListaPickerProps) {
  return (
    <PickerOverlay title={title} onClose={onClose}>
      {opciók.map(o => (
        <button type="button" key={o.érték} disabled={o.disabled}
          className={`aktiv-picker-item${o.érték === aktív ? ' active' : ''}${o.disabled ? ' aktiv-picker-disabled' : ''}`}
          onClick={() => { onVálaszt(o.érték); if (!o.marad) onClose(); }}>
          <span className="lista-picker-sor">
            <span className="aktiv-picker-item-name">{o.érték === aktív ? <><Ikon név="pipa" /> </> : null}{o.név}</span>
            {o.infó && <span className="lista-picker-info">{o.infó}</span>}
          </span>
          {o.megjegyzés && <span className="aktiv-picker-item-details">{o.megjegyzés}</span>}
        </button>
      ))}
    </PickerOverlay>
  );
}

interface PluszGombProps {
  /** Picker title, e.g. "Új távfegyver" */
  cím: string;
  opciók: ListaOpció[];
  onVálaszt: (érték: string) => void;
  disabled?: boolean;
}

/** Small "+" box for a section title row (`csoport-uj-btn` look) that opens a ListaPicker. */
export function PluszGomb({ cím, opciók, onVálaszt, disabled }: PluszGombProps) {
  const [nyitva, setNyitva] = useState(false);
  return (
    <>
      <button type="button" className={`csoport-uj-btn${disabled ? ' he-add-disabled' : ''}`} title={cím} aria-label={cím}
        disabled={disabled} onClick={() => setNyitva(true)}><Ikon név="új" /></button>
      {nyitva && <ListaPicker title={cím} opciók={opciók} onVálaszt={onVálaszt} onClose={() => setNyitva(false)} />}
    </>
  );
}
