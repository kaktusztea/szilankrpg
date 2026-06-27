import { useState, useEffect } from 'react';
import { loadGameData } from '../engine/data-loader';
import type { GameData } from '../engine/data-loader';
import type { Karakter } from '../engine/types';
import { DEFAULT_SESSION } from '../engine/types';
import { validateKarakter, validateKarakterData } from '../engine/validate';
import { generateUid, generateIdLeíró } from '../engine/file-ops';

/**
 * Loads GameData, validates emptyKarakter, migrates legacy localStorage,
 * and initializes the karakter from localStorage or defaults.
 */
export function useGameDataLoader() {
  const [data, setData] = useState<GameData | null>(null);
  const [error, setError] = useState('');
  const [initialKarakter, setInitialKarakter] = useState<Karakter | null>(null);
  const [initialDirty, setInitialDirty] = useState(false);

  useEffect(() => {
    loadGameData().then(d => {
      setData(d);
      if (!validateKarakter(d.emptyKarakter)) {
        setError('Az empty_karakter.json érvénytelen (schema_version !== 2 vagy hiányzó mezők). Ellenőrizd a data/karakter/empty_karakter.json fájlt.');
        return;
      }
      const refErr = validateKarakterData(d.emptyKarakter, d);
      if (refErr) {
        setError(`empty_karakter.json referencia hiba: ${refErr}`);
        return;
      }

      // Migráció: régi single-key → multi-slot
      const saved = localStorage.getItem('szilank_karakter');
      if (saved && !localStorage.getItem('szilank_slots')) {
        try {
          const parsed = JSON.parse(saved);
          if (validateKarakter(parsed)) {
            const uid = parsed.uid || ((parsed as any).id) || generateUid();
            const migrated = { ...parsed, uid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } };
            localStorage.setItem(`szilank_char_${uid}`, JSON.stringify(migrated));
            localStorage.setItem('szilank_slots', JSON.stringify([{ uid, id_leíró: migrated.id_leíró, név: migrated.név, tsz: migrated.tsz, mentés_dátum: new Date().toISOString() }]));
            localStorage.setItem('szilank_active', uid);
            localStorage.removeItem('szilank_karakter');
            localStorage.removeItem('szilank_undo');
            setInitialKarakter(migrated);
            setInitialDirty(true);
            return;
          }
        } catch { /* fall through */ }
      }

      // Multi-slot betöltés
      const activeUid = localStorage.getItem('szilank_active');
      if (activeUid) {
        const charData = localStorage.getItem(`szilank_char_${activeUid}`);
        if (charData) {
          try {
            const parsed = JSON.parse(charData);
            if (validateKarakter(parsed)) {
              setInitialKarakter({ ...parsed, uid: parsed.uid || activeUid, id_leíró: parsed.id_leíró || generateIdLeíró(parsed.név, parsed.tsz), session: { ...DEFAULT_SESSION, ...parsed.session } });
              setInitialDirty(true);
              return;
            }
          } catch { /* fall through */ }
        }
      }

      // Default: üres karakter
      setInitialKarakter({ ...d.emptyKarakter, uid: generateUid(), id_leíró: generateIdLeíró("", d.emptyKarakter.tsz) });
    }).catch(e => setError(`Betöltési hiba: ${String(e)}`));
  }, []);

  return { data, error, initialKarakter, initialDirty };
}
