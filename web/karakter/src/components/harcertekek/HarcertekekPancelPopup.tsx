import { PopupOverlay } from '../PopupOverlay';
import { FokRadios, ColumnPicker } from '../common/PickerComponents';

interface Props {
  popup: string;
  páncél: { alap: string; fémalapanyag: string; kidolgozottság: string; méret_illeszkedés: string; végtagvédettség: number; rongálódás: number };
  struktúrák: { struktúra: string; fém?: boolean }[];
  fémalapanyagok: { anyag: string }[];
  kidolgozottságOpciók: string[];
  méretOpciók: string[];
  merevvertFok: number;
  onUpdate: (patch: Record<string, unknown>) => void;
  onMerevvert: (fok: number) => void;
  /** Tap outside / Escape without a selection. */
  onDismiss: () => void;
}

// Header of each armour field picker (what is being set)
const CÍMEK: Record<string, React.ReactNode> = {
  struktúra: 'Struktúra', fémalapanyag: 'Fémalapanyag', kidolgozottság: 'Kidolgozottság', méret: 'Méret',
  végtagvédettség: <>Végtagvédettség<br /><span className="overlay-desc-dim">(csatolt darab)</span></>, rongálódás: 'Rongálódás', merevvért: 'Merevvértviselet fortély fok',
};

export function PancelPopup({ popup, páncél, struktúrák, fémalapanyagok, kidolgozottságOpciók, méretOpciók, merevvertFok, onUpdate, onMerevvert, onDismiss }: Props) {
  return (
    <PopupOverlay onClose={onDismiss}>
      {CÍMEK[popup] && <label className="kep-prompt-text-center">{CÍMEK[popup]}</label>}
      {popup === 'struktúra' && (
        <ColumnPicker
          wide
          options={[
            { value: '', label: '- nincs -' },
            ...struktúrák.map(s => ({ value: s.struktúra, label: s.struktúra })),
          ]}
          current={páncél.alap}
          onSelect={v => onUpdate({ alap: v, fémalapanyag: '', idea: 0 })}
        />
      )}
      {popup === 'fémalapanyag' && (
        <ColumnPicker
          options={fémalapanyagok.map(a => ({ value: a.anyag, label: a.anyag }))}
          current={páncél.fémalapanyag || fémalapanyagok[0]?.anyag || ''}
          onSelect={v => onUpdate({ fémalapanyag: v })}
        />
      )}
      {popup === 'kidolgozottság' && (
        <ColumnPicker
          options={kidolgozottságOpciók.map(v => ({ value: v, label: v }))}
          current={páncél.kidolgozottság}
          onSelect={v => onUpdate({ kidolgozottság: v })}
        />
      )}
      {popup === 'méret' && (
        <ColumnPicker
          wide
          options={méretOpciók.map(v => ({ value: v, label: v }))}
          current={páncél.méret_illeszkedés}
          onSelect={v => onUpdate({ méret_illeszkedés: v })}
        />
      )}
      {popup === 'végtagvédettség' && (
        <FokRadios values={[0, 1, 2, 3, 4]} current={páncél.végtagvédettség} onSelect={v => onUpdate({ végtagvédettség: v })} />
      )}
      {popup === 'rongálódás' && (
        <FokRadios values={[0, 1, 2, 3, 4, 5]} current={páncél.rongálódás} onSelect={v => onUpdate({ rongálódás: v })} />
      )}
      {popup === 'merevvért' && (
        <FokRadios values={[0, 1, 2, 3]} current={merevvertFok} onSelect={onMerevvert} />
      )}
    </PopupOverlay>
  );
}
