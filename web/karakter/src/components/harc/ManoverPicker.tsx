import type { ManoverEntry } from '../../engine/data-types';
import { PickerOverlay } from '../aktiv/PickerOverlay';

const TÍPUS_LABEL: Record<string, string> = {
  általános: 'Általános',
  belharcos: 'Belharci',
  lovas: 'Lovas',
};

interface Props {
  /** 'mód' = aktív/passzív választó, 'lista' = manőver lista */
  fázis: 'mód' | 'lista';
  manoverek: ManoverEntry[];
  onMód: (mód: 'aktív' | 'passzív') => void;
  onPick: (manőver: ManoverEntry) => void;
  onClose: () => void;
}

/**
 * Manőver választó két lépésben: előbb mód (aktív = én hajtom végre / passzív = ellenem),
 * majd a manőver kiválasztása típus szerint csoportosítva (Harc fül).
 */
export function ManoverPicker({ fázis, manoverek, onMód, onPick, onClose }: Props) {
  if (fázis === 'mód') {
    return (
      <PickerOverlay title="Manőver mód" onClose={onClose}>
        <div className="aktiv-picker-item manover-mod-btn" onClick={() => onMód('aktív')}>
          <span className="aktiv-picker-item-name">⚔️ Aktív</span>
          <span className="aktiv-picker-item-details">Én hajtom végre a manővert</span>
        </div>
        <div className="aktiv-picker-item manover-mod-btn" onClick={() => onMód('passzív')}>
          <span className="aktiv-picker-item-name">🛡️ Passzív</span>
          <span className="aktiv-picker-item-details">Ellenem hajtják végre</span>
        </div>
      </PickerOverlay>
    );
  }

  return (
    <PickerOverlay title="Manőver választó" onClose={onClose}>
      {Object.keys(TÍPUS_LABEL).map(típus => {
        const items = manoverek.filter(m => m.típus === típus);
        if (items.length === 0) return null;
        return (
          <div key={típus}>
            <div className="aktiv-picker-category">{TÍPUS_LABEL[típus]}</div>
            {items.map(m => (
              <div key={m.név} className="aktiv-picker-item" onClick={() => onPick(m)}>
                <span className="aktiv-picker-item-name">{m.név}</span>
                <span className="aktiv-picker-item-details">Nehézség: {m.nehézség} • Fázisok: {m.fázisok}</span>
                <span className="aktiv-picker-item-hatas">{m.hatás}</span>
              </div>
            ))}
          </div>
        );
      })}
    </PickerOverlay>
  );
}
