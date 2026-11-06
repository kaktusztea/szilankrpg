import { describe, it, expect } from 'vitest';
import { kompaktTartalmazza } from './KeziBonuszBtn';

describe('KeziBonuszBtn - nézet-választó logika', () => {
  it('a kompakt grid értékei (és 0) kompaktban nyílnak', () => {
    for (const v of [-9, -6, -3, 0, 3, 6, 9]) {
      expect(kompaktTartalmazza(v)).toBe(true);
    }
  });

  it('a kompaktban nem szereplő érték → részletes nézet nyílik', () => {
    for (const v of [-10, -8, -5, -1, 1, 5, 10]) {
      expect(kompaktTartalmazza(v)).toBe(false);
    }
  });
});
