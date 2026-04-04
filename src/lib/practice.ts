import {
  createInitialState,
  executeCommand,
  getHeadBranch,
  getHeadCommit,
  type ExecResult,
  type GitState,
} from './git-simulator';

export type PracticeDifficulty = '入门' | '进阶' | '高级';
export type PracticeTopic =
  | '基础命令'
  | '分支协作'
  | '提交搬运'
  | '历史整理'
  | '恢复与切换'
  | '扩展概念';

export interface PracticeValidationContext {
  command: string;
  previousState: GitState;
  nextState: GitState;
  result: ExecResult;
  stepIndex: number;
}

export interface PracticeStep {
  instruction: string;
  acceptedCommands: string[];
  hint: string;
  validate: (context: PracticeValidationContext) => boolean;
}

interface PracticeTaskBase {
  id: string;
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  topic: PracticeTopic;
  prerequisiteIds: string[];
  estimatedMinutes: number;
  nextTaskId: string | null;
  successMessage: string;
}

export interface InteractivePracticeTask extends PracticeTaskBase {
  mode: 'interactive';
  contextNote?: string;
  terminalIntro?: string;
  createInitialState: () => GitState;
  steps: PracticeStep[];
}

export interface ConceptPracticeTask extends PracticeTaskBase {
  mode: 'conceptual';
  conceptNote: string;
  instructions: string[];
  hints: string[];
  referenceCommands: string[];
}

export type PracticeTask = InteractivePracticeTask | ConceptPracticeTask;

export interface PracticeSection {
  id: string;
  title: string;
  description: string;
  kind: 'core' | 'lab' | 'concept';
  taskIds: string[];
}

export interface EvaluatePracticeResult {
  advanced: boolean;
  completed: boolean;
  nextStepIndex: number;
  feedback: string;
}

function cloneStateMaps(state: GitState): GitState {
  return {
    ...state,
    commits: new Map(state.commits),
    branches: new Map(state.branches),
  };
}

function createDirtyState(): GitState {
  const state = createInitialState();
  const next = cloneStateMaps(state);
  next.workingTreeDirty = true;
  next.staging = false;
  return next;
}

function createScenarioState(
  commands: string[],
  initialState: GitState = createInitialState()
): GitState {
  let state = initialState;

  for (const command of commands) {
    const result = executeCommand(state, command);
    if (!result.ok) {
      throw new Error(`Scenario command failed: ${command}\n${result.output}`);
    }
    state = result.state;
  }

  return state;
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ');
}

function matchesAcceptedCommand(
  command: string,
  acceptedCommands: string[]
): boolean {
  const normalized = normalizeCommand(command);

  return acceptedCommands.some((candidate) => {
    const expanded = new Set([normalizeCommand(candidate)]);
    if (candidate.startsWith('git ')) {
      expanded.add(normalizeCommand(candidate.slice(4)));
    }
    return expanded.has(normalized);
  });
}

function getHeadMessage(state: GitState): string | null {
  const headId = getHeadCommit(state);
  return headId ? state.commits.get(headId)?.message ?? null : null;
}

function getBranchCommit(state: GitState, branch: string): string | null {
  return state.branches.get(branch) ?? null;
}

function getCommitMessage(state: GitState, commitId: string | null): string | null {
  return commitId ? state.commits.get(commitId)?.message ?? null : null;
}

export function isInteractiveTask(
  task: PracticeTask
): task is InteractivePracticeTask {
  return task.mode === 'interactive';
}

export function getPracticeTaskById(id: string): PracticeTask | undefined {
  return practiceTasks.find((task) => task.id === id);
}

export function getPracticeTasksByIds(ids: string[]): PracticeTask[] {
  return ids
    .map((id) => getPracticeTaskById(id))
    .filter((task): task is PracticeTask => Boolean(task));
}

export function getPracticeTaskInstructions(task: PracticeTask): string[] {
  return isInteractiveTask(task)
    ? task.steps.map((step) => step.instruction)
    : task.instructions;
}

export function getPracticeTaskHints(task: PracticeTask): string[] {
  return isInteractiveTask(task)
    ? task.steps.map((step) => step.hint)
    : task.hints;
}

export function getReferenceCommands(task: PracticeTask): string[] {
  return isInteractiveTask(task)
    ? task.steps.map((step) => step.acceptedCommands[0])
    : task.referenceCommands;
}

export function getNextPracticeTask(task: PracticeTask): PracticeTask | null {
  return task.nextTaskId ? getPracticeTaskById(task.nextTaskId) ?? null : null;
}

