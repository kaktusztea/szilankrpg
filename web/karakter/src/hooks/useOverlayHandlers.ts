import { useState } from 'react';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from '../engine/types';
import type { GameData } from '../engine/data-loader';
import { validateKarakterData } from '../engine/validate';
import { generateUid, generateIdLeíró } from '../engine/file-ops';
import { encodeKarakterUrl, decodeKarakterFromHash, extractHashFromText } from '../engine/url-share';
import { isSlotFull, readSlots, upsertSlotEntry } from './slot-utils';
import { njkLimitBlocked } from './njk-slots';
import type { OverlayState } from '../components/AppOverlays';

interface Deps {
  state: OverlayState;
  set: <K extends keyof OverlayState>(key: K, value: OverlayState[K]) => void;
  data: GameData;
  karakter: Karakter;
  isDirty: boolean;
  activateKarakter: (k: Karakter, undo?: any[]) => void;
  deleteSlot: (uid: string) => void;
}

/**
 * Az `AppOverlays` akció-logikája (karakter létrehozás/betöltés/import/törlés, QR, teszt karakter).
 * Külön a renderelésről: az overlay komponens így csak a megjelenítést kapcsolja.
 */
export function useOverlayHandlers({ state: s, set, data, karakter, isDirty, activateKarakter, deleteSlot }: Deps) {
  const [qrPopup, setQrPopup] = useState<{ url: string; név: string; tsz: number } | null>(null);

  const handleQrCode = (uid: string) => {
    const charData = localStorage.getItem(`szilank_char_${uid}`);
    if (!charData) return;
    try {
      const parsed = JSON.parse(charData) as Karakter;
      setQrPopup({ url: encodeKarakterUrl(parsed), név: parsed.becenév || parsed.név || 'Névtelen', tsz: parsed.tsz });
    } catch {
      set('toast', { msg: 'Hiba a QR kód generálásakor.', type: 'error' });
    }
  };

  const handleSlotDelete = () => {
    deleteSlot(s.slotDeleteTarget!.uid);
    set('slotDeleteTarget', null);
  };

  const handleNewChar = () => {
    const uid = generateUid();
    activateKarakter({ ...data.emptyKarakter, uid, id_leíró: generateIdLeíró('', data.emptyKarakter.tsz) });
    set('showNewConfirm', false);
  };

  const handleSlotLoad = (k: Karakter, undo: any[]) => {
    activateKarakter(k, undo);
    set('showSlotList', false);
  };

  const loadTestKarakter = () => {
    const refErr = validateKarakterData(data.testKarakter, data);
    if (refErr) { set('showTestConfirm', false); set('loadError', `Teszt karakter hiba: ${refErr}`); return; }
    activateKarakter({
      ...data.testKarakter,
      uid: data.testKarakter.uid || generateUid(),
      id_leíró: data.testKarakter.id_leíró || generateIdLeíró(data.testKarakter.név, data.testKarakter.tsz),
      előtörténet: { ...DEFAULT_ELOTORTENET, ...data.testKarakter.előtörténet },
      session: { ...DEFAULT_SESSION, ...data.testKarakter.session },
    });
    set('showTestConfirm', false);
  };

  /** Teszt karakter gomb: ha már aktív → alapállapotba, egyébként megerősítés (ha van mit veszíteni). */
  const handleTestBtn = () => {
    const testUid = data.testKarakter.uid;
    set('showSlotList', false);
    if (testUid && karakter?.uid === testUid) {
      loadTestKarakter();
      set('toast', { msg: 'Teszt karakter alapállapotba állítva', type: 'success' });
    } else if (!isDirty) {
      loadTestKarakter();     // érintetlen üres karakter → nincs mit elveszíteni
    } else {
      set('showTestConfirm', true);
    }
  };

  /** Vágólap import: teljes URL vagy önálló hash. */
  const handleClipboardImport = (text: string) => {
    const hash = extractHashFromText(text);
    if (!hash) {
      set('toast', { msg: 'A vágólap nem tartalmaz karakter linket.', type: 'error' });
      return;
    }

    const result = decodeKarakterFromHash(hash);
    if ('error' in result) {
      set('toast', { msg: result.error, type: 'error' });
      return;
    }

    const k = {
      ...result.karakter,
      uid: generateUid(),
      id_leíró: generateIdLeíró(result.karakter.név, result.karakter.tsz),
      mentés_dátum: '',
    };

    // Név + TSz egyezés → a user döntsön (felülírás / új példány)
    const match = readSlots().find(sl => sl.név === k.név && sl.tsz === k.tsz);
    if (match) {
      set('importConfirm', { karakter: k, matchUid: match.uid });
      return;
    }
    if (isSlotFull()) { set('showSlotList', false); set('slotLimit', 'total'); return; }
    if (njkLimitBlocked(k.jk)) { set('showSlotList', false); set('slotLimit', 'njk'); return; }

    activateKarakter(k);
    upsertSlotEntry(k);   // azonnal látszódjon a Karakterek hubban (ne az autosave-re várjon)
    set('toast', { msg: `Karakter importálva: ${k.név} (${k.tsz}sz)`, type: 'success' });
  };

  return {
    qrPopup, setQrPopup,
    handleQrCode, handleSlotDelete, handleNewChar, handleSlotLoad,
    loadTestKarakter, handleTestBtn, handleClipboardImport,
  };
}
