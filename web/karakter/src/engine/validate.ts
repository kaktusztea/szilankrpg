import type { Karakter } from './types';
import type { GameData } from './data-loader';

/** Required top-level fields in a Karakter object. */
const REQUIRED_TOP_FIELDS = [
  'schema_version', 'uid', 'id_leíró', 'név', 'becenév', 'jk', 'játékos', 'mentés_dátum',
  'tsz', 'leírás', 'kor', 'anyanyelv', 'vallás', 'tulajdonságok',
  'HM_TÉ', 'HM_VÉ', 'CM', 'képzettségek', 'fortélyok', 'fortélyok_speciális',
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
  if (k.schema_version !== 2) {
    missing.push('schema_version (≠ 2)');
  }

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

  const fortelyNevek = new Set(data.fortelySummaries.map(d => d.név));
  for (const f of k.fortélyok) {
    if (!fortelyNevek.has(f.név)) {
      errors.push(`Ismeretlen fortély: "${f.név}"`);
    }
  }

  const validKepNames = new Set(data.kepzettsegDefs.map(d => d.név));
  for (const d of data.kepzettsegDefs) {
    if (d.többszörös) for (const alnév of d.többszörös) validKepNames.add(alnév);
  }
  const validKepPrefixes = data.kepzettsegDefs.filter(d => d.többszörös.length === 0 && d.csoport === 'misztikus').map(d => d.név + ': ');
  for (const d of data.kepzettsegDefs) {
    if (d.többszörös.length > 0 && d.többszörös[0] === '*') validKepPrefixes.push(d.név + ': ');
  }
  for (const kep of k.képzettségek) {
    if (!validKepNames.has(kep.név) && !validKepPrefixes.some(p => kep.név.startsWith(p))) {
      errors.push(`Ismeretlen képzettség: "${kep.név}"`);
    }
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
      const found = data.fegyverek.some(fd => fd.Fegyver.toLowerCase() === f.alap.toLowerCase());
      if (!found) errors.push(`Ismeretlen fegyver alaptípus: "${f.alap}"`);
    }
  }

  return errors.length > 0 ? errors.join('; ') : null;
}
