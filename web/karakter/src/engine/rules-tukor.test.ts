import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evalFormula } from './reactive-parse';
import type { Context, ArrayContext, StringContext } from './reactive';
import { manőverPontKéplet } from '../components/aktiv/manover-dobas-calc';

/**
 * Drift-őr: a reactive rules.json formulájából számolt kézi TS pure képletek (páncél_lefedettség,
 * manőver_pont) ne szakadjanak el a szabálytól. Ha valaki a rules.json formuláját módosítja, de a
 * TS-másolatot nem (vagy fordítva), ez a teszt bukik. (A TS-másolat tudatos: a hívó kód nem épít
 * reactive kontextust - l. a ponytail: megjegyzéseket a két képletnél.)
 */

interface Rule { id: string; formula: string }
const RULES: Rule[] = (JSON.parse(
  readFileSync(resolve(__dirname, '../../../../data/rules.json'), 'utf-8'),
) as { rules: Rule[] }).rules;

function formula(id: string): string {
  const r = RULES.find(x => x.id === id);
  if (!r) throw new Error(`Hiányzó rules.json szabály: ${id}`);
  return r.formula;
}

/** A formula kiértékelése adott skalár inputokkal (nincs array/string/results kontextus). */
function evalWith(f: string, inputs: Record<string, number>): number {
  const ctx: Context = new Map(Object.entries(inputs));
  return evalFormula(f, ctx, new Map<string, number>(), new Map() as ArrayContext, new Map() as StringContext);
}

/** A páncél_lefedettség TS pure megfelelője input-alakban (a felszereles.ts belső képletével azonos). */
function páncélLefedettségKéplet(van: boolean, végtag: number, sisak: boolean): number {
  return van ? 50 + végtag * 10 + (sisak ? 10 : 0) : 0;
}

describe('rules.json ↔ TS pure képlet tükör', () => {
  it('manőver_pont: ceil(harcmodor_összeg * 2 / tsz)', () => {
    const f = formula('manőver_pont');
    for (const harcmodor_összeg of [0, 7, 12, 25, 40]) {
      for (const tsz of [1, 3, 5, 10]) {
        expect(manőverPontKéplet(harcmodor_összeg, tsz))
          .toBe(evalWith(f, { harcmodor_összeg, tsz }));
      }
    }
  });

  it('páncél_lefedettség: if(páncél_van, 50 + végtag*10 + sisak*10, 0)', () => {
    const f = formula('páncél_lefedettség');
    for (const páncél_van of [0, 1]) {
      for (const páncél_végtagvédettség of [0, 1, 2, 3, 4]) {
        for (const páncél_sisak of [0, 1]) {
          expect(páncélLefedettségKéplet(!!páncél_van, páncél_végtagvédettség, !!páncél_sisak))
            .toBe(evalWith(f, { páncél_van, páncél_végtagvédettség, páncél_sisak }));
        }
      }
    }
  });
});
