import type { Karakter, StoredKarakter } from './types';
import type { GameData } from './data-loader';
import { DEFAULT_SESSION, DEFAULT_ELOTORTENET } from './types';
import { validateKarakter, validateKarakterData } from './validate';
import { sanitizeUndo } from '../hooks/useUndo';
import { readSlots } from '../hooks/slot-utils';
import { MAX_NÉV, MAX_BECENÉV } from '../ui-constants';

function generateUid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateIdLeíró(név: string, tsz: number): string {
  const slug = (név || 'új-karakter').toLowerCase().replace(/\s+/g, '-');
  return `${slug}-${tsz}tsz`;
}

export function duplicateKarakter(karakter: Karakter): Karakter {
  const newUid = generateUid();
  const slots = readSlots();
  const { név, becenév } = nextDuplicateNamePair(
    karakter.név || 'Névtelen',
    karakter.becenév || '',
    slots.map(s => s.név),
    slots.map(s => s.becenév || ''),
  );
  return { ...structuredClone(karakter), uid: newUid, név, becenév, id_leíró: generateIdLeíró(név, karakter.tsz) };
}

// Duplikált név+becenév pár közös, szinkronban tartott verziószámmal.
// A közös verziószám (" N" suffix, "v" nélkül) a két forrás-verzió és a slotokban már meglévő
// azonos bázisú verziók maximumát lépteti: ha az egyikben van szám a másikban nincs, vagy
// eltérnek, a nagyobb érték nyer, +1. A becenevet csak akkor verziózzuk, ha van (üres marad).
export function nextDuplicateNamePair(
  srcNév: string, srcBecenév: string, existingNames: string[], existingBecenevek: string[],
): { név: string; becenév: string } {
  const névBase = parseVersion(srcNév).base;
  const hasBecenév = srcBecenév.length > 0;
  const becenévBase = hasBecenév ? parseVersion(srcBecenév).base : '';

  const forrásVer = Math.max(
    parseVersion(srcNév).ver,
    hasBecenév ? parseVersion(srcBecenév).ver : 1,
    maxExistingVersion(névBase, existingNames),
    hasBecenév ? maxExistingVersion(becenévBase, existingBecenevek) : 1,
  );
  const newVer = forrásVer + 1;

  return {
    név: buildVersionedName(névBase, newVer, MAX_NÉV),
    becenév: hasBecenév ? buildVersionedName(becenévBase, newVer, MAX_BECENÉV) : '',
  };
}

// Splits a name into its base and version: "Példa 3" → { base: "Példa", ver: 3 }.
// A name with no trailing " N" suffix counts as version 1.
function parseVersion(name: string): { base: string; ver: number } {
  const m = name.match(/^(.+) (\d+)$/);
  return m ? { base: m[1], ver: parseInt(m[2]) } : { base: name, ver: 1 };
}

