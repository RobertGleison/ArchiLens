import { describe, expect, it } from 'vitest';
import { joinIds } from './ids';

describe('joinIds', () => {
  it('joins set ids with spaces and returns undefined when none are set', () => {
    expect(joinIds('a', undefined, false, 'b')).toBe('a b');
    expect(joinIds(undefined, null, false, '')).toBeUndefined();
  });
});
