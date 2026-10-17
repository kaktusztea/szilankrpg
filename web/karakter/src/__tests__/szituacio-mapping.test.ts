import { describe, it, expect } from 'vitest';
import { loadGameDataSync } from './load-gamedata';

/** szituacio_mapping (2026-10-17): fortély-kulcs + harcmodor-elem kulcs a generált táblákban. */
describe('kapcsolódó szituációk', () => {
  const data = loadGameDataSync();
  it('fortély: Úszás → Víz alatt bírni', () => {
    expect(data.fortelySummaries.find(f => f.id === 'úszás')?.kapcsolódó_szituációk?.map(s => s.név)).toEqual(['Víz alatt bírni']);
  });
  it('harcmodor-elem: Közelharc → Belharc folyamata (elemenként)', () => {
    const hm = data.kepzettsegDefs.find(d => d.id === 'harcmodor')!;
    expect(hm.kapcsolódó_szituációk_elem?.['közelharc']?.map(s => s.név)).toEqual(['Belharc folyamata']);
  });
});