export function evaluateInteractivePracticeCommand(
  task: InteractivePracticeTask,
  stepIndex: number,
  command: string,
  previousState: GitState,
  result: ExecResult
): EvaluatePracticeResult {
  const step = task.steps[stepIndex];

  if (!step) {
    return {
      advanced: false,
      completed: true,
      nextStepIndex: stepIndex,
      feedback: task.successMessage,
    };
  }

  if (!matchesAcceptedCommand(command, step.acceptedCommands)) {
    return {
      advanced: false,
      completed: false,
      nextStepIndex: stepIndex,
      feedback: `命令不正确。提示：${step.hint}`,
    };
  }

  if (!result.ok) {
    return {
      advanced: false,
      completed: false,
      nextStepIndex: stepIndex,
      feedback: result.output,
    };
  }

  const passed = step.validate({
    command,
    previousState,
    nextState: result.state,
    result,
    stepIndex,
  });

  if (!passed) {
    return {
      advanced: false,
      completed: false,
      nextStepIndex: stepIndex,
      feedback: `这条命令执行了，但仓库状态还没有达到本步骤目标。提示：${step.hint}`,
    };
  }

  const nextStepIndex = stepIndex + 1;
  if (nextStepIndex >= task.steps.length) {
    return {
      advanced: true,
      completed: true,
      nextStepIndex,
      feedback: task.successMessage,
    };
  }

  return {
    advanced: true,
    completed: false,
    nextStepIndex,
    feedback: `步骤 ${stepIndex + 1} 已完成。\n下一步：${task.steps[nextStepIndex].instruction}`,
  };
}

