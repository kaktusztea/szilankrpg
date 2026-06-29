import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildRubrikák, applySeb, applyGyógy, calcSérültFok } from './ep-logic';
import type { SebTípus } from './ep-logic';

const sebTípus = fc.constantFrom<SebTípus>('S', 'V', 'Z', 'FP');

describe('applySeb fuzz', () => {
  it('never exceeds total rubrika count', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 40 }),
      sebTípus,
      fc.integer({ min: 1, max: 20 }),
      (size, típus, érték) => {
        const rubrikák = buildRubrikák([], size);
        const result = applySeb(rubrikák, típus, érték);
        expect(result).toHaveLength(size);
        const filled = result.filter(r => r.típus !== '').length;
        expect(filled).toBeLessThanOrEqual(size);
      }
    ), { numRuns: 200 });
  });

  it('filled count increases or stays same', () => {
    fc.assert(fc.property(
      fc.integer({ min: 3, max: 20 }),
      sebTípus,
      fc.integer({ min: 1, max: 5 }),
      (size, típus, érték) => {
        const rubrikák = buildRubrikák([], size);
        const before = rubrikák.filter(r => r.típus !== '').length;
        const result = applySeb(rubrikák, típus, érték);
        const after = result.filter(r => r.típus !== '').length;
        expect(after).toBeGreaterThanOrEqual(before);
      }
    ), { numRuns: 100 });
  });
});

describe('applyGyógy fuzz', () => {
  it('never produces negative filled count', () => {
    fc.assert(fc.property(
      fc.integer({ min: 3, max: 20 }),
      fc.integer({ min: 1, max: 10 }),
      fc.constantFrom<'FP' | 'ÉP'>('FP', 'ÉP'),
      fc.integer({ min: 1, max: 20 }),
      (size, sebCount, típusSzűrő, gyógyÉrték) => {
        let rubrikák = buildRubrikák([], size);
        // Apply some damage first
        rubrikák = applySeb(rubrikák, típusSzűrő === 'FP' ? 'FP' : 'S', Math.min(sebCount, size));
        const result = applyGyógy(rubrikák, típusSzűrő, gyógyÉrték);
        expect(result).toHaveLength(size);
        expect(result.filter(r => r.típus !== '').length).toBeGreaterThanOrEqual(0);
      }
    ), { numRuns: 200 });
  });

  it('healed count does not exceed original damage count', () => {
    fc.assert(fc.property(
      fc.integer({ min: 5, max: 20 }),
      fc.integer({ min: 1, max: 5 }),
      fc.integer({ min: 1, max: 10 }),
      (size, sebCount, gyógyÉrték) => {
        let rubrikák = buildRubrikák([], size);
        rubrikák = applySeb(rubrikák, 'S', sebCount);
        const damageBefore = rubrikák.filter(r => r.típus !== '').length;
        const result = applyGyógy(rubrikák, 'ÉP', gyógyÉrték);
        const damageAfter = result.filter(r => r.típus !== '').length;
        const healed = damageBefore - damageAfter;
        expect(healed).toBeLessThanOrEqual(Math.min(gyógyÉrték, damageBefore));
      }
    ), { numRuns: 100 });
  });
});

describe('calcSérültFok fuzz', () => {
  it('always returns 0, 1, or 2', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 100 }),
      fc.integer({ min: 1, max: 20 }),
      (sebCount, oszlopMéret) => {
        const result = calcSérültFok(sebCount, oszlopMéret);
        expect([0, 1, 2]).toContain(result);
      }
    ), { numRuns: 200 });
  });

  it('is monotonically non-decreasing with sebCount', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 10 }),
      fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 2, maxLength: 10 }),
      (oszlopMéret, counts) => {
        const sorted = [...counts].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          expect(calcSérültFok(sorted[i], oszlopMéret))
            .toBeGreaterThanOrEqual(calcSérültFok(sorted[i - 1], oszlopMéret));
        }
      }
    ), { numRuns: 100 });
  });
});
