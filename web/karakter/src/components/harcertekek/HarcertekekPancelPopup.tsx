import { PopupOverlay } from './PopupOverlay';
import { FokRadios, ColumnPicker } from './PickerComponents';

interface Props {
  popup: string;
  páncél: { alap: string; fémalapanyag: string; kidolgozottság: string; méret_illeszkedés: string; végtagvédettség: number; rongálódás: number };
  struktúrák: { struktúra: string; fém?: boolean }[];
  fémalapanyagok: { anyag: string }[];
  merevvertFok: number;
  onUpdate: (patch: Record<string, unknown>) => void;
  onMerevvert: (fok: number) => void;
}

export function PancelPopup({ popup, páncél, struktúrák, fémalapanyagok, merevvertFok, onUpdate, onMerevvert }: Props) {
  return (
    <PopupOverlay onClose={() => onUpdate({})}>
      {popup === 'struktúra' && (
        <ColumnPicker
          wide
          options={[
            { value: '', label: '— nincs —' },
            ...struktúrák.map(s => ({ value: s.struktúra, label: s.struktúra })),
          ]}
          current={páncél.alap}
          onSelect={v => onUpdate({ alap: v, fémalapanyag: '' })}
        />
      )}
      {popup === 'fémalapanyag' && (
        <ColumnPicker
          options={[
            { value: '', label: 'acél (alap)' },
            ...fémalapanyagok.map(a => ({ value: a.anyag, label: a.anyag })),
          ]}
          current={páncél.fémalapanyag}
          onSelect={v => onUpdate({ fémalapanyag: v })}
        />
      )}
      {popup === 'kidolgozottság' && (
        <ColumnPicker
          options={['pocsék', 'átlagos', 'mestermunka'].map(v => ({ value: v, label: v }))}
          current={páncél.kidolgozottság}
          onSelect={v => onUpdate({ kidolgozottság: v })}
        />
      )}
      {popup === 'méret' && (
        <ColumnPicker
          wide
          options={['passzol', 'nem passzol', 'borzalmas'].map(v => ({ value: v, label: v }))}
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
