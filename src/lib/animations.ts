export type AnimationId =
  | 'commit'
  | 'branch'
  | 'merge'
  | 'rebase'
  | 'cherry-pick'
  | 'reset'
  | 'stash'
  | 'bisect'
  | 'workflow'
  | 'conflict';

export interface AnimationScene {
  id: AnimationId;
  title: string;
  summary: string;
  scenario: string;
  keyCommands: string[];
  focusPoints: string[];
  pitfall: string;
  relatedPracticeIds: string[];
}

export interface AnimationSection {
  id: string;
  title: string;
  description: string;
  animationIds: AnimationId[];
}

export const animationScenes: Record<AnimationId, AnimationScene> = {
  commit: {
    id: 'commit',
    title: '把当前进度保存成一次提交',
    summary: '先看清工作区、暂存区和提交历史是如何串起来的。',
    scenario: '你刚改完一小段功能，想把这次进度安全地放进仓库历史，方便继续开发或回滚。',
    keyCommands: ['git status', 'git add .', 'git commit -m "message"'],
    focusPoints: [
      '提交保存的是一个可追踪的历史节点，而不是一句备注。',
      '先看状态、再暂存、再提交，能减少把无关改动带进历史的概率。',
    ],
    pitfall: '跳过 git status 直接提交，最容易把不该进历史的临时改动一起带进去。',
    relatedPracticeIds: ['git-status', 'git-add', 'git-commit'],
  },
  branch: {
    id: 'branch',
    title: '为一个功能拉出独立分支',
    summary: '把“开始做功能”这件事可视化，而不是一直在 main 上硬改。',
    scenario: '团队准备开发登录功能，你需要从当前稳定基线拉出 feature 分支，避免影响主线。',
    keyCommands: ['git branch feature-login', 'git checkout feature-login'],
    focusPoints: [
      '分支本质上是指向某个提交的可移动标签。',
      '切到新分支后继续提交，历史会从同一个基底开始分叉。',
    ],
    pitfall: '以为创建分支后就自动切过去了；实际上通常还需要 checkout 或 switch。',
    relatedPracticeIds: ['create-branch'],
  },
  merge: {
    id: 'merge',
    title: '功能完成后把结果合并回主线',
    summary: '看懂 merge commit 为什么会出现，以及它在团队协作里的意义。',
    scenario: 'feature-login 开发完成，准备把分支工作合并回 main，保留完整的协作轨迹。',
    keyCommands: ['git checkout main', 'git merge feature-login'],
    focusPoints: [
      '合并会把两条开发线重新汇合，必要时生成 merge commit。',
      '主线和功能分支各自前进过时，合并结果最能体现真实协作过程。',
    ],
    pitfall: '还停留在 feature 分支上就执行 merge，常常会把目标分支和来源分支搞反。',
    relatedPracticeIds: ['merge-branch', 'finish-feature-workflow'],
  },
  rebase: {
    id: 'rebase',
    title: '把功能分支同步到 main 最新位置',
    summary: '重点不是背命令，而是看懂“旧提交被重新接到新基底后面”。',
    scenario: '你做功能做到一半，main 又进了几个修复提交，于是先把自己的工作重放到主线最新位置。',
    keyCommands: ['git checkout feature-login', 'git rebase main'],
    focusPoints: [
      'rebase 会重写当前分支的提交链，让历史更线性。',
      '同步主线后再合并，能减少“主线已经变了但功能分支还停在老基底”的混乱感。',
    ],
    pitfall: '把已经公开协作的分支随意 rebase，容易让团队成员面对被改写过的历史。',
    relatedPracticeIds: ['rebase-branch', 'finish-feature-workflow', 'rebase-onto'],
  },
  'cherry-pick': {
    id: 'cherry-pick',
    title: '只搬运需要的那一个热修提交',
    summary: '当你不想整条分支都合进来时，cherry-pick 是精准搬运工具。',
    scenario: 'hotfix 分支上有一个必须赶在发版前上线的修复，你只想把这次提交摘到 main。',
    keyCommands: ['git checkout main', 'git cherry-pick <commit>'],
    focusPoints: [
      'cherry-pick 会复制提交内容到当前分支，生成新的提交 ID。',
      '它很适合热修复、多版本维护或只搬运局部改动的场景。',
    ],
    pitfall: '把它当成“合并分支的简化版”长期使用，容易让多分支历史变得难追踪。',
    relatedPracticeIds: ['cherry-pick-commit'],
  },
  reset: {
    id: 'reset',
    title: '回退历史时别丢掉该保留的改动',
    summary: 'reset 的重点不是危险，而是理解 HEAD、暂存区和工作区分别会发生什么。',
    scenario: '你刚做了一个不满意的提交，想先撤回它，再重新整理提交内容或恢复误操作。',
    keyCommands: ['git reset --soft HEAD~1', 'git reset --hard HEAD@{1}'],
    focusPoints: [
      'soft reset 适合重组提交；hard reset 更像直接把历史和现场一起回退。',
      '出事时 reflog 往往是找回历史的最后保险。',
    ],
    pitfall: '没搞清 soft 和 hard 的差别就直接执行 hard reset，最容易把现场一并抹掉。',
    relatedPracticeIds: ['soft-reset', 'reflog-recovery'],
  },
  stash: {
    id: 'stash',
    title: '临时切任务时先把现场收起来',
    summary: '把中途做到一半的改动暂存起来，等处理完插队任务再恢复。',
    scenario: '你正在做 feature-login，突然被拉去查线上问题，需要先清空工作区再回来继续。',
    keyCommands: ['git stash', 'git stash list', 'git stash pop'],
    focusPoints: [
      'stash 适合短时间中断当前任务，而不是替代正常提交。',
      '恢复 stash 后，工作区会回到中断前的状态，适合继续未完成工作。',
    ],
    pitfall: '把 stash 当长期存档区使用，时间一长就很难分辨每条暂存到底是为了解决什么。',
    relatedPracticeIds: ['stash-changes'],
  },
  bisect: {
    id: 'bisect',
    title: '在长历史里定位谁引入了问题',
    summary: '用二分查找缩小排查范围，比一条条人工回看提交高效得多。',
    scenario: '某个功能最近坏了，但你不知道是过去哪一次提交引入的问题，需要快速缩小范围。',
    keyCommands: ['git bisect start', 'git bisect good <ref>', 'git bisect bad <ref>'],
    focusPoints: [
      'bisect 的价值是把排查从“遍历历史”变成“快速缩圈”。',
      '如果能配合自动测试脚本，定位问题的效率会进一步提高。',
    ],
    pitfall: '没有先确定一个明确的 good / bad 边界，就很难让 bisect 给出稳定结果。',
    relatedPracticeIds: ['bisect-intro'],
  },
  workflow: {
    id: 'workflow',
    title: '完整走一遍功能分支工作流',
    summary: '从开始开发、同步主线到合并收尾，把零散命令串成一条完整路径。',
    scenario: '你从 main 拉出 feature-login，中途主线合入 hotfix，最后同步后再把功能安全合并回去。',
    keyCommands: ['git branch feature-login', 'git rebase main', 'git merge feature-login'],
    focusPoints: [
      '真实工作流不是单个命令，而是一连串状态变化。',
      '先同步主线再收尾合并，能让结果更稳定、历史也更容易读。',
    ],
    pitfall: '把“开发功能”“同步主线”“收尾合并”混成一团，最后最容易不知道当前分支该做什么。',
    relatedPracticeIds: ['rebase-branch', 'finish-feature-workflow'],
  },
  conflict: {
    id: 'conflict',
    title: '识别冲突标记并做出正确取舍',
    summary: '先把冲突长什么样、解决流程是什么看明白，再进入更高强度的实操。',
    scenario: 'main 和 feature-login 改到了同一行代码，Git 不能替你决定最终结果，需要你人工判断。',
    keyCommands: ['git merge feature-login', 'git add <file>', 'git commit'],
    focusPoints: [
      '冲突不是报错结束，而是 Git 暂停下来等待你给出明确结果。',
      '真实项目里常常不是“保留某一边”，而是把两边修改融合成最终版本。',
    ],
    pitfall: '只顾着删掉冲突标记，却没确认最终代码逻辑是否同时保住了两边真正需要的修改。',
    relatedPracticeIds: ['merge-branch', 'rebase-branch'],
  },
};

export const animationSections: AnimationSection[] = [
  {
    id: 'basics',
    title: '基础操作',
    description: '先把提交、分支和合并这些最核心的动作放进具体开发场景里。',
    animationIds: ['commit', 'branch', 'merge'],
  },
  {
    id: 'advanced',
    title: '进阶操作',
    description: '进一步理解历史整理、提交搬运、任务切换和问题定位的动态图示。',
    animationIds: ['rebase', 'cherry-pick', 'reset', 'stash', 'bisect'],
  },
  {
    id: 'scenarios',
    title: '实战场景',
    description: '把多个命令串成真实工作流，建立“为什么现在要做这一步”的判断。',
    animationIds: ['workflow', 'conflict'],
  },
];

export const animationCount = animationSections.reduce(
  (count, section) => count + section.animationIds.length,
  0
);
