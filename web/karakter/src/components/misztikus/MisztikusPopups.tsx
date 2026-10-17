import type { Kepzettseg } from '../../engine/types';
import { képzKulcs } from '../../engine/azonosito';
import type { Fortely } from '../../engine/types';
import type { FortelySummary } from '../../engine/data-loader';
import type { PopupState, TradícióOpció } from './types';
import { FortélyFelvétel } from '../fortelyok/FortelyFelvetel';
import {
  SzintPickerPopup,
  TextPromptPopup,
  TradícióPickerPopup,
  AltípusPickerPopup,
  FokPickerPopup,
} from './popups';
import { MagiaAkarataPopup } from './popups/MagiaAkarataPopup';
import { DeleteConfirmPopup } from '../DeleteConfirmPopup';

interface Props {
  state: PopupState;
  képzettségek: Kepzettseg[];
  fortélyok: Fortely[];
  tradícióOpciók: TradícióOpció[];
  misztFortDefs: FortelySummary[];
  önuralom: number;
  aurahangolás: number;
  /** Képzettség-kulcs → megjelenített név (felirat). */
  képzNév: (kulcs: string) => string;
  actions: {
    closeDelete: () => void;
    closeSzint: () => void;
    setPromptValue: (v: string) => void;
    closePrompt: () => void;
    closeTradíció: () => void;
    openAltípus: (név: string) => void;
    closeAltípus: () => void;
    closeFelvétel: () => void;
    closeFok: () => void;
    closeDeleteFort: () => void;
    closeMágiaAkarata: () => void;
  };
  onConfirmDelete: () => void;
  onSzintPick: (szint: number) => void;
  onPromptConfirm: () => void;
  onPickTradíció: (név: string) => void;
  onConfirmAltípus: (tradíció: string, altípus: string) => void;
  onFelvételDone: (result: Fortely) => void;
  onFokPick: (fok: number) => void;
  onConfirmDeleteFort: () => void;
}

export function MisztikusPopups({ state, képzettségek, fortélyok, tradícióOpciók, misztFortDefs, önuralom, aurahangolás, képzNév, actions, ...h }: Props) {
  const { deleteTarget, szintTarget, promptTarget, promptValue, tradícióPicker, tradícióAltípusPicker, felvételDef, misztFokTarget, deleteFortIdx } = state;

  // Derived values for fok/delete popups
  const fokFortély = misztFokTarget !== null ? fortélyok[misztFokTarget] : null;
  const fokDef = fokFortély ? misztFortDefs.find(d => d.id === fokFortély.id) : null;
  const delFortSlot = deleteFortIdx !== null ? fortélyok[deleteFortIdx] : null;
  const delFortLabel = delFortSlot ? `${misztFortDefs.find(d => d.id === delFortSlot.id)?.név ?? delFortSlot.id}${delFortSlot.elem ? ` - ${delFortSlot.elem}` : ''}` : '';

  return (
    <>
      {deleteTarget && (
        <DeleteConfirmPopup label={képzNév(deleteTarget)} buttonText="Képzettség törlése" onConfirm={h.onConfirmDelete} onClose={actions.closeDelete} />
      )}

      {szintTarget && (
        <SzintPickerPopup target={képzNév(szintTarget)}
          currentSzint={képzettségek.find(k => képzKulcs(k) === szintTarget)?.szint ?? 0}
          onPick={h.onSzintPick} onClose={actions.closeSzint} />
      )}

      {promptTarget && (
        <TextPromptPopup target={képzNév(promptTarget)} value={promptValue}
          onChange={actions.setPromptValue} onConfirm={h.onPromptConfirm} onClose={actions.closePrompt} />
      )}

      {tradícióPicker && (
        <TradícióPickerPopup opciók={tradícióOpciók}
          onPick={h.onPickTradíció} onPickAltípus={actions.openAltípus} onClose={actions.closeTradíció} />
      )}

      {tradícióAltípusPicker && (
        <AltípusPickerPopup tradícióNév={tradícióAltípusPicker} opciók={tradícióOpciók}
          onPick={h.onConfirmAltípus} onClose={actions.closeAltípus} />
      )}

      {felvételDef && (
        <FortélyFelvétel def={felvételDef} kiérdemeltOpció={false}
          felvettSpecElemek={fortélyok.filter(f => f.id === felvételDef.id).map(f => f.elem)}
          onDone={h.onFelvételDone} onCancel={actions.closeFelvétel} />
      )}

      {misztFokTarget !== null && fokFortély && (
        <FokPickerPopup név={fokDef?.név ?? fokFortély.id} maxfok={fokDef?.maxfok ?? 3}
          currentFok={fokFortély.fok} onPick={h.onFokPick} onClose={actions.closeFok} />
      )}

      {deleteFortIdx !== null && (
        <DeleteConfirmPopup label={delFortLabel} buttonText="Fortély törlése"
          onConfirm={h.onConfirmDeleteFort} onClose={actions.closeDeleteFort} />
      )}

      {state.mágiaAkarata && (
        <MagiaAkarataPopup önuralom={önuralom} aurahangolás={aurahangolás} onClose={actions.closeMágiaAkarata} />
      )}
    </>
  );
}
