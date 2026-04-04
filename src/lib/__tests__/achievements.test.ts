import { describe, expect, it } from 'vitest';
import { checkNewAchievements } from '@/lib/achievements';
import { interactivePracticeTasks } from '@/lib/practice';

describe('achievements', () => {
  it('unlocks the first-init achievement', () => {
    const achievements = checkNewAchievements(new Set(['git-init']), []);

    expect(achievements.map((item) => item.id)).toContain('first-init');
  });

  it('unlocks all-done after completing all interactive tasks', () => {
    const completed = new Set(interactivePracticeTasks.map((task) => task.id));
    const achievements = checkNewAchievements(completed, []);

    expect(achievements.map((item) => item.id)).toContain('all-done');
  });
});