export const practiceTasks: PracticeTask[] = [
  {
    id: 'git-init',
    mode: 'interactive',
    title: '初始化仓库',
    description: '执行 git init，创建一个新的 Git 仓库。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: [],
    estimatedMinutes: 5,
    nextTaskId: 'git-status',
    successMessage: '🎉 仓库已经初始化完成，接下来可以开始观察状态和提交历史了。',
    contextNote: '这个练习会把当前仓库重置成一个全新的示例仓库。',
    terminalIntro: '任务：初始化一个新的 Git 仓库。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "old history"']),
    steps: [
      {
        instruction: '初始化一个新的 Git 仓库。',
        acceptedCommands: ['git init'],
        hint: '直接使用 git init 即可。',
        validate: ({ nextState, result }) =>
          result.ok &&
          nextState.commits.size === 1 &&
          getHeadBranch(nextState) === 'main' &&
          nextState.reflog[0]?.action === 'init',
      },
    ],
  },
  {
    id: 'git-status',
    mode: 'interactive',
    title: '查看状态',
    description: '学会从 git status 里读取工作区和暂存区的信息。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-init'],
    estimatedMinutes: 5,
    nextTaskId: 'git-add',
    successMessage: '🎉 你已经会用 git status 快速判断仓库现状了。',
    contextNote: '当前仓库中有一处尚未暂存的修改。',
    terminalIntro: '任务：查看当前仓库状态。',
    createInitialState: createDirtyState,
    steps: [
      {
        instruction: '查看当前仓库状态。',
        acceptedCommands: ['git status'],
        hint: '使用 git status。',
        validate: ({ result }) =>
          result.output.includes('位于分支') &&
          result.output.includes('尚未暂存的更改'),
      },
    ],
  },
  {
    id: 'git-add',
    mode: 'interactive',
    title: '暂存文件',
    description: '把工作区中的修改加入暂存区。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-status'],
    estimatedMinutes: 6,
    nextTaskId: 'git-commit',
    successMessage: '🎉 文件已经进入暂存区，下一步就可以提交了。',
    contextNote: '仓库中预置了一处未暂存修改。',
    terminalIntro: '任务：把当前修改加入暂存区。',
    createInitialState: createDirtyState,
    steps: [
      {
        instruction: '将当前工作区修改加入暂存区。',
        acceptedCommands: ['git add .', 'git add --all', 'git add -A'],
        hint: '使用 git add .、git add -A 或 git add --all 都可以。',
        validate: ({ previousState, nextState }) =>
          previousState.workingTreeDirty &&
          nextState.staging &&
          !nextState.workingTreeDirty,
      },
    ],
  },
  {
    id: 'git-commit',
    mode: 'interactive',
    title: '提交修改',
    description: '把已经暂存的内容提交到仓库。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-add'],
    estimatedMinutes: 6,
    nextTaskId: 'git-log',
    successMessage: '🎉 你的第一次提交完成了，仓库历史也向前推进了一步。',
    contextNote: '当前仓库里已经有一份暂存好的修改，等待你提交。',
    terminalIntro: '任务：提交暂存区内容，提交信息为 "initial commit"。',
    createInitialState: () => createInitialState({ staging: true }),
    steps: [
      {
        instruction: '提交暂存区内容，提交信息使用 "initial commit"。',
        acceptedCommands: [
          'git commit -m "initial commit"',
          "git commit -m 'initial commit'",
        ],
        hint: '使用 git commit -m "initial commit"。',
        validate: ({ previousState, nextState }) =>
          nextState.commits.size === previousState.commits.size + 1 &&
          getHeadMessage(nextState) === 'initial commit' &&
          !nextState.staging,
      },
    ],
  },
  {
    id: 'git-log',
    mode: 'interactive',
    title: '查看提交历史',
    description: '用单行格式快速浏览提交历史。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-commit'],
    estimatedMinutes: 5,
    nextTaskId: 'git-clone',
    successMessage: '🎉 你已经能用 git log 快速理解仓库历史了。',
    contextNote: '仓库里已经有两条提交记录，适合练习历史查看。',
    terminalIntro: '任务：使用单行格式查看提交历史。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "prepare log view"']),
    steps: [
      {
        instruction: '使用单行格式查看提交历史。',
        acceptedCommands: ['git log --oneline'],
        hint: '使用 git log --oneline。',
        validate: ({ result }) =>
          result.output.includes('prepare log view') &&
          result.output.split('\n').length >= 2,
      },
    ],
  },
  {
    id: 'git-clone',
    mode: 'conceptual',
    title: '克隆仓库',
    description: '理解如何从远程地址克隆一个仓库。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-log'],
    estimatedMinutes: 4,
    nextTaskId: 'create-branch',
    successMessage: '你已经理解了 git clone 的基本命令结构。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['掌握 git clone 会把远程仓库及其历史复制到本地。'],
    hints: [
      '命令结构是 git clone <远程地址>。',
      '也可以在命令尾部指定一个本地目录名。',
    ],
    referenceCommands: [
      'git clone https://github.com/user/repo.git',
      'git clone https://github.com/user/repo.git my-folder',
    ],
  },
  {
    id: 'create-branch',
    mode: 'interactive',
    title: '创建分支',
    description: '创建 feature 分支并切换过去。',
    difficulty: '进阶',
    topic: '分支协作',
    prerequisiteIds: ['git-clone'],
    estimatedMinutes: 8,
    nextTaskId: 'merge-branch',
    successMessage: '🎉 你已经掌握了创建并切换分支的基本动作。',
    contextNote: '当前位于 main 分支，准备从这里拉出 feature 分支。',
    terminalIntro: '任务：创建 feature 分支，并切换到它。',
    createInitialState: () => createInitialState(),
    steps: [
      {
        instruction: '创建名为 feature 的新分支。',
        acceptedCommands: ['git branch feature'],
        hint: '先用 git branch feature 创建分支。',
        validate: ({ nextState }) =>
          nextState.branches.has('feature') &&
          getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '切换到 feature 分支。',
        acceptedCommands: ['git checkout feature'],
        hint: '然后使用 git checkout feature 切换过去。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'feature',
      },
    ],
  },
  {
    id: 'merge-branch',
    mode: 'interactive',
    title: '合并分支',
    description: '把 feature 分支的工作合并回 main。',
    difficulty: '进阶',
    topic: '分支协作',
    prerequisiteIds: ['create-branch'],
    estimatedMinutes: 10,
    nextTaskId: 'cherry-pick-commit',
    successMessage: '🎉 合并完成，你已经看到了一个真实的 merge commit。',
    contextNote:
      'main 和 feature 已经各自前进了一次提交，现在需要在 main 上执行合并。',
    terminalIntro: '任务：先切回 main，再把 feature 合并进来。',
    createInitialState: () =>
      createScenarioState([
        'git branch feature',
        'git checkout feature',
        'git commit --allow-empty -m "feature work"',
        'git checkout main',
        'git commit --allow-empty -m "main work"',
      ]),
    steps: [
      {
        instruction: '确认当前位于 main 分支。',
        acceptedCommands: ['git checkout main'],
        hint: '先切回 main，再执行 merge。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '把 feature 分支合并到 main。',
        acceptedCommands: ['git merge feature'],
        hint: '使用 git merge feature。',
        validate: ({ previousState, nextState }) => {
          const previousHead = getHeadCommit(previousState);
          const nextHeadId = getHeadCommit(nextState);
          const nextHead = nextHeadId ? nextState.commits.get(nextHeadId) : null;

          return (
            previousHead !== nextHeadId &&
            nextHead?.parents.length === 2 &&
            nextHead.message === "Merge branch 'feature'"
          );
        },
      },
    ],
  },
  {
    id: 'cherry-pick-commit',
    mode: 'interactive',
    title: '发布前搬运热修提交',
    description: '把 hotfix 分支上的修复精准摘到 main，避免把整条分支都带进来。',
    difficulty: '高级',
    topic: '提交搬运',
    prerequisiteIds: ['merge-branch'],
    estimatedMinutes: 8,
    nextTaskId: 'delete-merged-branch',
    successMessage: '🎉 热修已经被精准搬到 main，你完成了一次典型的发版前补丁处理。',
    contextNote:
      '发版窗口临近，hotfix 分支上已经有一个修复提交。当前你位于 main，只需要把这一次修复摘过来。',
    terminalIntro: '任务：把 hotfix 分支上的登录修复提交摘到 main。',
    createInitialState: () =>
      createScenarioState([
        'git commit --allow-empty -m "prepare release"',
        'git branch hotfix',
        'git checkout hotfix',
        'git commit --allow-empty -m "fix: login redirect"',
        'git checkout main',
      ]),
    steps: [
      {
        instruction: '把哈希为 0000003 的修复提交摘到当前分支。',
        acceptedCommands: ['git cherry-pick 0000003'],
        hint: '使用 git cherry-pick <提交哈希>。',
        validate: ({ previousState, nextState }) => {
          const nextHeadId = getHeadCommit(nextState);
          const nextHead = nextHeadId ? nextState.commits.get(nextHeadId) : null;
          const previousHead = getHeadCommit(previousState);

          return (
            nextState.commits.size === previousState.commits.size + 1 &&
            nextHead?.message === 'fix: login redirect' &&
            nextHead?.parents[0] === previousHead &&
            nextHeadId !== '0000003'
          );
        },
      },
    ],
  },
  {
    id: 'delete-merged-branch',
    mode: 'interactive',
    title: '删除已合并分支',
    description: '在 feature 已合并的前提下安全删除它。',
    difficulty: '高级',
    topic: '提交搬运',
    prerequisiteIds: ['cherry-pick-commit'],
    estimatedMinutes: 5,
    nextTaskId: 'soft-reset',
    successMessage: '🎉 你已经能在合并完成后安全清理分支了。',
    contextNote:
      'feature 分支已经被合并进 main，现在只需要做最后一步清理。',
    terminalIntro: '任务：删除已经合并完成的 feature 分支。',
    createInitialState: () =>
      createScenarioState([
        'git branch feature',
        'git checkout feature',
        'git commit --allow-empty -m "feature cleanup"',
        'git checkout main',
        'git merge feature',
      ]),
    steps: [
      {
        instruction: '删除已合并的 feature 分支。',
        acceptedCommands: ['git branch -d feature'],
        hint: '使用 git branch -d feature。',
        validate: ({ previousState, nextState }) =>
          previousState.branches.has('feature') &&
          !nextState.branches.has('feature') &&
          getHeadBranch(nextState) === 'main',
      },
    ],
  },
  {
    id: 'soft-reset',
    mode: 'interactive',
    title: '回退最近一次错误提交',
    description: '发现刚提交的内容还需要整理，先把它撤回到暂存区。',
    difficulty: '高级',
    topic: '历史整理',
    prerequisiteIds: ['delete-merged-branch'],
    estimatedMinutes: 7,
    nextTaskId: 'rework-last-commit',
    successMessage: '🎉 最近一次提交已经被安全回退到暂存区，你可以重新整理后再提交。',
    contextNote: '你刚提交了一次 work in progress，但准备在真正推送前先把它改得更干净。',
    terminalIntro: '任务：先把最近一次提交撤回到暂存区。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "work in progress"']),
    steps: [
      {
        instruction: '撤销最近一次提交，但保留改动在暂存区。',
        acceptedCommands: ['git reset --soft HEAD~1'],
        hint: '使用 git reset --soft HEAD~1。',
        validate: ({ previousState, nextState }) =>
          getHeadCommit(previousState) !== getHeadCommit(nextState) &&
          nextState.staging,
      },
    ],
  },
  {
    id: 'rework-last-commit',
    mode: 'interactive',
    title: '重新整理刚撤回的提交',
    description: '把刚才回退到暂存区的改动重新提交成更干净的一次提交。',
    difficulty: '高级',
    topic: '历史整理',
    prerequisiteIds: ['soft-reset'],
    estimatedMinutes: 6,
    nextTaskId: 'rebase-branch',
    successMessage: '🎉 你已经把临时提交整理成了更适合进入历史的一次提交。',
    contextNote:
      '刚才那次 work in progress 已经被撤回到暂存区，现在要重新提交成更清晰的版本。',
    terminalIntro: '任务：把暂存区内容重新提交为 "refine login copy"。',
    createInitialState: () =>
      createScenarioState([
        'git commit --allow-empty -m "work in progress"',
        'git reset --soft HEAD~1',
      ]),
    steps: [
      {
        instruction: '把暂存区内容重新提交，提交信息使用 "refine login copy"。',
        acceptedCommands: [
          'git commit -m "refine login copy"',
          "git commit -m 'refine login copy'",
        ],
        hint: '直接用 git commit -m "refine login copy"。',
        validate: ({ nextState }) =>
          getHeadMessage(nextState) === 'refine login copy' && !nextState.staging,
      },
    ],
  },
  {
    id: 'rebase-branch',
    mode: 'interactive',
    title: '同步功能分支最新主线',
    description: '当 main 已经继续前进时，把 feature 分支重放到主线最新位置。',
    difficulty: '高级',
    topic: '历史整理',
    prerequisiteIds: ['soft-reset'],
    estimatedMinutes: 9,
    nextTaskId: 'finish-feature-workflow',
    successMessage: '🎉 feature 已经跟上 main 最新进度，后续收尾会更顺畅。',
    contextNote:
      '你正在开发 feature 功能，main 上又进了一次修复提交。合并前，先把自己的分支同步到主线最新位置。',
    terminalIntro: '任务：切换到 feature，然后执行 git rebase main。',
    createInitialState: () =>
      createScenarioState([
        'git branch feature',
        'git checkout feature',
        'git commit --allow-empty -m "feature work"',
        'git checkout main',
        'git commit --allow-empty -m "main work"',
      ]),
    steps: [
      {
        instruction: '切换到 feature 分支。',
        acceptedCommands: ['git checkout feature'],
        hint: '先进入要变基的 feature 分支。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'feature',
      },
      {
        instruction: '把 feature 变基到 main。',
        acceptedCommands: ['git rebase main'],
        hint: '在 feature 分支上执行 git rebase main。',
        validate: ({ previousState, nextState }) => {
          const nextHeadId = getHeadCommit(nextState);
          const nextHead = nextHeadId ? nextState.commits.get(nextHeadId) : null;
          const previousHead = getHeadCommit(previousState);
          const mainCommit = getBranchCommit(nextState, 'main');

          return (
            getHeadBranch(nextState) === 'feature' &&
            nextHeadId !== previousHead &&
            nextHead?.message === 'feature work' &&
            nextHead?.parents[0] === mainCommit
          );
        },
      },
    ],
  },
  {
    id: 'finish-feature-workflow',
    mode: 'interactive',
    title: '完成功能分支收尾合并',
    description: '把已经同步过主线的 feature 分支正式合并回 main。',
    difficulty: '高级',
    topic: '历史整理',
    prerequisiteIds: ['rebase-branch'],
    estimatedMinutes: 8,
    nextTaskId: 'rebase-onto',
    successMessage: '🎉 这条功能线已经完整走完：开发、同步主线、收尾合并全部完成。',
    contextNote:
      'feature 已经完成并同步到 main 最新位置。现在只差最后一步：切回 main，把这条功能线收尾合并。',
    terminalIntro: '任务：先切回 main，再把 feature 合并进来。',
    createInitialState: () =>
      createScenarioState([
        'git branch feature',
        'git checkout feature',
        'git commit --allow-empty -m "feature work"',
        'git checkout main',
        'git commit --allow-empty -m "main work"',
        'git checkout feature',
        'git rebase main',
      ]),
    steps: [
      {
        instruction: '切回 main，准备收尾合并。',
        acceptedCommands: ['git checkout main'],
        hint: '先切回 main，再执行 merge。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '把已经同步好的 feature 合并回 main。',
        acceptedCommands: ['git merge feature'],
        hint: '执行 git merge feature。',
        validate: ({ previousState, nextState }) => {
          const previousHead = getHeadCommit(previousState);
          const nextHeadId = getHeadCommit(nextState);
          const nextHead = nextHeadId ? nextState.commits.get(nextHeadId) : null;

          return (
            previousHead !== nextHeadId &&
            nextHead?.parents.length === 2 &&
            nextHead.message === "Merge branch 'feature'"
          );
        },
      },
    ],
  },
  {
    id: 'rebase-onto',
    mode: 'interactive',
    title: '精准搬运提交段',
    description: '用 rebase --onto 把 feature 上的一段提交挪到新的基底。',
    difficulty: '高级',
    topic: '历史整理',
    prerequisiteIds: ['rebase-branch'],
    estimatedMinutes: 12,
    nextTaskId: 'stash-changes',
    successMessage: '🎉 你已经掌握了 rebase --onto 的核心心智模型。',
    contextNote:
      'feature-base 指向旧基底，main 上已经有新提交。现在需要把 feature 在 feature-base 之后的两次提交搬到 main 上。',
    terminalIntro:
      '任务：执行 git rebase --onto main feature-base feature，把 feature 的提交段整体迁移。',
    createInitialState: () =>
      createScenarioState([
        'git commit --allow-empty -m "main baseline"',
        'git branch feature-base',
        'git checkout -b feature',
        'git commit --allow-empty -m "feature step 1"',
        'git commit --allow-empty -m "feature step 2"',
        'git checkout main',
        'git commit --allow-empty -m "main release prep"',
      ]),
    steps: [
      {
        instruction:
          '把 feature 在 feature-base 之后的提交搬到 main 上。',
        acceptedCommands: ['git rebase --onto main feature-base feature'],
        hint:
          '语法是 git rebase --onto <新基底> <旧基底> <要搬运的分支>。',
        validate: ({ previousState, nextState }) => {
          const previousFeatureHead = getBranchCommit(previousState, 'feature');
          const nextFeatureHead = getBranchCommit(nextState, 'feature');
          const mainHead = getBranchCommit(nextState, 'main');
          const featureHeadCommit = nextFeatureHead
            ? nextState.commits.get(nextFeatureHead)
            : null;
          const firstRebasedId = featureHeadCommit?.parents[0] ?? null;
          const firstRebasedCommit = firstRebasedId
            ? nextState.commits.get(firstRebasedId)
            : null;

          return (
            previousFeatureHead !== nextFeatureHead &&
            getHeadBranch(nextState) === 'main' &&
            featureHeadCommit?.message === 'feature step 2' &&
            firstRebasedCommit?.message === 'feature step 1' &&
            firstRebasedCommit?.parents[0] === mainHead
          );
        },
      },
    ],
  },
  {
    id: 'stash-changes',
    mode: 'interactive',
    title: '紧急切任务前暂存现场',
    description: '把手头做到一半的改动先收起来，处理完插队任务后再恢复。',
    difficulty: '高级',
    topic: '恢复与切换',
    prerequisiteIds: ['rebase-onto'],
    estimatedMinutes: 7,
    nextTaskId: 'view-reflog',
    successMessage: '🎉 你已经把现场安全收好，并能在处理完插队任务后顺利恢复。',
    contextNote:
      '你正在 feature 分支上写功能，main 上突然来了一个需要立即处理的插队任务。先把现场收起来，切回 main 处理，再回来继续。',
    terminalIntro: '任务：先 stash 当前现场，切到 main 处理插队任务，再回到 feature 恢复改动。',
    createInitialState: () =>
      createScenarioState(['git branch feature', 'git checkout feature'], createDirtyState()),
    steps: [
      {
        instruction: '先把当前工作区改动暂存起来。',
        acceptedCommands: ['git stash'],
        hint: '先用 git stash 保存当前修改。',
        validate: ({ previousState, nextState }) =>
          previousState.workingTreeDirty &&
          !nextState.workingTreeDirty &&
          !nextState.staging &&
          nextState.stash !== null,
      },
      {
        instruction: '切回 main，准备处理插队任务。',
        acceptedCommands: ['git checkout main'],
        hint: '现场收好后，切回 main。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '插队任务处理完后，回到 feature 分支。',
        acceptedCommands: ['git checkout feature'],
        hint: '处理完临时任务，再切回 feature。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === 'feature' && nextState.stash !== null,
      },
      {
        instruction: '恢复刚才收起的现场。',
        acceptedCommands: ['git stash pop'],
        hint: '最后执行 git stash pop。',
        validate: ({ nextState }) =>
          nextState.stash === null &&
          nextState.workingTreeDirty &&
          getHeadBranch(nextState) === 'feature',
      },
    ],
  },
  {
    id: 'view-reflog',
    mode: 'interactive',
    title: '查看引用日志',
    description: '通过 reflog 观察 HEAD 最近发生过哪些移动。',
    difficulty: '高级',
    topic: '恢复与切换',
    prerequisiteIds: ['stash-changes'],
    estimatedMinutes: 6,
    nextTaskId: 'reflog-recovery',
    successMessage: '🎉 你已经知道 reflog 能帮你追踪 HEAD 的移动历史了。',
    contextNote: '这个仓库已经做过几次切换操作，reflog 里应该能看到记录。',
    terminalIntro: '任务：查看 reflog 输出。',
    createInitialState: () =>
      createScenarioState([
        'git branch feature',
        'git checkout feature',
        'git checkout main',
      ]),
    steps: [
      {
        instruction: '查看 HEAD 的引用日志。',
        acceptedCommands: ['git reflog'],
        hint: '使用 git reflog。',
        validate: ({ result }) =>
          result.output.includes('HEAD@{0}') &&
          result.output.includes('checkout'),
      },
    ],
  },
  {
    id: 'reflog-recovery',
    mode: 'interactive',
    title: '误用 hard reset 后自救',
    description: '模拟把提交 reset 掉之后，再通过 reflog 把它找回来。',
    difficulty: '高级',
    topic: '恢复与切换',
    prerequisiteIds: ['view-reflog'],
    estimatedMinutes: 10,
    nextTaskId: 'revert-commit',
    successMessage: '🎉 你已经完成了一次典型的误操作自救，知道出事后该先去看哪里。',
    contextNote:
      'main 上有一个还没来得及推送的重要提交，你却手滑执行了 hard reset。现在要靠 reflog 把它救回来。',
    terminalIntro:
      '任务：先模拟误操作，再查看 reflog，并把丢失的提交恢复回来。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "keep me"']),
    steps: [
      {
        instruction: '把当前分支硬重置到上一个提交。',
        acceptedCommands: ['git reset --hard HEAD~1'],
        hint: '第一步使用 git reset --hard HEAD~1。',
        validate: ({ nextState }) => getHeadMessage(nextState) === 'initial commit',
      },
      {
        instruction: '查看 reflog，确认丢失的提交还在引用日志中。',
        acceptedCommands: ['git reflog'],
        hint: '使用 git reflog，观察 HEAD@{1} 一类的记录。',
        validate: ({ result }) =>
          result.output.includes('reset --hard HEAD~1') &&
          result.output.includes('HEAD@{1}'),
      },
      {
        instruction: '把 HEAD 重置回 HEAD@{1}，恢复丢失的提交。',
        acceptedCommands: ['git reset --hard HEAD@{1}'],
        hint: '使用 git reset --hard HEAD@{1}。',
        validate: ({ nextState }) => getHeadMessage(nextState) === 'keep me',
      },
    ],
  },
  {
    id: 'revert-commit',
    mode: 'interactive',
    title: '还原提交',
    description: '创建一个新的提交来撤销最近一次提交。',
    difficulty: '高级',
    topic: '恢复与切换',
    prerequisiteIds: ['reflog-recovery'],
    estimatedMinutes: 7,
    nextTaskId: 'detached-head-rescue',
    successMessage: '🎉 你已经完成了一次安全的 revert 操作。',
    contextNote: '当前分支已经有一个可以被 revert 的最新提交。',
    terminalIntro: '任务：执行 git revert HEAD。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "buggy change"']),
    steps: [
      {
        instruction: '撤销最近一次提交。',
        acceptedCommands: ['git revert HEAD'],
        hint: '使用 git revert HEAD。',
        validate: ({ previousState, nextState }) =>
          nextState.commits.size === previousState.commits.size + 1 &&
          (getHeadMessage(nextState) ?? '').startsWith('Revert "buggy change"'),
      },
    ],
  },
  {
    id: 'detached-head-rescue',
    mode: 'interactive',
    title: 'Detached HEAD 救援',
    description: '切到旧提交进入 detached HEAD，再把当前位置保存成新分支。',
    difficulty: '高级',
    topic: '恢复与切换',
    prerequisiteIds: ['revert-commit'],
    estimatedMinutes: 8,
    nextTaskId: 'add-submodule',
    successMessage: '🎉 你已经会把 detached HEAD 里的工作保存成分支了。',
    contextNote:
      '当前仓库有两个提交。先切到旧提交 0000001 进入 detached HEAD，再把当前位置保存为 rescue 分支。',
    terminalIntro:
      '任务：切到旧提交进入 detached HEAD，然后创建 rescue 分支保住当前位置。',
    createInitialState: () =>
      createScenarioState(['git commit --allow-empty -m "stabilize build"']),
    steps: [
      {
        instruction: '切换到提交 0000001，进入 detached HEAD。',
        acceptedCommands: ['git checkout 0000001'],
        hint: '使用 git checkout <提交哈希>。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === null &&
          getHeadCommit(nextState) === '0000001',
      },
      {
        instruction: '基于当前位置创建 rescue 分支。',
        acceptedCommands: ['git checkout -b rescue'],
        hint: '使用 git checkout -b rescue。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === 'rescue' &&
          getBranchCommit(nextState, 'rescue') === '0000001',
      },
    ],
  },
  {
    id: 'add-submodule',
    mode: 'conceptual',
    title: '添加子模块',
    description: '理解如何把外部仓库作为子模块纳入项目。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['detached-head-rescue'],
    estimatedMinutes: 6,
    nextTaskId: 'init-submodules',
    successMessage: '你已经理解了 submodule add 的命令结构。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['理解子模块会把一个仓库嵌入到另一个仓库中。'],
    hints: [
      '子模块默认记录的是特定提交，而不是始终追踪分支头部。',
      '添加后会生成 .gitmodules 配置文件。',
    ],
    referenceCommands: [
      'git submodule add https://github.com/lib/lib.git vendor/lib',
    ],
  },
  {
    id: 'init-submodules',
    mode: 'conceptual',
    title: '初始化子模块',
    description: '理解 clone 后如何初始化并更新子模块。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['add-submodule'],
    estimatedMinutes: 5,
    nextTaskId: 'add-worktree',
    successMessage: '你已经理解了子模块初始化的基本命令。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['掌握 clone 后拉起子模块内容所需的两个核心命令。'],
    hints: [
      '常见做法是先 init，再 update。',
      '也可以用 update --init 一步完成。',
    ],
    referenceCommands: [
      'git submodule init',
      'git submodule update',
      'git submodule update --init',
    ],
  },
  {
    id: 'add-worktree',
    mode: 'conceptual',
    title: '添加工作树',
    description: '理解如何用 worktree 在新目录中同时检出其他分支。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['init-submodules'],
    estimatedMinutes: 5,
    nextTaskId: 'list-worktree',
    successMessage: '你已经理解了 worktree add 的使用方式。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['理解 worktree 能让你在多个目录同时工作，而不必反复切换分支。'],
    hints: [
      'worktree 很适合处理 hotfix 或并行验证多个版本。',
      '新目录会共享同一个仓库历史。',
    ],
    referenceCommands: ['git worktree add ../hotfix hotfix-branch'],
  },
  {
    id: 'list-worktree',
    mode: 'conceptual',
    title: '查看工作树',
    description: '理解如何查看当前仓库关联的所有工作树。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['add-worktree'],
    estimatedMinutes: 4,
    nextTaskId: 'rebase-exec',
    successMessage: '你已经理解了查看工作树列表的命令。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['查看当前仓库所有 worktree 的挂载情况。'],
    hints: ['worktree list 会列出路径、分支和 HEAD 状态。'],
    referenceCommands: ['git worktree list'],
  },
  {
    id: 'rebase-exec',
    mode: 'conceptual',
    title: 'Rebase --exec',
    description: '理解如何在每个重放提交后自动执行检查命令。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['list-worktree'],
    estimatedMinutes: 6,
    nextTaskId: 'enable-rerere',
    successMessage: '你已经理解了 --exec 在 rebase 中的用途。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['理解 --exec 可以把测试或检查命令嵌入 rebase 过程。'],
    hints: [
      '这个技巧很适合确保每个提交都能单独通过测试。',
      '它通常与交互式 rebase 一起使用。',
    ],
    referenceCommands: ['git rebase -i --exec "npm test" HEAD~3'],
  },
  {
    id: 'enable-rerere',
    mode: 'conceptual',
    title: '启用 Rerere',
    description: '理解如何让 Git 记住冲突解决方案。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['rebase-exec'],
    estimatedMinutes: 5,
    nextTaskId: null,
    successMessage: '你已经理解了 rerere 的使用场景。',
    conceptNote:
      '这是概念练习，本轮不提供图形模拟，也不会计入完成进度。',
    instructions: ['了解 rerere 会记录你处理冲突的方式，并在下次尝试自动复用。'],
    hints: [
      '它对频繁 rebase 或长期维护分支的团队很有帮助。',
      '通常用 git config 开启。',
    ],
    referenceCommands: ['git config --global rerere.enabled true'],
  },
  {
    id: 'bisect-intro',
    mode: 'conceptual',
    title: '用二分法定位问题提交',
    description: '理解 git bisect 如何把排查范围从全部历史缩小到单个提交。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['view-reflog'],
    estimatedMinutes: 6,
    nextTaskId: null,
    successMessage: '你已经理解了 bisect 的定位思路。',
    conceptNote:
      '这是概念练习，不提供图形模拟，也不计入完成进度。',
    instructions: ['bisect 用二分查找在提交历史中定位首次引入问题的提交，比人工逐条回看高效得多。'],
    hints: [
      '先用 git bisect start 进入二分模式。',
      '标记一个已知好的提交（git bisect good <ref>）和一个已知坏的提交（git bisect bad <ref>）。',
      '每次 Git 帮你 checkout 到中间位置，你测试后继续标记 good/bad，直到定位到目标提交。',
    ],
    referenceCommands: [
      'git bisect start',
      'git bisect good v1.0',
      'git bisect bad HEAD',
      'git bisect reset',
    ],
  },
];

