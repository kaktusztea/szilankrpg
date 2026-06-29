import type { GameData } from '../../engine/data-loader';
import type { KepzettsegSlot } from './types';
import { TextInputPopup, GridPickerPopup } from './popups';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { KorPicker } from './KorPicker';
import { OverlayPortal } from '../overlays/OverlayPortal';
import { getDisplayName } from './helpers';

const SZINT_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

interface PromptState { alapNév: string }
interface DeleteTarget { idx: number; név: string; szint: number }

export interface PopupState {
  promptState: PromptState | null;
  promptValue: string;
  deleteTarget: DeleteTarget | null;
  pendingEditIdx: number | null;
  editingNév: boolean;
  tempNév: string;
  editingBecenév: boolean;
  tempBecenév: string;
  editingTsz: boolean;
  editingKor: boolean;
  editingJátékos: boolean;
  tempJátékos: string;
}

export const INITIAL_POPUP_STATE: PopupState = {
  promptState: null, promptValue: '', deleteTarget: null, pendingEditIdx: null,
  editingNév: false, tempNév: '', editingBecenév: false, tempBecenév: '',
  editingTsz: false, editingKor: false, editingJátékos: false, tempJátékos: ''
};

interface Props {
  data: GameData;
  képzettségek: KepzettsegSlot[];
  setKépzettségek: React.Dispatch<React.SetStateAction<KepzettsegSlot[]>>;
  popup: PopupState;
  setPopup: React.Dispatch<React.SetStateAction<PopupState>>;
  onConfirmPrompt: () => void;
  // Setterek
  setNév: (v: string) => void;
  setBecenév: (v: string) => void;
  tsz: number;
  setTsz: (v: number) => void;
  kor: number;
  setKor: (v: number) => void;
  setJátékos: (v: string) => void;
}

export function TulajdonsagokPopups({
  data, képzettségek, setKépzettségek,
  popup, setPopup, onConfirmPrompt,
  setNév, setBecenév, tsz, setTsz, kor, setKor, setJátékos
}: Props) {
  const p = popup;
  const close = (fields: Partial<PopupState>) => setPopup(prev => ({ ...prev, ...fields }));

  const tszValues = Array.from(
    { length: data.konstansok.arányok.max_tsz - 2 }, (_, i) => i + 3
  );

  return (<>
    {/* Szabad szöveges képzettség alnév */}
    {p.promptState && (
      <TextInputPopup
        label={`${p.promptState.alapNév} — alnév:`}
        value={p.promptValue}
        onChange={v => close({ promptValue: v })}
        onConfirm={onConfirmPrompt}
        onCancel={() => close({ promptState: null })}
        maxLength={20}
        disabled={!p.promptValue.trim()}
      />
    )}

    {/* Képzettség törlés megerősítő */}
    {p.deleteTarget && (
      <DeleteConfirmPopup
        label={p.deleteTarget.név}
        buttonText="Képzettség törlése"
        onConfirm={() => {
          setKépzettségek(prev => prev.filter((_, i) => i !== p.deleteTarget!.idx));
          close({ deleteTarget: null });
        }}
        onClose={() => close({ deleteTarget: null })}
      />
    )}

    {/* Új képzettség szint választó */}
    {p.pendingEditIdx !== null && képzettségek[p.pendingEditIdx] && (
      <GridPickerPopup
        label={`${getDisplayName(képzettségek[p.pendingEditIdx].név, data.kepzettsegDefs)} — szint:`}
        values={SZINT_VALUES}
        current={képzettségek[p.pendingEditIdx].szint}
        onSelect={n => {
          setKépzettségek(prev => prev.map((k, i) => i === p.pendingEditIdx ? { ...k, szint: n } : k));
          close({ pendingEditIdx: null });
        }}
        onCancel={() => close({ pendingEditIdx: null })}
      />
    )}

    {/* Név szerkesztő */}
    {p.editingNév && (
      <TextInputPopup
        label="Karakter neve:"
        value={p.tempNév}
        onChange={v => close({ tempNév: v })}
        onConfirm={() => { setNév(p.tempNév.trim()); close({ editingNév: false }); }}
        onCancel={() => close({ editingNév: false })}
        maxLength={40}
        disabled={!p.tempNév.trim()}
      />
    )}

    {/* Becenév szerkesztő */}
    {p.editingBecenév && (
      <TextInputPopup
        label="Becenév (max 12)"
        value={p.tempBecenév}
        onChange={v => close({ tempBecenév: v })}
        onConfirm={() => { setBecenév(p.tempBecenév.trim()); close({ editingBecenév: false }); }}
        onCancel={() => close({ editingBecenév: false })}
        maxLength={12}
      />
    )}

    {/* TSZ választó */}
    {p.editingTsz && (
      <GridPickerPopup
        label="Tapasztalati szint"
        values={tszValues}
        current={tsz}
        onSelect={n => { setTsz(n); close({ editingTsz: false }); }}
        onCancel={() => close({ editingTsz: false })}
        gridClass="tsz-grid"
      />
    )}

    {/* Kor választó */}
    {p.editingKor && (
      <OverlayPortal dismissible onClose={() => close({ editingKor: false })}>
        <KorPicker kor={kor} onSelect={v => setKor(v)} />
      </OverlayPortal>
    )}

    {/* Játékos szerkesztő */}
    {p.editingJátékos && (
      <TextInputPopup
        label="Játékos neve"
        value={p.tempJátékos}
        onChange={v => close({ tempJátékos: v })}
        onConfirm={() => { setJátékos(p.tempJátékos); close({ editingJátékos: false }); }}
        onCancel={() => close({ editingJátékos: false })}
        maxLength={40}
      />
    )}
  </>);
}
