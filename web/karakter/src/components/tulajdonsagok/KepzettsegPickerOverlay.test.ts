import { describe, it, expect } from 'vitest';
import { pickerOpcióDef } from './KepzettsegPickerOverlay';
import { getAvailableNames } from './helpers';
import { TRADÍCIÓ_ID } from '../../engine/azonosito';
import { loadGameDataSync } from '../../__tests__/load-gamedata';

const data = loadGameDataSync();
const defs = data.kepzettsegDefs;

describe('pickerOpcióDef (Új képzettség picker: per-row details)', () => {
  it('resolves the four id-based option shapes', () => {
    const egyszeru = defs.find(d => d.többszörös.length === 0 && d.id !== TRADÍCIÓ_ID)!;
    expect(pickerOpcióDef(egyszeru.id, defs)?.id).toBe(egyszeru.id);
    const tobbszoros = defs.find(d => d.többszörös.length > 0 && d.többszörös[0] !== '*')!;
    expect(pickerOpcióDef(`${tobbszoros.id}/valami`, defs)?.id).toBe(tobbszoros.id);
    const prompt = defs.find(d => d.többszörös[0] === '*');
    if (prompt) expect(pickerOpcióDef(`__prompt:${prompt.id}`, defs)?.id).toBe(prompt.id);
    expect(pickerOpcióDef('__tradicio', defs)?.id).toBe(TRADÍCIÓ_ID);
  });

  it('every option offered by getAvailableNames has a def (guards against a silent id/name mismatch)', () => {
    const byGroup = new Map<string, typeof defs>();
    for (const d of defs) byGroup.set(d.csoport, [...(byGroup.get(d.csoport) ?? []), d]);
    for (const csoport of byGroup.keys()) {
      for (const opt of getAvailableNames(csoport, [], byGroup)) {
        expect(pickerOpcióDef(opt.value, defs), opt.value).toBeDefined();
      }
    }
  });
});