// Highest existing "<base> N" version among names (base with no suffix counts as v1).
function maxExistingVersion(base: string, names: string[]): number {
  const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${esc} (\\d+)$`);
  let maxV = 1;
  for (const n of names) {
    const m = (n || '').match(re);
    if (m) maxV = Math.max(maxV, parseInt(m[1]));
  }
  return maxV;
}

// Builds "<base> N" (no "v" prefix — the number alone marks the version).
// If maxLen is given and it would exceed it, the base is truncated (trimming trailing
// whitespace) so that " N" still fits.
function buildVersionedName(base: string, ver: number, maxLen?: number): string {
  const suffix = ` ${ver}`;
  let trimmedBase = base;
  if (maxLen !== undefined && trimmedBase.length + suffix.length > maxLen) {
    // ponytail: truncation may collide with an existing truncated name at the same version
    // (extreme edge — needs two ~40-char names sharing a prefix). Ceiling: rare with a
    // 16-slot cap; upgrade path = re-scan uniqueness against the truncated base if it bites.
    trimmedBase = trimmedBase.slice(0, maxLen - suffix.length).trimEnd();
  }
  return `${trimmedBase}${suffix}`;
}

// Compute the next "<base> N" name: strips any trailing " N" from src to get the base,
// then picks max(existing N for that base) + 1 (base with no suffix counts as v1 → min result is 2).
// If maxLen is given and "<base> N" would exceed it, the base is truncated so that " N" still fits.
export function nextDuplicateName(srcName: string, existingNames: string[], maxLen?: number): string {
  const base = parseVersion(srcName).base;
  return buildVersionedName(base, maxExistingVersion(base, existingNames) + 1, maxLen);
}

export function generateSaveFile(karakter: Karakter, undoStack: any[], mode: 'single' | 'backup'): { blob: Blob; filename: string } {
  const now = new Date();
  const dátum = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  let json: string;
  let filename: string;

  if (mode === 'single') {
    const saved: StoredKarakter = { ...karakter, mentés_dátum: dátum, _undo: undoStack };
    json = JSON.stringify(saved, null, 2);
    const charRaw = (karakter.becenév || karakter.név || 'karakter');
    const charAscii = charRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-zA-Z_-]/g, '').toLowerCase();
    const playerRaw = karakter.játékos || '';
    const playerAscii = playerRaw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-zA-Z_-]/g, '').toLowerCase();
    const namePart = playerAscii ? `${charAscii || 'karakter'}__${playerAscii}` : (charAscii || 'karakter');
    filename = `${namePart}_${karakter.tsz}tsz.json`;
  } else {
    const slots = readSlots();
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

export type LoadFileResult =
  | { type: 'single'; karakter: Karakter; undo: any[] }
  | { type: 'backup'; karakterek: { karakter: Karakter; undo: any[] }[]; dátum: string }
  | { error: string };

function isBackupFile(obj: unknown): obj is { szilánk_backup: true; karakterek: unknown[] } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o['szilánk_backup'] === true && Array.isArray(o['karakterek']);
}

function parseSingleKarakter(obj: unknown, data: GameData): { karakter: Karakter; undo: any[] } | { error: string } {
  const validation = validateKarakter(obj);
  if (!validation.valid) return { error: `Érvénytelen karakter — hiányzó mezők: ${validation.missing.join(', ')}` };
  const raw = obj as Record<string, any>;
  const refErr = validateKarakterData(raw as Karakter, data);
  if (refErr) return { error: `Referencia hiba: ${refErr}` };
  const karakter = { ...raw, uid: raw.uid || generateUid(), id_leíró: raw.id_leíró || generateIdLeíró(raw.név, raw.tsz), jk: raw.jk ?? true, előtörténet: { ...DEFAULT_ELOTORTENET, ...raw.előtörténet }, session: { ...DEFAULT_SESSION, ...raw.session } } as Karakter;
  return { karakter, undo: sanitizeUndo(raw._undo) };
}

export function loadKarakterFromFile(data: GameData): Promise<LoadFileResult> {
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

          // Backup file: array of characters
          if (isBackupFile(obj)) {
            const karakterek: { karakter: Karakter; undo: any[] }[] = [];
            const errors: string[] = [];
            for (let i = 0; i < obj.karakterek.length; i++) {
              const result = parseSingleKarakter(obj.karakterek[i], data);
              if ('error' in result) {
                errors.push(`#${i + 1}: ${result.error}`);
              } else {
                karakterek.push(result);
              }
            }
            if (karakterek.length === 0) {
              resolve({ error: errors.length > 0 ? `Backup üres vagy hibás: ${errors.join('; ')}` : 'A backup fájl nem tartalmaz karaktert.' });
              return;
            }
            const dátum = (obj as Record<string, unknown>)['dátum'] as string || '';
            resolve({ type: 'backup', karakterek, dátum });
            return;
          }

          // Single character file
          const result = parseSingleKarakter(obj, data);
          if ('error' in result) { resolve(result); return; }
          resolve({ type: 'single', ...result });
        } catch { resolve({ error: 'Nem sikerült betölteni a fájlt (hibás JSON).' }); }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

export { generateUid, generateIdLeíró };
