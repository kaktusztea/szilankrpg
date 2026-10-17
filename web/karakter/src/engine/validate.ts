import type { Karakter } from './types';
import type { GameData } from './data-loader';
import { EGYEDI_FORTÉLY_ID, TRADÍCIÓ_ID, képzKulcs } from './azonosito';

/**
 * Az aktuális karakter-séma verzió. 3: fortély/képzettség `{id, elem}` (2026-10-17).
 * Eltérő verzió NEM tölthető be - konverzió (még) nincs; ha lesz, a `sémaVerzióHiba` hívóinál kell bekötni.
 */
export const KARAKTER_SÉMA_VERZIÓ = 3;

/**
 * Hibaüzenet, ha a betöltendő karakter sémaverziója (szám) nem az aktuális; egyébként null.
 * Hiányzó / nem szám verzió = sérült adat, nem „elavult" → a hívó a szokásos érvénytelen-ágon kezeli.
 */
export function sémaVerzióHiba(verzió: unknown): string | null {
  if (typeof verzió !== 'number' || verzió === KARAKTER_SÉMA_VERZIÓ) return null;
  return `Betöltendő karakter séma verzió: v${verzió}\nAktuális verzió: v${KARAKTER_SÉMA_VERZIÓ}\nElavult verzió, kreáld újra a karaktert.`;
}

/** Required top-level fields in a Karakter object. */
const REQUIRED_TOP_FIELDS = [
  'schema_version', 'uid', 'id_leíró', 'név', 'becenév', 'jk', 'játékos', 'mentés_dátum',
  'tsz', 'leírás', 'kor', 'anyanyelv', 'vallás', 'tulajdonságok',
  'HM_TÉ', 'HM_VÉ', 'CM', 'képzettségek', 'fortélyok',
  'hátterek', 'fegyverek', 'távfegyverek', 'páncél', 'pajzs', 'felszerelés',
  'előtörténet', 'jegyzetek', 'napló', 'checkpoints', 'session',
] as const;

/** Required session fields. */
const REQUIRED_SESSION_FIELDS = [
  'szilánk', 'vé_csökkenés', 'vé_history', 'manőver_pont_használt', 'sebzések',
  'aktív_fegyver_index', 'aktív_fegyver_bal_index', 'kétkezes_harc',
  'aktív_pajzs', 'aktív_páncél', 'aktív_taktikák', 'aktív_helyzetek',
  'aktív_manőver', 'aktív_státuszok', 'narratív_módosítók', 'harci_akrobatika',
  'fegyverfogás', 'aktív_távfegyver_index', 'ké_dobások', 'té_dobások',
] as const;

/** Validate strict schema compliance. Returns missing fields list or null if valid. */
export function validateKarakter(obj: unknown): { valid: true } | { valid: false; missing: string[] } {
  if (!obj || typeof obj !== 'object') return { valid: false, missing: ['(not an object)'] };
  const k = obj as Record<string, unknown>;

  const missing: string[] = [];

  // Check schema_version first
  // Eltérő sémaverzió: a mező-lista értelmetlen (más alak) → csak a verzió-hiba (l. sémaVerzióHiba).
  const vHiba = sémaVerzióHiba(k.schema_version);
  if (vHiba) return { valid: false, missing: [vHiba] };

  // Top-level fields
  for (const field of REQUIRED_TOP_FIELDS) {
    if (!(field in k)) missing.push(field);
  }

  // Session fields
  if (k.session && typeof k.session === 'object') {
    const s = k.session as Record<string, unknown>;
    for (const field of REQUIRED_SESSION_FIELDS) {
      if (!(field in s)) missing.push(`session.${field}`);
    }
  }

  return missing.length === 0 ? { valid: true } : { valid: false, missing };
}

/** Type guard shortcut for simple boolean checks. */
export function isValidKarakter(obj: unknown): obj is Karakter {
  return validateKarakter(obj).valid;
}

/** Validate referential integrity against loaded tables. Returns error message or null. */
export function validateKarakterData(k: Karakter, data: GameData): string | null {
  const errors: string[] = [];

  if (k.hátterek.faj && !data.fajNevek.includes(k.hátterek.faj)) {
    errors.push(`Ismeretlen faj: "${k.hátterek.faj}"`);
  }

  const nyelvNevek = new Set(data.nyelvek.map(n => n.név));
  if (k.anyanyelv && !nyelvNevek.has(k.anyanyelv)) {
    errors.push(`Ismeretlen anyanyelv: "${k.anyanyelv}"`);
  }

  const fortelyIdk = new Set(data.fortelySummaries.map(d => d.id));
  for (const f of k.fortélyok) {
    if (f.id !== EGYEDI_FORTÉLY_ID && !fortelyIdk.has(f.id)) errors.push(`Ismeretlen fortély: "${f.id}"`);
  }

  // Képzettség: létező id; többszörösnél az elem a def listájából (harcmodor: kisbetűs elem) vagy szabad szöveg ('*').
  for (const kep of k.képzettségek) {
    const def = data.kepzettsegDefs.find(d => d.id === kep.id);
    const szabad = def && (def.többszörös[0] === '*' || def.id === TRADÍCIÓ_ID);
    const elemOk = !kep.elem ? (def?.többszörös.length ?? 0) === 0 || def?.id === TRADÍCIÓ_ID
      : szabad || !!def?.többszörös.some(n => n.toLowerCase() === kep.elem);
    if (!def || !elemOk) errors.push(`Ismeretlen képzettség: "${képzKulcs(kep)}"`);
  }

  const validKidolgozottság = new Set(Object.keys(data.konstansok.páncél_csatolt_tag_mgt.merevvért_fém));
  const validMéret = new Set(['passzol', 'nem passzol', 'borzalmas']);
  const validAnyag = new Set(['', ...data.konstansok.páncél_fémalapanyagok.map(a => a.anyag)]);
  const validStruktúra = new Set(['', ...data.konstansok.páncél_struktúrák.map(s => s.struktúra)]);

  if (k.páncél.alap && !validStruktúra.has(k.páncél.alap)) {
    errors.push(`Ismeretlen páncél struktúra: "${k.páncél.alap}"`);
  }
  if (k.páncél.kidolgozottság && !validKidolgozottság.has(k.páncél.kidolgozottság)) {
    errors.push(`Ismeretlen kidolgozottság: "${k.páncél.kidolgozottság}"`);
  }
  if (k.páncél.méret_illeszkedés && !validMéret.has(k.páncél.méret_illeszkedés)) {
    errors.push(`Ismeretlen méret_illeszkedés: "${k.páncél.méret_illeszkedés}"`);
  }
  if (k.páncél.fémalapanyag && !validAnyag.has(k.páncél.fémalapanyag)) {
    errors.push(`Ismeretlen fémalapanyag: "${k.páncél.fémalapanyag}"`);
  }

  const validFegyverAnyag = new Set(data.konstansok.fegyver_anyagok as string[]);
  for (const f of k.fegyverek) {
    if (f.anyag && !validFegyverAnyag.has(f.anyag)) {
      errors.push(`Ismeretlen fegyver anyag: "${f.anyag}"`);
    }
    if (f.alap) {
      const found = data.fegyverek.some(fd => fd.név.toLowerCase() === f.alap.toLowerCase());
      if (!found) errors.push(`Ismeretlen fegyver alaptípus: "${f.alap}"`);
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}
