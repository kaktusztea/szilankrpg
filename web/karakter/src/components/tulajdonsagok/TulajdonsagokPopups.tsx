import type { GameData } from '../../engine/data-loader';
import { bontKépzKulcs } from '../../engine/azonosito';
import type { KepzettsegSlot } from './types';
import { GridPickerPopup } from './popups';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';
import { KorPicker } from './KorPicker';
import { OverlayPortal } from '../common/OverlayPortal';
import { getDisplayName } from './helpers';
import { SZINT_VALUES, MAX_FREETEXT_NÉV, MAX_NÉV, MAX_BECENÉV } from '../../ui-constants';
import { TextInputPopup } from '../common/TextInputPopup';

interface PromptState { alapId: string }
interface DeleteTarget { idx: number; név: string; szint: number }

export interface PopupState {
  promptState: PromptState | null;
  promptValue: string;
  deleteTarget: DeleteTarget | null;
  pendingNew: { kulcs: string; insertAt: number } | null;
  editingNevek: boolean;
  tempNév: string;
  tempBecenév: string;
  editingTsz: boolean;
  editingKor: boolean;
  editingJátékos: boolean;
  tempJátékos: string;
}

export const INITIAL_POPUP_STATE: PopupState = {
  promptState: null, promptValue: '', deleteTarget: null, pendingNew: null,
  editingNevek: false, tempNév: '', tempBecenév: '',
  editingTsz: false, editingKor: false, editingJátékos: false, tempJátékos: ''
};

interface Props {
  data: GameData;
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
  data, setKépzettségek,
  popup, setPopup, onConfirmPrompt,
  setNév, setBecenév, tsz, setTsz, kor, setKor, setJátékos
}: Props) {
  const p = popup;
  const close = (fields: Partial<PopupState>) => setPopup(prev => ({ ...prev, ...fields }));
  const saveNevek = () => {
    setBecenév(p.tempBecenév.trim());
    if (p.tempNév.trim()) setNév(p.tempNév.trim()); // a név nem lehet üres
    close({ editingNevek: false });
  };
  const saveJátékos = () => { setJátékos(p.tempJátékos.trim()); close({ editingJátékos: false }); };

  const tszValues = Array.from(
    { length: data.konstansok.arányok.max_tsz - data.konstansok.arányok.min_tsz + 1 },
    (_, i) => i + data.konstansok.arányok.min_tsz
  );

  return (<>
    {/* Szabad szöveges képzettség alnév */}
    {p.promptState && (
      <TextInputPopup
        label={`${getDisplayName(p.promptState.alapId, data.kepzettsegDefs)} - alnév:`}
        value={p.promptValue}
        onChange={v => close({ promptValue: v })}
        onConfirm={onConfirmPrompt}
        onCancel={() => close({ promptState: null })}
        maxLength={MAX_FREETEXT_NÉV}
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
    {/* Új képzettség szint választó - a képzettség csak szint választáskor kerül be */}
    {p.pendingNew && (
      <GridPickerPopup
        label={`${getDisplayName(p.pendingNew.kulcs, data.kepzettsegDefs)} - szint:`}
        szín="kepzettseg"
        values={SZINT_VALUES}
        current={0}
        onSelect={n => {
          const { kulcs, insertAt } = p.pendingNew!;
          setKépzettségek(prev => {
            const arr = [...prev];
            arr.splice(insertAt, 0, { ...bontKépzKulcs(kulcs), szint: n });
            return arr;
          });
          close({ pendingNew: null });
        }}
        onCancel={() => close({ pendingNew: null })}
      />
    )}

    {/* Becenév + Név szerkesztő: egy ablak, nincs OK/Mégse - a mellé-katt menti és zár, Escape elvet */}
    {p.editingNevek && (
      <OverlayPortal
        dismissible
        onClose={saveNevek}
        onEscape={() => close({ editingNevek: false })}
      >
        <div className="kep-prompt">
          <label htmlFor="tul-becenev-input">{`Becenév (max ${MAX_BECENÉV})`}</label>
          <input id="tul-becenev-input" autoFocus maxLength={MAX_BECENÉV} value={p.tempBecenév}
            onChange={e => close({ tempBecenév: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') document.getElementById('tul-nev-input')?.focus(); }} />
          <label htmlFor="tul-nev-input">Név</label>
          <input id="tul-nev-input" maxLength={MAX_NÉV} value={p.tempNév}
            onChange={e => close({ tempNév: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') saveNevek(); }} />
        </div>
      </OverlayPortal>
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

    {/* Játékos szerkesztő: no OK / Mégse - Enter or tap outside saves and closes, Escape discards */}
    {p.editingJátékos && (
      <OverlayPortal
        dismissible
        onClose={saveJátékos}
        onEscape={() => close({ editingJátékos: false })}
      >
        <div className="kep-prompt">
          <label htmlFor="tul-jatekos-input">Játékos neve</label>
          <input id="tul-jatekos-input" autoFocus maxLength={MAX_NÉV} value={p.tempJátékos}
            onChange={e => close({ tempJátékos: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') saveJátékos(); }} />
        </div>
      </OverlayPortal>
    )}
  </>);
}
