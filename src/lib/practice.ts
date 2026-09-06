import {
  createCollaborationState,
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
  | '远程协作'
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
  /** 答错时的针对性教学说明：这步在练什么、为什么容易错 */
  teachNote?: string;
  validate: (context: PracticeValidationContext) => boolean;
}

export interface TeammatePushConfig {
  /** 该步完成后，虚拟队友向 origin/main 推送新提交 */
  afterStepIndex: number;
  /** 队友推送的提交信息 */
  message: string;
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
  /** 虚拟队友配置：练习进行中队友"突然"推送，训练 fetch 肌肉记忆 */
  teammatePush?: TeammatePushConfig;
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
  /** 答错时附带的教学说明（teachNote），UI 可渲染为教学卡片 */
  teaching?: string;
  /** 虚拟队友在此步之后触发推送（ PracticeTaskPage 需据此更新远程状态） */
  teammatePushMessage?: string;
}

function cloneStateMaps(state: GitState): GitState {
  return {
    ...state,
    commits: new Map(state.commits),
    branches: new Map(state.branches),
    remote: state.remote
      ? {
          url: state.remote.url,
          commits: new Map(state.remote.commits),
          branches: new Map(state.remote.branches),
        }
      : null,
    remoteTracking: new Map(state.remoteTracking),
    upstream: new Map(state.upstream),
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

/** 通过反向扫描任务链找到上一题 */
export function getPrevPracticeTask(task: PracticeTask): PracticeTask | null {
  for (const candidate of practiceTasks) {
    if (candidate.nextTaskId === task.id) {
      return candidate;
    }
  }
  return null;
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
      teaching: step.teachNote,
    };
  }

  const passed = step.validate({
    command,
    previousState,
    nextState: result.state,
    result,
    stepIndex,
  });

  if (passed) {
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex >= task.steps.length) {
      return {
        advanced: true,
        completed: true,
        nextStepIndex,
        feedback: task.successMessage,
      };
    }

    const push = task.teammatePush;
    const teammatePushMessage =
      push && push.afterStepIndex === stepIndex ? push.message : undefined;

    return {
      advanced: true,
      completed: false,
      nextStepIndex,
      feedback: teammatePushMessage
        ? `步骤 ${stepIndex + 1} 已完成。\n${teammatePushMessage}`
        : `步骤 ${stepIndex + 1} 已完成。\n下一步：${task.steps[nextStepIndex].instruction}`,
      teammatePushMessage,
    };
  }

  if (!result.ok) {
    return {
      advanced: false,
      completed: false,
      nextStepIndex: stepIndex,
      feedback: result.output,
      teaching: step.teachNote,
    };
  }

  return {
    advanced: false,
    completed: false,
    nextStepIndex: stepIndex,
    feedback: `这条命令执行了，但仓库状态还没有达到本步骤目标。提示：${step.hint}`,
    teaching: step.teachNote,
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
        teachNote:
          'git init 做的事很克制：只是创建 .git 文件夹开始记录，不动你的任何文件。执行后当前目录就是"仓库"，所有历史都藏在那个隐藏文件夹里。',
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
        teachNote:
          'status 是 Git 里唯一"只读不动手"的常用命令——随便敲，永远不会破坏任何东西。输出分三段：暂存区的、未暂存的、未跟踪的，读它的顺序就是下一步操作的顺序。',
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
        teachNote:
          'git add . 表示"把当前目录下所有改动放进下次提交的清单"。暂存区是 Git 特有的设计：让你把相关改动组织成一个干净的提交，而不是把鸡毛蒜皮混在一起。',
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
        teachNote:
          '提交信息写给三个月后的自己。-m 后的引号里是这次提交的说明；注意提交的是"暂存区的内容"，所以 add 了什么决定了什么进历史。',
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
        teachNote:
          '--oneline 把每个提交压缩成一行（短哈希+信息）。完整版 git log 一屏只能看几个提交，日常浏览历史几乎都用单行模式。',
        validate: ({ result }) =>
          result.output.includes('prepare log view') &&
          result.output.split('\n').length >= 2,
      },
    ],
  },
  {
    id: 'git-clone',
    mode: 'interactive',
    title: '克隆远程仓库',
    description: '用 git clone 把远程仓库完整复制到本地，并认识 origin。',
    difficulty: '入门',
    topic: '基础命令',
    prerequisiteIds: ['git-log'],
    estimatedMinutes: 6,
    nextTaskId: 'create-branch',
    successMessage: '🎉 你已经把远程仓库克隆到本地，后续的分支和远程练习都建立在这个动作上。',
    contextNote:
      '你即将从远程地址克隆一个团队仓库。clone 会复制完整历史并自动配置 origin 跟踪。',
    terminalIntro: '任务：克隆团队仓库，然后确认克隆结果。',
    createInitialState: () => createInitialState(),
    steps: [
      {
        instruction: '克隆远程仓库 https://github.com/team/project.git。',
        acceptedCommands: ['git clone https://github.com/team/project.git'],
        hint: '使用 git clone <远程地址>。',
        teachNote:
          'clone = 把远程仓库完整复制到本地：不只是文件，还有全部历史，并自动把远程命名为 origin。和 git init 的区别：init 从零开始，clone 接手现成的项目。',
        validate: ({ nextState }) =>
          nextState.remote?.url === 'https://github.com/team/project.git' &&
          nextState.branches.has('main') &&
          nextState.remoteTracking.has('origin/main'),
      },
      {
        instruction: '查看远程仓库配置，确认 origin 已经自动设置。',
        acceptedCommands: ['git remote -v'],
        hint: '使用 git remote -v 查看远程地址。',
        teachNote:
          'origin 不是关键字，只是 clone 时 Git 给远程仓库起的默认名。-v 会列出读(fetch)和写(push)两个地址——通常相同。',
        validate: ({ result }) =>
          result.ok &&
          result.output.includes('origin') &&
          result.output.includes('team/project.git'),
      },
      {
        instruction: '查看所有分支（含远程分支），确认 origin/main 存在。',
        acceptedCommands: ['git branch -a'],
        hint: '使用 git branch -a。',
        teachNote:
          '-a 显示包括远程分支镜像在内的所有分支。remotes/origin/main 这样的条目是"远程分支在你本地的镜像"，只在 fetch 时更新——看它就知道远程上次同步时的样子。',
        validate: ({ result }) =>
          result.ok &&
          result.output.includes('* main') &&
          result.output.includes('remotes/origin/main'),
      },
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
        teachNote:
          'git branch 只创建分支，不会切换过去——分支本质是一个指向当前提交的可移动标签。创建后 HEAD 仍留在原分支，这是新手最常见的误解。想一步到位要用 git checkout -b 或 git switch -c。',
        validate: ({ nextState }) =>
          nextState.branches.has('feature') &&
          getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '切换到 feature 分支。',
        acceptedCommands: ['git checkout feature'],
        hint: '然后使用 git checkout feature 切换过去。',
        teachNote:
          'checkout 切换分支时，工作区文件会变成目标分支的快照。切走前最好保持工作区干净——带着未提交的修改切换，要么改动跟着你走，要么被 Git 拒绝。',
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
    nextTaskId: 'resolve-merge-conflict',
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
        teachNote:
          '合并前先站到目标分支上。很多人在这里栽跟头：以为 merge 会"把我的分支推给对方"，实际语义是"把对方合进我这里"——方向反了结果就反了。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '把 feature 分支合并到 main。',
        acceptedCommands: ['git merge feature'],
        hint: '使用 git merge feature。',
        teachNote:
          '合并的方向感：merge 语义是"把指定分支合进我当前所在的分支"，所以必须先站在 main 上。方向搞反（在 feature 上 merge main）不会报错，但结果完全不同——会把 main 的工作带进 feature 而不是相反。',
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
    id: 'resolve-merge-conflict',
    mode: 'interactive',
    title: '解决合并冲突',
    description: '两边都改了 config.js，Git 停下来等你拍板：体验冲突标记，做出取舍。',
    difficulty: '进阶',
    topic: '分支协作',
    prerequisiteIds: ['merge-branch'],
    estimatedMinutes: 12,
    nextTaskId: 'push-feature',
    successMessage: '🎉 你刚刚经历了真实开发中最让人紧张的场景——并亲手化解了它。冲突不可怕，可怕的是不看内容乱选。',
    contextNote:
      'main 把 config.js 的 log_level 改成了 debug；feature 分支把它改成了 trace。两边都动了同一行，合并必然冲突。',
    terminalIntro:
      '任务：合并 feature，查看冲突标记，选择保留方案完成合并。',
    createInitialState: () => {
      let state = createInitialState({ configValue: 'log_level=info' });
      state = executeCommand(state, 'git branch feature').state;

      state = { ...state, staging: true };
      state = executeCommand(
        state,
        'git commit -m "main: set log level" config="log_level=debug"'
      ).state;

      state = executeCommand(state, 'git checkout feature').state;
      state = { ...state, staging: true };
      state = executeCommand(
        state,
        'git commit -m "feat: switch to trace logging" config="log_level=trace"'
      ).state;

      return executeCommand(state, 'git checkout main').state;
    },
    steps: [
      {
        instruction: '尝试把 feature 合并进 main，观察冲突提示。',
        acceptedCommands: ['git merge feature'],
        hint: '直接执行 git merge feature，注意 CONFLICT 字样。',
        teachNote:
          '冲突不是失败，是 Git 在说"两边都改了同一处，我不能替你决定"。注意 Automatic merge failed——此时仓库处于合并中间态，解决之前无法提交其他内容。',
        validate: ({ nextState }) => nextState.mergeConflict !== null,
      },
      {
        instruction: '查看冲突内容：不带参数执行 resolve-conflict。',
        acceptedCommands: ['resolve-conflict'],
        hint: '输入 resolve-conflict 可以看到 <<<<<<< ======= >>>>>>> 标记的双方内容。',
        teachNote:
          '冲突标记读法：<<<<<<< 到 ======= 之间是当前分支（HEAD）的版本，======= 到 >>>>>>> 之间是对方分支的版本。真实的解决常常不是二选一，而是把两边有价值的部分融合成第三种写法——沙盒用 ours/theirs/both 简化了这个决策。',
        validate: ({ result }) =>
          !result.ok &&
          result.output.includes('<<<<<<<') &&
          result.output.includes('>>>>>>>'),
      },
      {
        instruction:
          'main 上的 debug 级别是测试环境验证过的，保留当前分支的版本（ours）。',
        acceptedCommands: ['resolve-conflict ours'],
        hint: '使用 resolve-conflict ours 保留 HEAD 一侧。',
        teachNote:
          'ours/theirs 的参照系是"执行 merge 时你站在哪边"：ours = 合并前你所在分支（main），theirs = 被合进来的分支（feature）。命名是站在 merge 发起者视角的。',
        validate: ({ nextState, result }) => {
          const headId = getHeadCommit(nextState);
          const head = headId ? nextState.commits.get(headId) : null;

          return (
            result.ok &&
            nextState.mergeConflict === null &&
            head?.parents.length === 2 &&
            head?.configValue === 'log_level=debug'
          );
        },
      },
      {
        instruction: '用 git log 确认合并提交的信息里带上了 resolved 标记。',
        acceptedCommands: ['git log --oneline'],
        hint: '使用 git log --oneline，查看最新提交的 (resolved: ours) 后缀。',
        validate: ({ result }) =>
          result.ok && result.output.includes('resolved: ours'),
      },
    ],
  },
  {
    id: 'push-feature',
    mode: 'interactive',
    title: '推送功能分支到远程',
    description: '把本地 feature 分支推送到 origin，并建立跟踪关系，让队友看到你的工作。',
    difficulty: '进阶',
    topic: '远程协作',
    prerequisiteIds: ['merge-branch'],
    estimatedMinutes: 8,
    nextTaskId: 'pull-teammate-changes',
    successMessage: '🎉 feature 分支已经推送到远程，队友现在可以检出你的分支继续协作了。',
    contextNote:
      '这个仓库已经克隆自远程仓库：origin 已配置，main 与远程保持同步。你要把新功能推上去给队友看。',
    terminalIntro: '任务：创建 feature 分支，完成一次提交，然后推送并建立跟踪关系。',
    createInitialState: () =>
      createCollaborationState({
        sharedMessages: ['setup ci', 'add landing page'],
      }),
    steps: [
      {
        instruction: '创建并切换到新分支 feature。',
        acceptedCommands: ['git checkout -b feature'],
        hint: '使用 git checkout -b feature，一步创建并切换。',
        teachNote:
          '-b 是 branch 的缩写：先创建分支再切换过去。如果你刚才单独用过 git branch + git checkout 两步，那条路径也完全正确——这里练习的是一步写法。新语法 git switch -c 是等价的现代替代。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'feature',
      },
      {
        instruction: '在 feature 分支上完成一次提交，提交信息为 "add login form"。',
        acceptedCommands: [
          'git commit --allow-empty -m "add login form"',
          "git commit --allow-empty -m 'add login form'",
        ],
        hint: '沙盒允许空提交：git commit --allow-empty -m "add login form"。',
        teachNote:
          '真实开发很少用空提交，沙盒用它模拟"这次提交代表的改动"。--allow-empty 的合法用途是标记部署节点或触发 CI，平时提交前记得先 add。',
        validate: ({ nextState }) => getHeadMessage(nextState) === 'add login form',
      },
      {
        instruction: '把 feature 推送到远程，并建立跟踪关系。',
        acceptedCommands: ['git push -u origin feature'],
        hint: '首次推送使用 git push -u origin feature，-u 会建立跟踪关系。',
        teachNote:
          '本地新建的分支对远程来说是全新的，第一次推送必须明确"推到哪个远程的哪个分支"。 -u（--set-upstream）建立本地分支与远程分支的绑定，之后 git status 才能告诉你领先/落后几个提交，裸敲 git push 也知道推往哪里。',
        validate: ({ nextState }) => {
          const headId = getHeadCommit(nextState);
          return (
            nextState.remote?.branches.get('feature') === headId &&
            nextState.upstream.get('feature') === 'origin/feature'
          );
        },
      },
    ],
  },
  {
    id: 'pull-teammate-changes',
    mode: 'interactive',
    title: '同步队友推送的更新',
    description: '练习中队友会"突然"推送新提交——先 fetch 观察，再合并进本地。',
    difficulty: '进阶',
    topic: '远程协作',
    prerequisiteIds: ['push-feature'],
    estimatedMinutes: 8,
    nextTaskId: 'push-rejected-recovery',
    successMessage: '🎉 队友的工作已经同步到本地 main，这就是团队日常同步的基本节奏。',
    contextNote:
      '你所在的团队共享 origin/main 仓库。注意：练习进行中，队友随时可能推送新提交——推送被拒或状态不对时，第一反应应该是 fetch。',
    terminalIntro: '任务：先用 git fetch 查看远程更新，再把 origin/main 合并进本地 main。',
    createInitialState: () =>
      createCollaborationState({
        sharedMessages: ['setup project'],
      }),
    teammatePush: {
      // 第 1 步（fetch）完成后，队友再次推送——训练"push 前先 fetch"的肌肉记忆
      afterStepIndex: 0,
      message: 'teammate: fix navbar overflow',
    },
    steps: [
      {
        instruction: '从远程获取最新状态（只下载，不合并）。',
        acceptedCommands: ['git fetch', 'git fetch origin'],
        hint: '使用 git fetch 或 git fetch origin。',
        teachNote:
          'fetch 只下载远程的新对象并更新 origin/* 镜像，不碰你的工作区和本地分支——这是它和 pull 的本质区别。先 fetch 后看，是"先侦察后行动"的安全习惯。',
        validate: ({ previousState, nextState }) =>
          nextState.remoteTracking.get('origin/main') !==
          previousState.remoteTracking.get('origin/main'),
      },
      {
        instruction: '队友又推了新提交！再次 fetch，看看远程最新状态。',
        acceptedCommands: ['git fetch', 'git fetch origin'],
        hint: '队友推送不会自动同步到你本地，再执行一次 git fetch。',
        teachNote:
          '对，远程变了不会主动通知你——Git 是分布式系统，一切同步都由你主动发起。这也是"push 前先 fetch"成为铁律的原因。',
        validate: ({ previousState, nextState }) =>
          nextState.remoteTracking.get('origin/main') !==
          previousState.remoteTracking.get('origin/main'),
      },
      {
        instruction: '把 origin/main 合并进当前分支，让本地 main 快进到远程最新位置。',
        acceptedCommands: ['git merge origin/main', 'git pull origin main'],
        hint: '使用 git merge origin/main，或用 git pull origin main 一步完成。',
        teachNote:
          'origin/main 是远程 main 在你本地的镜像分支。merge 它 = 把远程的工作合进本地。pull 就是 fetch+merge 的合写，但拆开做你能先看清远程改了什么再决定。',
        validate: ({ previousState, nextState }) => {
          const trackingId = nextState.remoteTracking.get('origin/main');
          const mainHead = nextState.branches.get('main');

          return (
            Boolean(trackingId) &&
            mainHead === trackingId &&
            previousState.branches.get('main') !== trackingId
          );
        },
      },
    ],
  },
  {
    id: 'push-rejected-recovery',
    mode: 'interactive',
    title: '推送被拒后的自救',
    description: '本地和远程各自前进时，体验 non-fast-forward 拒绝，整合远程更改后重新推送。',
    difficulty: '高级',
    topic: '远程协作',
    prerequisiteIds: ['pull-teammate-changes'],
    estimatedMinutes: 10,
    nextTaskId: 'cherry-pick-commit',
    successMessage: '🎉 推送冲突处理完毕：被拒 → fetch → pull 整合 → 再推送，这是多人协作最常见的闭环。',
    contextNote:
      '你在本地 main 上完成了一次提交，而队友也往 origin/main 推送了一个提交，两边已经分叉。',
    terminalIntro: '任务：先尝试推送（会被拒绝），然后整合远程更改，最后重新推送成功。',
    createInitialState: () =>
      createCollaborationState({
        sharedMessages: ['setup project'],
        localMessages: ['local: update readme'],
        teammateMessages: ['teammate: fix navbar'],
      }),
    steps: [
      {
        instruction: '直接尝试推送 main，观察 Git 的拒绝信息（这一步的失败是预期内的）。',
        acceptedCommands: ['git push origin main'],
        hint: '执行 git push origin main，注意输出里的 non-fast-forward。',
        teachNote:
          'non-fast-forward 意味着"直接接受你的推送会覆盖远程上你还没有的提交"——Git 用拒绝来保护队友的工作。它不是报错，是护栏。正确反应永远不是 --force 强推，而是先 fetch 看清远程状态。',
        validate: ({ result }) =>
          !result.ok && result.output.includes('non-fast-forward'),
      },
      {
        instruction: '把远程的提交拉取下来，与本地 main 合并。',
        acceptedCommands: ['git pull origin main'],
        hint: '使用 git pull origin main，Git 会生成一个合并提交。',
        teachNote:
          '拉下来的远程提交和你的本地提交分叉了，Git 自动生成一个有两个父提交的合并提交把两条线缝合。缝合后远程的所有工作都在你本地，重新推送就能通过。',
        validate: ({ previousState, nextState }) => {
          const nextHeadId = getHeadCommit(nextState);
          const nextHead = nextHeadId ? nextState.commits.get(nextHeadId) : null;

          return (
            nextHead?.parents.length === 2 &&
            (nextHead?.message ?? '').includes(
              "Merge remote-tracking branch 'origin/main'"
            ) &&
            previousState.branches.get('main') !== nextHeadId
          );
        },
      },
      {
        instruction: '重新推送 main，这一次应该成功。',
        acceptedCommands: ['git push origin main'],
        hint: '再次执行 git push origin main。',
        teachNote:
          '这次成功是因为远程的所有提交已经包含在你的历史里——推送变成了快进（fast-forward），Git 确认不会覆盖任何人的工作，自然放行。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === 'main' &&
          nextState.remote?.branches.get('main') === getHeadCommit(nextState),
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
        teachNote:
          'cherry-pick 是"复制提交"：把指定提交的改动在当前分支重新应用，生成内容相同但哈希不同的新提交。哈希变了是因为父提交变了——这是判断"搬过没有"的依据。',
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
        teachNote:
          '-d 会检查分支是否已合并，未合并就拒绝——这是安全锁。真要丢弃未合并的工作用大写 -D，它不做检查。删除分支只删标签不删提交，误删可以用 reflog 找回。',
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
        teachNote:
          'HEAD~1 读作"HEAD 的上一个提交"。--soft 表示只把分支指针往回挪一格，你的改动原封不动留在暂存区——相当于"把这一次提交拆开重写"。用 --hard 的话改动会一并消失，那是这道题特意避开的选项。',
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
        teachNote:
          'reset --soft 之后暂存区还是满的，直接重新 commit 就是"用新信息重新提交了一遍"。这次提交会替代原来那次的位置，历史因此更干净。',
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
        teachNote:
          'rebase 重放的是"当前分支"的提交，所以必须先站在被整理的分支上。站在 main 上执行 rebase feature，动的就是 main——方向和 merge 一样重要。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'feature',
      },
      {
        instruction: '把 feature 变基到 main。',
        acceptedCommands: ['git rebase main'],
        hint: '在 feature 分支上执行 git rebase main。',
        teachNote:
          'rebase main 读作"把我的提交搬到 main 的最新位置之后"。原提交被复制为新提交（哈希变化），历史变成一条直线。黄金法则：只 rebase 没推送过的私有分支。',
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
        teachNote:
          'stash 把未提交的改动收进一个临时柜，工作区瞬间变干净——比提交快、不留历史。注意它只收已跟踪文件的改动，新文件要加 -u。',
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
        teachNote:
          '工作区已经干净，切换不会再被拒绝或带着脏改动。这就是 stash 的价值：让分支切换回到"随时可走"的状态。',
        validate: ({ nextState }) => getHeadBranch(nextState) === 'main',
      },
      {
        instruction: '插队任务处理完后，回到 feature 分支。',
        acceptedCommands: ['git checkout feature'],
        hint: '处理完临时任务，再切回 feature。',
        teachNote:
          'stash 是跟着仓库走的，不是跟着分支——切回来时它还在，等你取。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === 'feature' && nextState.stash !== null,
      },
      {
        instruction: '恢复刚才收起的现场。',
        acceptedCommands: ['git stash pop'],
        hint: '最后执行 git stash pop。',
        teachNote:
          'pop = 恢复改动 + 删除暂存记录。恢复的改动回到工作区，和你收起时一模一样。如果只想取不改、以后还要再取，用 stash apply。',
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
        teachNote:
          'reflog 记录的是 HEAD 的每一次移动：提交、切换、重置……它是本地操作日志，不推送、不共享。出事后第一反应看它——只要提交出现过，这里就有线索。',
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
        teachNote:
          'hard reset 把分支指针往回挪一格，改动一并清掉——看起来提交"消失"了。别慌：它只是不在分支上了，对象还在数据库里，下两步就是找它回来。',
        validate: ({ nextState }) => getHeadMessage(nextState) === 'initial commit',
      },
      {
        instruction: '查看 reflog，确认丢失的提交还在引用日志中。',
        acceptedCommands: ['git reflog'],
        hint: '使用 git reflog，观察 HEAD@{1} 一类的记录。',
        teachNote:
          'HEAD@{1} 读作"HEAD 上一次所在的位置"。列表按时间倒序。找到误操作之前的那行，记下它的哈希或序号。',
        validate: ({ result }) =>
          result.output.includes('reset --hard HEAD~1') &&
          result.output.includes('HEAD@{1}'),
      },
      {
        instruction: '把 HEAD 重置回 HEAD@{1}，恢复丢失的提交。',
        acceptedCommands: ['git reset --hard HEAD@{1}'],
        hint: '使用 git reset --hard HEAD@{1}。',
        teachNote:
          '把分支指回"出事前"的位置——被丢弃的提交就这样回到了分支上。reflog 是纯本地机制，这就是 Git 几乎不丢已提交数据的原因。',
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
        teachNote:
          'revert 不删历史，而是生成一个"反向提交"抵消目标提交的改动。历史变长了而不是被改写——所以对已推送的提交它是唯一安全选择。',
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
        teachNote:
          '直接检出提交时 HEAD 不挂在任何分支上，这就是 detached HEAD。查看旧代码完全没问题；危险的是此时的新提交不属于任何分支，切走后会悬空。',
        validate: ({ nextState }) =>
          getHeadBranch(nextState) === null &&
          getHeadCommit(nextState) === '0000001',
      },
      {
        instruction: '基于当前位置创建 rescue 分支。',
        acceptedCommands: ['git checkout -b rescue'],
        hint: '使用 git checkout -b rescue。',
        teachNote:
          '在 detached HEAD 里建分支 = 把"现在这个位置"钉在一个新分支上。悬空的提交从此有了归属，这是救援的标准动作。',
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
    mode: 'interactive',
    title: '添加工作树',
    description: '用 worktree 在新目录中同时检出其他分支，不用反复切换。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['init-submodules'],
    estimatedMinutes: 6,
    nextTaskId: 'list-worktree',
    successMessage: '🎉 你已经会在同一个仓库里同时挂起两个工作目录了。',
    contextNote:
      '你正在开发 feature，线上突然要紧急修复。与其切分支，不如把 hotfix 分支挂到一个新目录里单独处理。',
    terminalIntro: '任务：为 hotfix 分支添加一个工作树，然后确认列表。',
    createInitialState: () => {
      let state = createInitialState();
      state = executeCommand(state, 'git branch hotfix').state;
      return state;
    },
    steps: [
      {
        instruction: '把 hotfix 分支检出到新目录 ../hotfix。',
        acceptedCommands: ['git worktree add ../hotfix hotfix'],
        hint: '使用 git worktree add <路径> <分支>。',
        teachNote:
          'worktree 在新目录检出另一个分支，两个目录共享同一份仓库历史。和 clone 不同：它不复制历史，只是"同一仓库的第二个工作区"——省空间、改动互通。',
        validate: ({ nextState }) =>
          nextState.worktrees.length === 1 &&
          nextState.worktrees[0].branch === 'hotfix',
      },
      {
        instruction: '查看所有工作树，确认主工作树和新建的都在。',
        acceptedCommands: ['git worktree list'],
        hint: '使用 git worktree list。',
        teachNote:
          '列表第一行是主工作树（带 *），后面是挂载的。每个工作树可以待在不同分支上互不干扰。',
        validate: ({ result }) =>
          result.ok &&
          result.output.includes('hotfix') &&
          result.output.split('\n').length >= 2,
      },
    ],
  },
  {
    id: 'list-worktree',
    mode: 'interactive',
    title: '管理与清理工作树',
    description: '用完的工作树要及时清理，体验完整生命周期。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['add-worktree'],
    estimatedMinutes: 5,
    nextTaskId: 'rebase-i-cleanup',
    successMessage: '🎉 从挂起到清理，工作树的生命周期你已经走通了。',
    contextNote:
      '紧急修复完成，hotfix 分支已经合并回 main，挂载的工作树该清掉了。',
    terminalIntro: '任务：确认工作树列表，然后删除已经用完的 ../hotfix。',
    createInitialState: () => {
      let state = createInitialState();
      state = executeCommand(state, 'git branch hotfix').state;
      state = executeCommand(state, 'git worktree add ../hotfix hotfix').state;
      return state;
    },
    steps: [
      {
        instruction: '查看当前所有工作树。',
        acceptedCommands: ['git worktree list'],
        hint: '使用 git worktree list。',
        validate: ({ result }) =>
          result.ok && result.output.includes('../hotfix'),
      },
      {
        instruction: '删除已用完的 ../hotfix 工作树。',
        acceptedCommands: ['git worktree remove ../hotfix'],
        hint: '使用 git worktree remove <路径>。',
        teachNote:
          'remove 只删工作目录和挂载记录，分支和提交都在。清理完的仓库不再有多余的挂载点。',
        validate: ({ nextState }) => nextState.worktrees.length === 0,
      },
    ],
  },
  {
    id: 'rebase-i-cleanup',
    mode: 'interactive',
    title: '交互式变基：清理琐碎提交',
    description: '用 rebase -i 把 "wip" 琐碎提交从历史中清理掉，体验真正的历史整理。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['list-worktree'],
    estimatedMinutes: 10,
    nextTaskId: 'rebase-exec',
    successMessage: '🎉 你刚刚完成了真实开发中最有成就感的操作——把一团糟的提交历史整理成干净的三个提交。',
    contextNote:
      '你连续提交了三个历史：一个正经功能、一个 wip 草稿、一个验证修复。发 PR 之前，把 wip 清理掉。',
    terminalIntro: '任务：进入交互式变基，把 wip 提交 drop 掉，应用清单。',
    createInitialState: () => {
      let state = createInitialState({ staging: true });
      state = executeCommand(state, 'git commit -m "feat: login form"').state;
      state = { ...state, staging: true };
      state = executeCommand(state, 'git commit -m "wip: debug attempt"').state;
      state = { ...state, staging: true };
      state = executeCommand(state, 'git commit -m "feat: validate input"').state;
      return state;
    },
    steps: [
      {
        instruction: '对最近 3 个提交发起交互式变基。',
        acceptedCommands: ['git rebase -i HEAD~3'],
        hint: '使用 git rebase -i HEAD~3。',
        teachNote:
          '-i = interactive。HEAD~3 表示"最近 3 个提交"。真实 Git 会打开编辑器列出待办清单；沙盒把它模拟成可编辑的 rebase-todo 列表。',
        validate: ({ nextState }) => nextState.rebaseTodo !== null,
      },
      {
        instruction: '把第 2 项（wip）标记为 drop。',
        acceptedCommands: ['rebase-todo drop 2'],
        hint: '使用 rebase-todo drop 2（序号从 1 开始）。',
        teachNote:
          'drop = 从历史中删掉这个提交，它做的改动也一起消失。沙盒里用 rebase-todo <动作> <序号> 编辑清单，等价于真实编辑器里把 pick 改成 drop。',
        validate: ({ nextState }) =>
          nextState.rebaseTodo?.[1].action === 'drop',
      },
      {
        instruction: '应用清单，完成变基。',
        acceptedCommands: ['rebase-todo apply'],
        hint: '使用 rebase-todo apply。',
        teachNote:
          'apply 让 Git 按清单重放历史：保留的提交生成新副本，drop 的消失，fixup/squash 的并入前一项。重放后的历史就是清单的样子。',
        validate: ({ nextState, result }) => {
          const headId = nextState.HEAD.startsWith('ref: ')
            ? nextState.branches.get(nextState.HEAD.slice(5)) ?? null
            : nextState.HEAD;
          const head = headId ? nextState.commits.get(headId) : null;

          return (
            result.ok &&
            nextState.rebaseTodo === null &&
            head?.message === 'feat: validate input'
          );
        },
      },
      {
        instruction: '用 git log --oneline 确认历史里不再有 wip。',
        acceptedCommands: ['git log --oneline'],
        hint: '使用 git log --oneline，观察输出里是否还有 wip 字样。',
        teachNote:
          '验证是整理历史的最后一步：从 HEAD 往回数，确认每条提交都该在。重放生成了新哈希——原提交还在数据库里，reflog 可找回，这是安全网。',
        validate: ({ result }) =>
          result.ok && !result.output.includes('wip'),
      },
    ],
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
    id: 'bisect-hunt',
    mode: 'interactive',
    title: '用二分法定位问题提交',
    description: '某个版本突然坏了，用 bisect 缩圈找出第一个引入 bug 的提交。',
    difficulty: '高级',
    topic: '扩展概念',
    prerequisiteIds: ['view-reflog'],
    estimatedMinutes: 12,
    nextTaskId: null,
    successMessage: '🎉 你刚体验了 Git 侦探工作：7 步以内从上百个提交里锁定罪魁祸首。',
    contextNote:
      '用户报告搜索功能坏了（提交 c4），但上一个发布版 v1（0000002）是好的。用 bisect 缩圈定位。',
    terminalIntro: '任务：start → 确定好边界 → 判定坏点 → 锁定元凶 → reset 退出。',
    createInitialState: () => {
      let state = createInitialState({ staging: true });
      state = executeCommand(state, 'git commit -m "feat: search v1"').state;
      state = { ...state, staging: true };
      state = executeCommand(state, 'git commit -m "refactor: search module"').state;
      state = { ...state, staging: true };
      state = executeCommand(state, 'git commit -m "feat: search filters"').state;
      state = { ...state, staging: true };
      state = executeCommand(state, 'git commit -m "feat: search highlight"').state;
      return state;
    },
    steps: [
      {
        instruction: '进入二分查找模式（当前 HEAD 会自动标记为坏点）。',
        acceptedCommands: ['git bisect start'],
        hint: '使用 git bisect start。',
        teachNote:
          'start 进入二分模式并把当前 HEAD 标为已知坏点。此时还没有缩圈——需要一个"确定没问题"的提交作为另一端。',
        validate: ({ nextState }) => nextState.bisect !== null,
      },
      {
        instruction: '标记已知正常的提交 0000002 为好边界。',
        acceptedCommands: ['git bisect good 0000002'],
        hint: '使用 git bisect good 0000002。',
        teachNote:
          '好边界确定后，可疑区间就是 (好, 坏] 之间的提交。Git 立刻检出区间中点让你测试——每判定一次，剩余待测减半。',
        validate: ({ nextState }) => nextState.bisect?.goodId === '0000002',
      },
      {
        instruction:
          'Git 检出了中间提交。测试后确认这个版本就有问题，判定为坏。',
        acceptedCommands: ['git bisect bad'],
        hint: '使用 git bisect bad。',
        teachNote:
          '判定"当前检出的版本也是坏的"意味着：坏点在更早的方向。可疑区间向老的一侧收窄，Git 检出新的中点。',
        validate: ({ nextState, previousState }) =>
          nextState.bisect?.log.length === (previousState.bisect?.log.length ?? 0) + 1,
      },
      {
        instruction: '继续判定直到锁定第一个坏提交。',
        acceptedCommands: ['git bisect bad'],
        hint: '再执行一次 git bisect bad（这个场景里剩下的点都是坏的）。',
        teachNote:
          '区间只剩一个候选时，Git 直接宣布"这就是第一个坏提交"。100 个提交最多 7 次判定——这就是二分的威力。',
        validate: ({ nextState }) => nextState.bisect?.foundId != null,
      },
      {
        instruction: '确认锁定结果后，退出二分模式回到原分支。',
        acceptedCommands: ['git bisect reset'],
        hint: '使用 git bisect reset。',
        teachNote:
          'reset 退出二分模式、回到进入前的分支。忘了 reset 会一直停在历史中间的某个提交上（detached HEAD），这是 bisect 最常见的收尾失误。',
        validate: ({ nextState }) => nextState.bisect === null,
      },
    ],
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
    description: '先把仓库、克隆、状态、暂存、提交和历史这些核心动作跑通。',
    kind: 'core',
    taskIds: ['git-init', 'git-status', 'git-add', 'git-commit', 'git-log', 'git-clone'],
  },
  {
    id: 'core-branches',
    title: '分支协作',
    description: '理解分支创建、切换、合并，并亲手解决一次真实的合并冲突。',
    kind: 'core',
    taskIds: ['create-branch', 'merge-branch', 'resolve-merge-conflict'],
  },
  {
    id: 'core-remote',
    title: '远程协作',
    description: '和队友共享同一个远程仓库：推送自己的工作、同步别人的进度、处理推送冲突。',
    kind: 'core',
    taskIds: ['push-feature', 'pull-teammate-changes', 'push-rejected-recovery'],
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
    description: 'worktree、交互式变基和 bisect 已可动手；submodule/rerere 仍是概念题。',
    kind: 'concept',
    taskIds: [
      'rebase-i-cleanup',
      'bisect-hunt',
      'add-worktree',
      'list-worktree',
      'add-submodule',
      'init-submodules',
      'rebase-exec',
      'enable-rerere',
    ],
  },
];

export const advancedLabSections = practiceSections.filter(
  (section) => section.kind === 'lab'
);

/** 判断某章节是否全部可交互练习已完成（用于通关仪式） */
export function getSectionCompletion(
  sectionId: string,
  completedIds: Set<string>
): { total: number; done: number; allDone: boolean } {
  const section = practiceSections.find((s) => s.id === sectionId);
  if (!section) {
    return { total: 0, done: 0, allDone: false };
  }

  const interactiveIds = section.taskIds.filter((id) => interactivePracticeTaskIdSet.has(id));
  const done = interactiveIds.filter((id) => completedIds.has(id)).length;
  return { total: interactiveIds.length, done, allDone: interactiveIds.length > 0 && done === interactiveIds.length };
}

/** 找到章节的下一个章节（按 practiceSections 顺序） */
export function getNextSection(sectionId: string) {
  const index = practiceSections.findIndex((s) => s.id === sectionId);
  return index >= 0 && index < practiceSections.length - 1
    ? practiceSections[index + 1]
    : null;
}

export const interactivePracticeTasks = practiceTasks.filter(isInteractiveTask);
export const interactivePracticeTaskIds = interactivePracticeTasks.map(
  (task) => task.id
);
export const interactivePracticeTaskIdSet = new Set(interactivePracticeTaskIds);

/**
 * 学习路径推荐：基于完成情况推荐"接下来最值得做的一课"。
 *
 * 优先级：
 * 1. 章节顺序遍历，找到第一个未完成的可交互任务
 * 2. 若该任务的前置未完成，沿着前置链回溯到最早未完成的那一课
 * 3. 全部完成时返回 null
 */
export function getRecommendedTask(completedIds: Set<string>): PracticeTask | null {
  for (const section of practiceSections) {
    for (const id of section.taskIds) {
      const task = getPracticeTaskById(id);
      if (!task || !isInteractiveTask(task) || completedIds.has(id)) {
        continue;
      }

      // 沿前置链回溯：找最早未完成的前置
      let candidate: PracticeTask = task;
      const visited = new Set<string>();
      while (true) {
        if (visited.has(candidate.id)) break;
        visited.add(candidate.id);

        let unfinishedPrereq: InteractivePracticeTask | undefined;
        for (const pid of candidate.prerequisiteIds) {
          const p = getPracticeTaskById(pid);
          if (p && isInteractiveTask(p) && !completedIds.has(p.id)) {
            unfinishedPrereq = p;
            break;
          }
        }

        if (!unfinishedPrereq) {
          break;
        }
        candidate = unfinishedPrereq;
      }

      return candidate;
    }
  }

  return null;
}

/** 计算每个主题的掌握度（完成数/总数），用于找薄弱区 */
export function getTopicMastery(completedIds: Set<string>): Array<{
  topic: PracticeTopic;
  done: number;
  total: number;
  percent: number;
}> {
  const topics = new Map<PracticeTopic, { done: number; total: number }>();

  for (const task of interactivePracticeTasks) {
    const entry = topics.get(task.topic) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (completedIds.has(task.id)) {
      entry.done += 1;
    }
    topics.set(task.topic, entry);
  }

  return Array.from(topics.entries()).map(([topic, { done, total }]) => ({
    topic,
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  }));
}

/** 找掌握度最低且未全部完成的主题（有"可推荐练习"的），用于弱项提示 */
export function getWeakestTopic(completedIds: Set<string>): {
  topic: PracticeTopic;
  percent: number;
  nextTask: InteractivePracticeTask | null;
} | null {
  const mastery = getTopicMastery(completedIds)
    .filter((m) => m.percent < 100)
    .sort((a, b) => a.percent - b.percent);

  for (const m of mastery) {
    const nextTask =
      interactivePracticeTasks.find(
        (task) => task.topic === m.topic && !completedIds.has(task.id)
      ) ?? null;
    if (nextTask) {
      return { topic: m.topic, percent: m.percent, nextTask };
    }
  }

  return null;
}
