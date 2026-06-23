import type { Karakter } from './types';
import type { GameData } from './data-loader';

/** Validate minimal schema compliance */
export function validateKarakter(obj: unknown): obj is Karakter {
  if (!obj || typeof obj !== 'object') return false;
  const k = obj as Record<string, unknown>;
  return (
    k.schema_version === 2 &&
    typeof k.név === 'string' &&
    typeof k.tsz === 'number' &&
    typeof k.tulajdonságok === 'object' &&
    Array.isArray(k.képzettségek) &&
    Array.isArray(k.fortélyok) &&
    typeof k.fortélyok_speciális === 'object' &&
    typeof k.hátterek === 'object' &&
    Array.isArray(k.fegyverek) &&
    typeof k.páncél === 'object' &&
    Array.isArray(k.napló)
  );
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

  const validFegyverAnyag = new Set(['acél', 'bronz', 'abbitacél', 'mithrill', 'lunír']);
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
