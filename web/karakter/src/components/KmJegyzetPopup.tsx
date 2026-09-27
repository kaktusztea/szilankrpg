import { useState } from 'react';
import { PopupOverlay } from './PopupOverlay';
import { MAX_KM_JEGYZET } from '../ui-constants';

interface Props {
  betű: string;
  szín: string;
  név: string;
  jegyzet: string;
  onSave: (jegyzet: string) => void;
  onClose: () => void;
  /** Ha adott, "Váltás a karakterre" gomb jelenik meg alul (nem az aktív NJK jegyzetéhez). */
  onVáltás?: () => void;
}

/** KM harci jegyzet popup: kis textarea egy NJK jelöléséhez. Mentés bezáráskor. */
export function KmJegyzetPopup({ betű, szín, név, jegyzet, onSave, onClose, onVáltás }: Props) {
  const [szöveg, setSzöveg] = useState(jegyzet);
  const zár = () => { onSave(szöveg.trim()); onClose(); };

  return (
    <PopupOverlay onClose={zár}>
      <div className="kep-prompt km-jegyzet-popup" onClick={e => e.stopPropagation()}>
        <label className="kep-prompt-label-bold-mb">
          {név} (<span className="km-jel-betű" style={{ color: szín }}>{betű}</span>)
        </label>
        <textarea
          className="km-jegyzet-input"
          value={szöveg}
          maxLength={MAX_KM_JEGYZET}
          rows={3}
          autoFocus
          onChange={e => setSzöveg(e.target.value)}
        />
        {onVáltás && (
          <button className="km-jegyzet-váltás-btn" onClick={() => { zár(); onVáltás(); }}>
            Váltás a karakterre
          </button>
        )}
      </div>
    </PopupOverlay>
  );
}
