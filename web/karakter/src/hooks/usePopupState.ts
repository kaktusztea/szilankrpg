import { useState, useCallback } from 'react';

/**
 * Generikus popup state kezelő hook.
 * Használat: const [popup, setPopupField, resetPopup] = usePopupState(INITIAL);
 */
export function usePopupState<T extends Record<string, unknown>>(initial: T) {
  const [state, setState] = useState<T>(initial);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => setState(initial), [initial]);

  return [state, setField, reset] as const;
}
