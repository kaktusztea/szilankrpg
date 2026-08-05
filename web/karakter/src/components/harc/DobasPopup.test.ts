import { describe, it, expect } from 'vitest';
import { pushDobás } from './DobasPopup';

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
