import { describe, expect, it } from 'vitest';
import {
  getRecommendedTask,
  getTopicMastery,
  getWeakestTopic,
  interactivePracticeTasks,
} from '@/lib/practice';

describe('学习路径推荐', () => {
  it('空完成集推荐第一课', () => {
    const rec = getRecommendedTask(new Set());
    expect(rec?.id).toBe('git-init');
  });

  it('完成后沿任务链推进', () => {
    const rec = getRecommendedTask(new Set(['git-init', 'git-status', 'git-add']));
    expect(rec?.id).toBe('git-commit');
  });

  it('前置未完成时回溯到最早缺口', () => {
    // 跳着做了几课，但 merge-branch 的前置 create-branch 没做
    const completed = new Set(['git-init', 'git-status', 'git-add', 'git-commit', 'git-log', 'git-clone', 'merge-branch']);
    const rec = getRecommendedTask(completed);
    // merge-branch 本身已完成，但它的前置链里 create-branch 未完成
    // 章节顺序 core-basics 完毕后进入 core-branches：create-branch 未完成
    expect(rec?.id).toBe('create-branch');
  });

  it('全部完成返回 null', () => {
    const all = new Set(interactivePracticeTasks.map((t) => t.id));
    expect(getRecommendedTask(all)).toBeNull();
  });

  it('主题掌握度统计正确', () => {
    const completed = new Set(['git-init', 'git-status']);
    const mastery = getTopicMastery(completed);
    const basics = mastery.find((m) => m.topic === '基础命令');
    expect(basics?.done).toBe(2);
    expect(basics?.total).toBeGreaterThanOrEqual(6);
  });

  it('薄弱主题推荐指向该主题的未完成练习', () => {
    // 基础命令全做完，分支协作未动 → 薄弱项应是分支协作
    const completed = new Set(['git-init', 'git-status', 'git-add', 'git-commit', 'git-log', 'git-clone']);
    const weak = getWeakestTopic(completed);
    expect(weak?.topic).toBe('分支协作');
    expect(weak?.nextTask?.id).toBe('create-branch');
  });

  it('全掌握时无薄弱主题', () => {
    const all = new Set(interactivePracticeTasks.map((t) => t.id));
    expect(getWeakestTopic(all)).toBeNull();
  });
});
