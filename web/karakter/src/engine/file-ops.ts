import type { Karakter } from './types';
import type { GameData } from './data-loader';
import { DEFAULT_SESSION } from './types';
import { validateKarakter, validateKarakterData } from './validate';
import { sanitizeUndo } from '../hooks/useUndo';

function generateUid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateIdLeíró(név: string, tsz: number): string {
  const slug = (név || 'új-karakter').toLowerCase().replace(/\s+/g, '-');
  return `${slug}-${tsz}tsz`;
}

export function duplicateKarakter(karakter: Karakter): Karakter {
  const bumpSuffix = (s: string) => {
    const m = s.match(/^(.+) v(\d+)$/);
    return m ? `${m[1]} v${parseInt(m[2]) + 1}` : `${s} v2`;
  };
  const newUid = generateUid();
  const newNév = bumpSuffix(karakter.név || 'Névtelen');
  return { ...structuredClone(karakter), uid: newUid, név: newNév, id_leíró: generateIdLeíró(newNév, karakter.tsz) };
}

export function generateSaveFile(karakter: Karakter, undoStack: any[], mode: 'single' | 'backup'): { blob: Blob; filename: string } {
  const now = new Date();
  const dátum = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  let json: string;
  let filename: string;

  if (mode === 'single') {
    const saved = { ...karakter, mentés_dátum: dátum, _undo: undoStack } as any;
    json = JSON.stringify(saved, null, 2);
    const firstName = (karakter.név || 'karakter').split(' ')[0].slice(0, 20);
    const charAscii = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const playerFirst = karakter.játékos ? karakter.játékos.split(' ')[0].slice(0, 20) : '';
    const playerAscii = playerFirst.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
    const namePart = playerAscii ? `${charAscii || 'karakter'}_${playerAscii}` : (charAscii || 'karakter');
    filename = `${namePart}_${karakter.tsz}tsz.json`;
  } else {
    let slots: { uid: string }[] = [];
    try { slots = JSON.parse(localStorage.getItem('szilank_slots') || '[]'); } catch { /* */ }
    const karakterek = slots.map(s => {
      try { return JSON.parse(localStorage.getItem(`szilank_char_${s.uid}`) || 'null'); } catch { return null; }
    }).filter(Boolean);
    const backup = { szilánk_backup: true, verzió: 1, dátum: now.toISOString(), karakterek };
    json = JSON.stringify(backup, null, 2);
    filename = `szilank_backup_${now.toISOString().slice(0, 10)}.json`;
  }

  return { blob: new Blob([json], { type: 'application/json' }), filename };
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/json' });
  try { await navigator.share({ files: [file] }); } catch { /* */ }
}

export function loadKarakterFromFile(data: GameData): Promise<{ karakter: Karakter; undo: any[] } | { error: string }> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result as string);
          if (!validateKarakter(obj)) { resolve({ error: 'Érvénytelen karakter json állomány.' }); return; }
          const refErr = validateKarakterData(obj, data);
          if (refErr) { resolve({ error: `Referencia hiba: ${refErr}` }); return; }
          const karakter = { ...obj, uid: obj.uid || generateUid(), id_leíró: obj.id_leíró || generateIdLeíró(obj.név, obj.tsz), session: { ...DEFAULT_SESSION, ...obj.session } } as Karakter;
          resolve({ karakter, undo: sanitizeUndo((obj as any)._undo) });
        } catch { resolve({ error: 'Nem sikerült betölteni a fájlt (hibás JSON).' }); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export { generateUid, generateIdLeíró };
