import { describe, expect, it } from 'vitest';
import {
  getLocalDateString,
  getPreviousLocalDateString,
  getUpdatedStreak,
  loadCompletedFromStorage,
  loadStreakFromStorage,
} from '@/lib/usePracticeProgress';

describe('practice progress utilities', () => {
  it('formats local dates consistently', () => {
    const date = new Date('2026-03-25T10:00:00');

    expect(getLocalDateString(date)).toBe('2026-03-25');
    expect(getPreviousLocalDateString(date)).toBe('2026-03-24');
  });

  it('increments the streak on consecutive days', () => {
    const next = getUpdatedStreak(
      { count: 2, lastDate: '2026-03-24' },
      new Date('2026-03-25T10:00:00')
    );

    expect(next).toEqual({ count: 3, lastDate: '2026-03-25' });
  });

  it('sanitizes stored completed task ids', () => {
    const storage = {
      getItem: () => JSON.stringify({ completedTaskIds: ['git-init', 'invalid-id'] }),
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(Array.from(loadCompletedFromStorage(storage))).toEqual(['git-init']);
  });

  it('falls back to an empty streak when storage is invalid', () => {
    const storage = {
      getItem: () => '{',
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadStreakFromStorage(storage)).toEqual({ count: 0, lastDate: '' });
  });
});
