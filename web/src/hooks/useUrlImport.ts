import { useEffect, useRef } from 'react';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import type { OverlayState } from '../components/AppOverlays';
import { generateUid, generateIdLeíró } from '../engine/file-ops';
import { decodeKarakterFromHash } from '../engine/url-share';

export function useUrlImport(
  data: GameData | null,
  setOverlay: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void,
  importKarakter: (k: Karakter, overwriteUid: string | false) => void,
) {
  const hashImportDone = useRef(false);

  useEffect(() => {
    if (hashImportDone.current || !data) return;
    const hash = window.location.hash.slice(1);
    if (hash.length < 20) return;
    hashImportDone.current = true;
    const result = decodeKarakterFromHash(hash);
    if ('error' in result) {
      setOverlay('toast', { msg: result.error, type: 'error' });
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    const imported = result.karakter;
    let slots: { uid: string; név: string; tsz: number; mentés_dátum: string }[] = [];
    try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
    const match = slots.find(s => s.név === imported.név && s.tsz === imported.tsz);
    imported.uid = generateUid();
    imported.id_leíró = generateIdLeíró(imported.név, imported.tsz);
    if (match) {
      setOverlay('importConfirm', { karakter: imported, matchUid: match.uid });
    } else {
      importKarakter(imported, false);
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [data]);
}
