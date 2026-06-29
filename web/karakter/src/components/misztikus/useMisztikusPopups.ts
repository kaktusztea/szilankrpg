import { useState } from 'react';
import type { PopupState } from './types';

const EMPTY: PopupState = {
  deleteTarget: null,
  szintTarget: null,
  promptTarget: null,
  promptValue: '',
  tradícióPicker: false,
  tradícióAltípusPicker: null,
  felvételDef: null,
  misztFokTarget: null,
  deleteFortIdx: null,
};

export function useMisztikusPopups() {
  const [state, setState] = useState<PopupState>(EMPTY);

  const actions = {
    openDelete: (név: string) => setState(s => ({ ...s, deleteTarget: név })),
    closeDelete: () => setState(s => ({ ...s, deleteTarget: null })),

    openSzint: (név: string) => setState(s => ({ ...s, szintTarget: név })),
    closeSzint: () => setState(s => ({ ...s, szintTarget: null })),

    openPrompt: (target: string) => setState(s => ({ ...s, promptTarget: target, promptValue: '' })),
    setPromptValue: (v: string) => setState(s => ({ ...s, promptValue: v })),
    closePrompt: () => setState(s => ({ ...s, promptTarget: null })),

    openTradíció: () => setState(s => ({ ...s, tradícióPicker: true })),
    closeTradíció: () => setState(s => ({ ...s, tradícióPicker: false })),

    openAltípus: (név: string) => setState(s => ({ ...s, tradícióPicker: false, tradícióAltípusPicker: név })),
    closeAltípus: () => setState(s => ({ ...s, tradícióAltípusPicker: null })),

    openFelvétel: (def: any) => setState(s => ({ ...s, felvételDef: def })),
    closeFelvétel: () => setState(s => ({ ...s, felvételDef: null })),

    openFok: (idx: number) => setState(s => ({ ...s, misztFokTarget: idx })),
    closeFok: () => setState(s => ({ ...s, misztFokTarget: null })),

    openDeleteFort: (idx: number) => setState(s => ({ ...s, deleteFortIdx: idx })),
    closeDeleteFort: () => setState(s => ({ ...s, deleteFortIdx: null })),
  };

  return { state, actions };
}
