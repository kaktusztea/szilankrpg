import { describe, it, expect } from 'vitest';
import type { Karakter, Session } from './types';
import { evaluateAlapesetek } from './alapeset';

type FortelyDef = Parameters<typeof evaluateAlapesetek>[0][number];

const session = {} as Session; // unused when aktívFeltételek is provided

function karakterWith(fortélyNevek: string[]): Karakter {
  return { fortélyok: fortélyNevek.map(név => ({ név, fok: 1 })) } as unknown as Karakter;
}

const defs: FortelyDef[] = [
  // hatás-only, no módosítók → always active (if not owned)
  { név: 'Éber', fokok: [{ fok: 0, hatás: ['Nem lephető meg'], módosítók: [] }] },
  // conditional módosító gated by feltétel
  { név: 'Hátbatámadás', fokok: [{ fok: 0, hatás: [], módosítók: [{ cél: 'TÉ', mód: 'flat', érték: 2, feltétel: 'harci_helyzet:hátulról' }] }] },
  // unconditional módosító (no feltétel)
  { név: 'Elszánt', fokok: [{ fok: 0, hatás: [], módosítók: [{ cél: 'VÉ', mód: 'flat', érték: 1 }] }] },
  // no fok-0 entry → never active
  { név: 'Nincs0', fokok: [{ fok: 1, hatás: ['x'], módosítók: [] }] },
];

describe('evaluateAlapesetek', () => {
  it('excludes fortélyok the character already owns', () => {
    const res = evaluateAlapesetek(defs, karakterWith(['Éber']), session, new Set());
    expect(res.find(r => r.fortély_név === 'Éber')).toBeUndefined();
  });

  it('includes hatás-only alapeset with empty módosítók', () => {
    const res = evaluateAlapesetek(defs, karakterWith([]), session, new Set());
    const éber = res.find(r => r.fortély_név === 'Éber');
    expect(éber).toBeDefined();
    expect(éber!.hatástext).toEqual(['Nem lephető meg']);
    expect(éber!.módosítók).toEqual([]);
  });

  it('activates a conditional módosító only when its feltétel is in the active set', () => {
    const active = evaluateAlapesetek(defs, karakterWith([]), session, new Set(['harci_helyzet:hátulról']));
    expect(active.find(r => r.fortély_név === 'Hátbatámadás')).toBeDefined();

    const inactive = evaluateAlapesetek(defs, karakterWith([]), session, new Set());
    expect(inactive.find(r => r.fortély_név === 'Hátbatámadás')).toBeUndefined();
  });

  it('always activates an unconditional módosító', () => {
    const res = evaluateAlapesetek(defs, karakterWith([]), session, new Set());
    expect(res.find(r => r.fortély_név === 'Elszánt')).toBeDefined();
  });

  it('ignores defs without a fok-0 entry', () => {
    const res = evaluateAlapesetek(defs, karakterWith([]), session, new Set());
    expect(res.find(r => r.fortély_név === 'Nincs0')).toBeUndefined();
  });
});