export const practiceSections: PracticeSection[] = [
  {
    id: 'core-basics',
    title: '基础起步',
    description: '先把仓库、状态、暂存、提交和历史这些核心动作跑通。',
    kind: 'core',
    taskIds: ['git-init', 'git-status', 'git-add', 'git-commit', 'git-log', 'git-clone'],
  },
  {
    id: 'core-branches',
    title: '分支协作',
    description: '理解分支创建、切换和合并，是后续高级场景的前置能力。',
    kind: 'core',
    taskIds: ['create-branch', 'merge-branch'],
  },
  {
    id: 'lab-transfer',
    title: '高级实验室 · 提交搬运',
    description: '围绕发版热修与分支清理，练习把改动精准送到目标分支。',
    kind: 'lab',
    taskIds: ['cherry-pick-commit', 'delete-merged-branch'],
  },
  {
    id: 'lab-history',
    title: '高级实验室 · 历史整理',
    description: '围绕撤回错误提交、同步主线、收尾合并和提交段迁移，建立更贴近真实协作的历史整理能力。',
    kind: 'lab',
    taskIds: [
      'soft-reset',
      'rework-last-commit',
      'rebase-branch',
      'finish-feature-workflow',
      'rebase-onto',
    ],
  },
  {
    id: 'lab-recovery',
    title: '高级实验室 · 恢复与切换',
    description: '围绕紧急切任务、reflog 自救、revert 和 detached HEAD，练习高风险场景下的找回与收尾。',
    kind: 'lab',
    taskIds: [
      'stash-changes',
      'view-reflog',
      'reflog-recovery',
      'revert-commit',
      'detached-head-rescue',
    ],
  },
  {
    id: 'concept-advanced',
    title: '延伸概念',
    description: '这些主题暂时保持概念题，等后续多仓库建模再升级为可交互练习。',
    kind: 'concept',
    taskIds: [
      'add-submodule',
      'init-submodules',
      'add-worktree',
      'list-worktree',
      'rebase-exec',
      'enable-rerere',
      'bisect-intro',
    ],
  },
];

export const advancedLabSections = practiceSections.filter(
  (section) => section.kind === 'lab'
);

export const interactivePracticeTasks = practiceTasks.filter(isInteractiveTask);
export const interactivePracticeTaskIds = interactivePracticeTasks.map(
  (task) => task.id
);
export const interactivePracticeTaskIdSet = new Set(interactivePracticeTaskIds);
