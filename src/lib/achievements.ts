import { interactivePracticeTasks } from './practice';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const achievements: Achievement[] = [
  {
    id: 'first-init',
    title: '仓库初建',
    description: '完成第一个练习：初始化仓库',
    icon: '🪄',
  },
  {
    id: 'first-commit',
    title: '初次提交',
    description: '完成提交修改练习',
    icon: '✍️',
  },
  {
    id: 'first-branch',
    title: '分支新手',
    description: '完成创建分支练习',
    icon: '🌿',
  },
  {
    id: 'first-merge',
    title: '合并达人',
    description: '完成合并分支练习',
    icon: '🔀',
  },
  {
    id: 'first-rebase',
    title: '变基大师',
    description: '完成变基练习',
    icon: '🧭',
  },
  {
    id: 'beginner-done',
    title: '入门毕业',
    description: '完成所有可交互的入门练习',
    icon: '🎓',
  },
  {
    id: 'intermediate-done',
    title: '进阶通关',
    description: '完成所有可交互的进阶练习',
    icon: '🚀',
  },
  {
    id: 'advanced-done',
    title: '高级玩家',
    description: '完成所有可交互的高级练习',
    icon: '🏆',
  },
  {
    id: 'all-done',
    title: 'Git 大师',
    description: '完成全部可交互练习',
    icon: '👑',
  },
];

const ACHIEVEMENTS_STORAGE_KEY = 'git-learn-achievements';

const beginnerInteractiveIds = interactivePracticeTasks
  .filter((task) => task.difficulty === '入门')
  .map((task) => task.id);

const intermediateInteractiveIds = interactivePracticeTasks
  .filter((task) => task.difficulty === '进阶')
  .map((task) => task.id);

const advancedInteractiveIds = interactivePracticeTasks
  .filter((task) => task.difficulty === '高级')
  .map((task) => task.id);

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function hasCompletedAll(
  completedTaskIds: Set<string>,
  targetIds: string[]
): boolean {
  return targetIds.every((id) => completedTaskIds.has(id));
}

export function loadEarnedAchievements(storage = getStorage()): string[] {
  if (!storage) {
    return [];
  }

  try {
    const data = storage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEarnedAchievements(
  ids: string[],
  storage = getStorage()
): void {
  if (!storage) {
    return;
  }

  storage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
}

export function clearEarnedAchievements(storage = getStorage()): void {
  if (!storage) {
    return;
  }

  storage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
}

export function checkNewAchievements(
  completedTaskIds: Set<string>,
  previouslyEarned: string[]
): Achievement[] {
  const earned = new Set(previouslyEarned);
  const newAchievements: Achievement[] = [];

  const checks: Array<[string, () => boolean]> = [
    ['first-init', () => completedTaskIds.has('git-init')],
    ['first-commit', () => completedTaskIds.has('git-commit')],
    ['first-branch', () => completedTaskIds.has('create-branch')],
    ['first-merge', () => completedTaskIds.has('merge-branch')],
    ['first-rebase', () => completedTaskIds.has('rebase-branch')],
    ['beginner-done', () => hasCompletedAll(completedTaskIds, beginnerInteractiveIds)],
    [
      'intermediate-done',
      () => hasCompletedAll(completedTaskIds, intermediateInteractiveIds),
    ],
    ['advanced-done', () => hasCompletedAll(completedTaskIds, advancedInteractiveIds)],
    [
      'all-done',
      () =>
        hasCompletedAll(
          completedTaskIds,
          interactivePracticeTasks.map((task) => task.id)
        ),
    ],
  ];

  for (const [id, check] of checks) {
    if (!earned.has(id) && check()) {
      const achievement = achievements.find((item) => item.id === id);
      if (achievement) {
        newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
}
