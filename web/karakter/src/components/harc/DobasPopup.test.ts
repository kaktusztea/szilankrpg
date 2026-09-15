import { describe, it, expect } from 'vitest';
import { pushDobás, pushTéDobás } from './DobasPopup';

describe('pushDobás', () => {
  it('prepends the newest result (newest first)', () => {
    expect(pushDobás([10], 25)).toEqual([25, 10]);
  });

  it('keeps at most 3 entries, dropping the oldest', () => {
    expect(pushDobás([3, 2, 1], 4)).toEqual([4, 3, 2]);
  });

  it('works from an empty stack', () => {
    expect(pushDobás([], 18)).toEqual([18]);
  });
});

describe('pushTéDobás', () => {
  it('prepends a TÉ-only entry (no sebzés followed)', () => {
    expect(pushTéDobás([{ té: 58 }], { té: 65 })).toEqual([{ té: 65 }, { té: 58 }]);
  });

  it('carries the SP value when sebzés followed', () => {
    expect(pushTéDobás([], { té: 67, sp: 12 })).toEqual([{ té: 67, sp: 12 }]);
  });

  it('keeps at most 3 entries, dropping the oldest', () => {
    const prev = [{ té: 65, sp: 9 }, { té: 58 }, { té: 67, sp: 12 }];
    expect(pushTéDobás(prev, { té: 70 })).toEqual([{ té: 70 }, { té: 65, sp: 9 }, { té: 58 }]);
  });
});
