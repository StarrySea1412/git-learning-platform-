export interface GitCommit {
  id: string;
  message: string;
  parents: string[];
  /** config.js 的"内容"值，用于模拟文件级合并冲突 */
  configValue?: string;
}

export interface ReflogEntry {
  action: string;
  from: string | null;
  to: string | null;
}

export interface RemoteRepo {
  url: string;
  commits: Map<string, GitCommit>;
  branches: Map<string, string>;
}

export interface MergeConflict {
  file: string;
  base: string;
  ours: string;
  theirs: string;
  sourceBranch: string;
}

export interface WorktreeEntry {
  path: string;
  branch: string | null; // null 表示 detached HEAD
  head: string;
}

export interface RebaseTodoItem {
  action: 'pick' | 'fixup' | 'squash' | 'drop';
  commitId: string;
  message: string;
}

export interface GitState {
  commits: Map<string, GitCommit>;
  branches: Map<string, string>;
  HEAD: string; // "ref: branchName" or commit id (detached)
  staging: boolean;
  workingTreeDirty: boolean;
  stash: {
    message: string;
    hadStaging: boolean;
    hadWorkingTreeChanges: boolean;
  } | null;
  reflog: ReflogEntry[];
  remote: RemoteRepo | null;
  remoteTracking: Map<string, string>; // "origin/<branch>" -> 本地图中的提交 id
  upstream: Map<string, string>; // "<branch>" -> "origin/<branch>"
  tags: Map<string, string>; // tag 名 -> 提交 id
  worktrees: WorktreeEntry[]; // 关联的工作树（主工作树之外的）
  rebaseTodo: RebaseTodoItem[] | null; // 交互式变基的待办清单（编辑中）
  mergeConflict: MergeConflict | null; // 冲突进行中（等待 resolve-conflict）
}

export interface CreateCollaborationStateOptions {
  url?: string;
  /** 双方共有的历史提交（依次落在 main 上） */
  sharedMessages?: string[];
  /** 队友已推送到远程、本地还没有 fetch 的提交 */
  teammateMessages?: string[];
  /** 本地领先远程的提交（会与队友的提交分叉） */
  localMessages?: string[];
}

export interface InteractivePracticeTaskConfig {
  /** 用户完成第几步后，虚拟队友向 origin/main 推送新提交 */
  triggerAfterStep: number;
  /** 队友推送的提交信息 */
  message: string;
}

export interface CreateInitialStateOptions {
  staging?: boolean;
  workingTreeDirty?: boolean;
  /** config.js 的初始内容（冲突模拟用） */
  configValue?: string;
}

export interface ExecResult {
  ok: boolean;
  output: string;
  state: GitState;
  reason?: 'unsupported' | 'invalid' | 'ok';
}

/**
 * 虚拟队友：练习进行中，队友"突然"往 origin/main 推送一个新提交。
 * 只改远程和队友视角，本地仓库（含 origin/main 镜像）保持不动——
 * 需要用户自己 fetch 才能发现，这正是要训练的肌肉记忆。
 */
export function teammatePush(state: GitState, message: string): ExecResult {
  if (!state.remote) {
    return invalid(state, '当前仓库没有远程仓库，队友无处推送。');
  }

  const next = cloneState(state);
  const remote = next.remote!;
  const remoteHead = remote.branches.get('main');

  if (!remoteHead || !remote.commits.has(remoteHead)) {
    return invalid(state, '远程仓库状态异常，无法模拟队友推送。');
  }

  const id = shortId();
  remote.commits.set(id, {
    id,
    message,
    parents: [remoteHead],
  });
  remote.branches.set('main', id);

  return success(
    next,
    [
      `🔔 你的队友刚刚向 origin/main 推送了一个新提交：`,
      `   ${id.slice(0, 7)} ${message}`,
      `你本地的 origin/main 镜像还没有更新——先 fetch 看看？`,
    ].join('\n')
  );
}

let _seq = 0;

function shortId(): string {
  _seq += 1;
  return _seq.toString(16).padStart(7, '0');
}

export function cloneState(state: GitState): GitState {
  return {
    commits: new Map(state.commits),
    branches: new Map(state.branches),
    HEAD: state.HEAD,
    staging: state.staging,
    workingTreeDirty: state.workingTreeDirty,
    stash: state.stash ? { ...state.stash } : null,
    reflog: [...state.reflog],
    remote: state.remote
      ? {
          url: state.remote.url,
          commits: new Map(state.remote.commits),
          branches: new Map(state.remote.branches),
        }
      : null,
    remoteTracking: new Map(state.remoteTracking),
    upstream: new Map(state.upstream),
    tags: new Map(state.tags),
    worktrees: state.worktrees.map((w) => ({ ...w })),
    rebaseTodo: state.rebaseTodo ? state.rebaseTodo.map((t) => ({ ...t })) : null,
    mergeConflict: state.mergeConflict ? { ...state.mergeConflict } : null,
  };
}

export function createInitialState(
  options: CreateInitialStateOptions = {}
): GitState {
  _seq = 0;
  const initId = shortId();
  const initCommit: GitCommit = {
    id: initId,
    message: 'initial commit',
    parents: [],
    configValue: options.configValue ?? 'log_level=info',
  };

  return {
    commits: new Map([[initId, initCommit]]),
    branches: new Map([['main', initId]]),
    HEAD: 'ref: main',
    staging: options.staging ?? false,
    workingTreeDirty: options.workingTreeDirty ?? false,
    stash: null,
    reflog: [
      {
        action: 'init',
        from: null,
        to: initId,
      },
    ],
    remote: null,
    remoteTracking: new Map(),
    upstream: new Map(),
    tags: new Map(),
    worktrees: [],
    rebaseTodo: null,
    mergeConflict: null,
  };
}

/**
 * 构建一个"本地 + 远程"双仓库的协作场景：
 * 双方共享 sharedMessages 历史；队友的提交只存在于远程；
 * 本地的 origin/main 停留在共享历史末端，需要 fetch 之后才能看到队友的工作。
 */
export function createCollaborationState(
  options: CreateCollaborationStateOptions = {}
): GitState {
  const {
    url = 'https://github.com/team/project.git',
    sharedMessages = [],
    teammateMessages = [],
    localMessages = [],
  } = options;

  let state = createInitialState();
  const seedMessages = [...sharedMessages, ...localMessages];

  for (const message of seedMessages) {
    const prepared = cloneState(state);
    prepared.staging = true;
    const result = executeCommand(prepared, `git commit -m "${message}"`);
    if (!result.ok) {
      throw new Error(`Collaboration seed command failed: ${message}`);
    }
    state = result.state;
  }

  // 本地 main 的完整提交链（根 -> 头部）；去掉本地独有的尾部，剩下的就是共享历史
  const mainHeadId = state.branches.get('main');
  if (!mainHeadId) {
    throw new Error('Collaboration scenario requires a main branch.');
  }

  const chain: string[] = [];
  let walk: string | null = mainHeadId;
  while (walk) {
    chain.unshift(walk);
    walk = state.commits.get(walk)?.parents[0] ?? null;
  }

  const sharedIds = chain.slice(0, chain.length - localMessages.length);
  const sharedTip = sharedIds[sharedIds.length - 1];

  const remote: RemoteRepo = {
    url,
    commits: new Map(),
    branches: new Map([['main', sharedTip]]),
  };

  // 共享历史在远程仓库里是同一批对象
  for (const id of sharedIds) {
    const commit = state.commits.get(id);
    if (commit) {
      remote.commits.set(id, { ...commit });
    }
  }

  // 队友在远程 main 上继续提交，本地还看不到
  let teammateParent = sharedTip;
  let teammateHead = sharedTip;
  for (const message of teammateMessages) {
    const id = shortId();
    remote.commits.set(id, { id, message, parents: [teammateParent] });
    teammateParent = id;
    teammateHead = id;
  }
  remote.branches.set('main', teammateHead);

  const next = cloneState(state);
  next.remote = remote;
  next.remoteTracking.set('origin/main', sharedTip);
  next.upstream.set('main', 'origin/main');
  return next;
}

export function getHeadCommit(state: GitState): string | null {
  if (state.HEAD.startsWith('ref: ')) {
    const branch = state.HEAD.slice(5);
    return state.branches.get(branch) ?? null;
  }

  return state.HEAD;
}

export function getHeadBranch(state: GitState): string | null {
  if (state.HEAD.startsWith('ref: ')) {
    return state.HEAD.slice(5);
  }

  return null;
}

function success(state: GitState, output: string): ExecResult {
  return { ok: true, output, state, reason: 'ok' };
}

function invalid(state: GitState, output: string): ExecResult {
  return { ok: false, output, state, reason: 'invalid' };
}

function unsupported(state: GitState, output: string): ExecResult {
  return { ok: false, output, state, reason: 'unsupported' };
}

function appendReflog(
  state: GitState,
  action: string,
  from: string | null,
  to: string | null
): GitState {
  const next = cloneState(state);
  next.reflog = [{ action, from, to }, ...next.reflog].slice(0, 20);
  return next;
}

function getShortId(id: string | null): string {
  return id ? id.slice(0, 7) : 'null';
}

function getHeadLabel(state: GitState): string {
  return getHeadBranch(state) ?? 'detached';
}

function isAncestor(
  state: GitState,
  ancestorId: string,
  descendantId: string
): boolean {
  const queue = [descendantId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    if (current === ancestorId) {
      return true;
    }

    visited.add(current);
    const commit = state.commits.get(current);
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return false;
}

function findCommonAncestor(
  state: GitState,
  leftId: string,
  rightId: string
): string | null {
  const leftAncestors = new Set<string>();
  const queue = [leftId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || leftAncestors.has(current)) {
      continue;
    }

    leftAncestors.add(current);
    const commit = state.commits.get(current);
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  const rightQueue = [rightId];
  const visited = new Set<string>();

  while (rightQueue.length > 0) {
    const current = rightQueue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    if (leftAncestors.has(current)) {
      return current;
    }

    visited.add(current);
    const commit = state.commits.get(current);
    if (commit) {
      rightQueue.push(...commit.parents);
    }
  }

  return null;
}

function collectLinearCommitsSince(
  state: GitState,
  fromId: string,
  stopId: string | null
): GitCommit[] {
  const commits: GitCommit[] = [];
  let current: string | null = fromId;

  while (current && current !== stopId) {
    const commit = state.commits.get(current);
    if (!commit) {
      break;
    }

    commits.push(commit);
    current = commit.parents[0] ?? null;
  }

  return commits.reverse();
}

function resolveHeadAncestor(state: GitState, distance: number): string | null {
  let current = getHeadCommit(state);
  let remaining = distance;

  while (current && remaining > 0) {
    const commit = state.commits.get(current);
    current = commit?.parents[0] ?? null;
    remaining -= 1;
  }

  return current;
}

function resolveReflogReference(state: GitState, ref: string): string | null {
  const match = ref.match(/^HEAD@\{(\d+)\}$/);
  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  return state.reflog[index]?.to ?? null;
}

function resolveCommitish(state: GitState, ref: string): string | null {
  if (ref === 'HEAD') {
    return getHeadCommit(state);
  }

  const reflogTarget = resolveReflogReference(state, ref);
  if (reflogTarget) {
    return reflogTarget;
  }

  const headAncestorMatch = ref.match(/^HEAD~(\d+)$/);
  if (headAncestorMatch) {
    return resolveHeadAncestor(state, Number(headAncestorMatch[1]));
  }

  const branchRef = state.branches.get(ref);
  if (branchRef) {
    return branchRef;
  }

  if (state.commits.has(ref)) {
    return ref;
  }

  const prefixMatches = Array.from(state.commits.keys()).filter((id) =>
    id.startsWith(ref)
  );

  return prefixMatches.length === 1 ? prefixMatches[0] : null;
}

function countCommitsNotIn(
  state: GitState,
  fromId: string | null,
  excludeId: string | null
): number {
  if (!fromId) {
    return 0;
  }

  const excluded = new Set<string>();
  const excludeQueue = [excludeId];
  while (excludeQueue.length > 0) {
    const current = excludeQueue.shift();
    if (!current || excluded.has(current)) {
      continue;
    }
    excluded.add(current);
    const commit = state.commits.get(current);
    if (commit) {
      excludeQueue.push(...commit.parents);
    }
  }

  const queue = [fromId];
  const visited = new Set<string>();
  let count = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current) || excluded.has(current)) {
      continue;
    }
    visited.add(current);
    count += 1;
    const commit = state.commits.get(current);
    if (commit) {
      queue.push(...commit.parents);
    }
  }

  return count;
}

function getAheadBehind(
  state: GitState,
  branch: string
): { ahead: number; behind: number } | null {
  const upstreamRef = state.upstream.get(branch);
  const trackingId = upstreamRef ? state.remoteTracking.get(upstreamRef) : null;
  if (!upstreamRef || !trackingId) {
    return null;
  }

  const branchHead = state.branches.get(branch) ?? null;
  return {
    ahead: countCommitsNotIn(state, branchHead, trackingId),
    behind: countCommitsNotIn(state, trackingId, branchHead),
  };
}

function buildStatusOutput(state: GitState, short = false): string {
  const branch = getHeadBranch(state);
  const aheadBehind = branch ? getAheadBehind(state, branch) : null;

  if (short) {
    const lines: string[] = [];
    if (state.staging) {
      lines.push('A  example.txt');
    }
    if (state.workingTreeDirty) {
      lines.push(' M example.txt');
    }
    if (branch && aheadBehind) {
      if (aheadBehind.behind > 0) {
        lines.push(`## ${branch}...${state.upstream.get(branch)} [behind ${aheadBehind.behind}]`);
      } else if (aheadBehind.ahead > 0) {
        lines.push(`## ${branch}...${state.upstream.get(branch)} [ahead ${aheadBehind.ahead}]`);
      } else {
        lines.push(`## ${branch}...${state.upstream.get(branch)}`);
      }
    }
    return lines.length > 0 ? lines.join('\n') : '';
  }

  const branchLine = branch
    ? `位于分支 ${branch}`
    : 'HEAD 处分离状态（detached HEAD）';

  const details: string[] = [branchLine];

  if (branch) {
    const aheadBehind = getAheadBehind(state, branch);
    if (aheadBehind && aheadBehind.ahead === 0 && aheadBehind.behind > 0) {
      details.push(
        `您的分支落后 '${state.upstream.get(branch)}' 共 ${aheadBehind.behind} 个提交，并且可以快进合并。`
      );
    } else if (aheadBehind && aheadBehind.behind === 0 && aheadBehind.ahead > 0) {
      details.push(
        `您的分支领先 '${state.upstream.get(branch)}' 共 ${aheadBehind.ahead} 个提交。`
      );
    } else if (
      aheadBehind &&
      aheadBehind.ahead > 0 &&
      aheadBehind.behind > 0
    ) {
      details.push(
        `您的分支和 '${state.upstream.get(
          branch
        )}' 出现了偏离，并且分别有 ${aheadBehind.ahead} 个和 ${
          aheadBehind.behind
        } 个不同的提交。`
      );
    }
  }

  if (state.staging) {
    details.push('要提交的更改：');
    details.push('  新文件: example.txt');
  }

  if (state.workingTreeDirty) {
    details.push('尚未暂存的更改：');
    details.push('  修改: example.txt');
  }

  if (!state.staging && !state.workingTreeDirty) {
    details.push('工作区干净，没有可提交内容。');
  }

  return details.join('\n');
}

function buildLogOutput(state: GitState, oneline: boolean): string {
  const headId = getHeadCommit(state);
  if (!headId) {
    return '';
  }

  const lines: string[] = [];
  const visited = new Set<string>();
  let current: string | null = headId;

  while (current && !visited.has(current)) {
    visited.add(current);
    const commit = state.commits.get(current);
    if (!commit) {
      break;
    }

    if (oneline) {
      lines.push(`${commit.id.slice(0, 7)} ${commit.message}`);
    } else {
      lines.push(`commit ${commit.id}`);
      lines.push(`    ${commit.message}`);
      lines.push('');
    }

    current = commit.parents[0] ?? null;
  }

  return oneline ? lines.join('\n') : lines.join('\n').trim();
}

function buildReflogOutput(state: GitState): string {
  return state.reflog
    .map(
      (entry, index) =>
        `${getShortId(entry.to)} HEAD@{${index}}: ${entry.action} (${getShortId(
          entry.from
        )} -> ${getShortId(entry.to)})`
    )
    .join('\n');
}

function getUnsupportedMessage(command: string): string {
  return `命令 "${command}" 暂未在沙盒中支持。`;
}

function createCommitFromHead(
  state: GitState,
  message: string,
  action: string,
  configValue?: string
): ExecResult {
  const headId = getHeadCommit(state);
  if (!headId) {
    return invalid(state, '当前 HEAD 无法解析到任何提交。');
  }

  const id = shortId();
  const next = cloneState(state);
  next.commits.set(id, {
    id,
    message,
    parents: [headId],
    configValue:
      configValue ??
      state.commits.get(headId)?.configValue ??
      'log_level=info',
  });

  const branch = getHeadBranch(next);
  if (branch) {
    next.branches.set(branch, id);
    next.HEAD = `ref: ${branch}`;
  } else {
    next.HEAD = id;
  }

  next.staging = false;
  next.workingTreeDirty = false;

  const withReflog = appendReflog(next, action, headId, id);
  return success(
    withReflog,
    `[${branch || 'detached'} ${id.slice(0, 7)}] ${message}`
  );
}

function performReset(
  state: GitState,
  targetCommit: string,
  action: string,
  mode: 'soft' | 'hard'
): ExecResult {
  const headId = getHeadCommit(state);
  if (!headId) {
    return invalid(state, '当前 HEAD 无法解析到任何提交。');
  }

  const branch = getHeadBranch(state);
  const next = cloneState(state);

  if (branch) {
    next.branches.set(branch, targetCommit);
    next.HEAD = `ref: ${branch}`;
  } else {
    next.HEAD = targetCommit;
  }

  next.staging = mode === 'soft';
  next.workingTreeDirty = false;

  const withReflog = appendReflog(next, action, headId, targetCommit);
  return success(
    withReflog,
    `HEAD 已移动到 ${targetCommit.slice(0, 7)}。`
  );
}

function ensureRemote(state: GitState, remoteName: string): RemoteRepo | null {
  if (!state.remote) {
    return null;
  }
  return remoteName === 'origin' ? state.remote : null;
}

function fetchFromRemote(state: GitState, remoteName: string): ExecResult {
  if (!state.remote) {
    return invalid(
      state,
      '当前仓库没有配置远程仓库，请先执行 git remote add origin <url>。'
    );
  }

  if (!ensureRemote(state, remoteName)) {
    return invalid(state, `远程仓库 "${remoteName}" 不存在。`);
  }

  const next = cloneState(state);
  const remote = next.remote!;
  const lines: string[] = [`From ${remote.url}`];

  for (const [branch, headId] of Array.from(remote.branches.entries())) {
    const queue = [headId];
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id || next.commits.has(id)) {
        continue;
      }
      const commit = remote.commits.get(id);
      if (!commit) {
        break;
      }
      next.commits.set(id, { ...commit });
      queue.push(...commit.parents);
    }

    const trackingRef = `origin/${branch}`;
    const previous = next.remoteTracking.get(trackingRef);
    next.remoteTracking.set(trackingRef, headId);

    if (previous !== headId) {
      lines.push(
        previous
          ? `   ${previous.slice(0, 7)}..${headId.slice(0, 7)}  ${branch} -> ${trackingRef}`
          : ` * [new branch]      ${branch} -> ${trackingRef}`
      );
    }
  }

  return success(next, lines.join('\n'));
}

function pullFromRemote(
  state: GitState,
  remoteName: string,
  branchArg: string | null
): ExecResult {
  if (!state.remote) {
    return invalid(
      state,
      '当前仓库没有配置远程仓库，请先执行 git remote add origin <url>。'
    );
  }
  if (!ensureRemote(state, remoteName)) {
    return invalid(state, `远程仓库 "${remoteName}" 不存在。`);
  }

  const currentBranch = getHeadBranch(state);
  if (!currentBranch) {
    return invalid(state, '分离 HEAD 状态下不支持 pull。');
  }

  const fetched = fetchFromRemote(state, remoteName);
  if (!fetched.ok) {
    return fetched;
  }

  const next = fetched.state;
  const targetRef = branchArg
    ? `origin/${branchArg}`
    : next.upstream.get(currentBranch) ?? null;

  if (!targetRef) {
    return invalid(
      next,
      `当前分支没有设置上游分支，请使用 git pull ${remoteName} <分支名>。`
    );
  }

  const trackingId = next.remoteTracking.get(targetRef) ?? null;
  if (!trackingId || !next.commits.has(trackingId)) {
    return invalid(next, `远程分支 "${targetRef}" 不存在，请先 git fetch。`);
  }

  const headId = getHeadCommit(next);
  if (!headId) {
    return invalid(next, '当前 HEAD 无法解析到任何提交。');
  }

  if (headId === trackingId || isAncestor(next, trackingId, headId)) {
    return success(next, 'Already up to date.');
  }

  if (next.staging || next.workingTreeDirty) {
    return invalid(
      next,
      '工作区或暂存区还有未完成的改动，请先提交或 stash，再执行 pull。'
    );
  }

  if (isAncestor(next, headId, trackingId)) {
    next.branches.set(currentBranch, trackingId);
    next.HEAD = `ref: ${currentBranch}`;

    const withReflog = appendReflog(
      next,
      `merge ${targetRef}: Fast-forward`,
      headId,
      trackingId
    );
    return success(
      withReflog,
      `Updating ${headId.slice(0, 7)}..${trackingId.slice(0, 7)}\nFast-forward`
    );
  }

  const id = shortId();
  next.commits.set(id, {
    id,
    message: `Merge remote-tracking branch '${targetRef}'`,
    parents: [headId, trackingId],
  });
  next.branches.set(currentBranch, id);
  next.HEAD = `ref: ${currentBranch}`;
  next.staging = false;
  next.workingTreeDirty = false;

  const withReflog = appendReflog(next, `merge ${targetRef}`, headId, id);
  return success(withReflog, `Merge made by the 'ort' strategy.`);
}

function pushToRemote(
  state: GitState,
  remoteName: string,
  branchArg: string | null,
  setUpstream: boolean
): ExecResult {
  if (!state.remote) {
    return invalid(
      state,
      '当前仓库没有配置远程仓库，请先执行 git remote add origin <url>。'
    );
  }
  if (!ensureRemote(state, remoteName)) {
    return invalid(state, `远程仓库 "${remoteName}" 不存在。`);
  }

  const branch = branchArg ?? getHeadBranch(state);
  if (!branch) {
    return invalid(state, '分离 HEAD 状态下不支持 push，请指定分支名。');
  }

  const headId = state.branches.get(branch);
  if (!headId) {
    return invalid(state, `分支 "${branch}" 不存在。`);
  }

  if (!branchArg && !setUpstream && !state.upstream.has(branch)) {
    return invalid(
      state,
      `当前分支没有上游分支。\nhint: 请使用 git push -u origin ${branch} 推送并建立跟踪关系。`
    );
  }

  const next = cloneState(state);
  const remote = next.remote!;
  const remoteHead = remote.branches.get(branch);

  if (remoteHead && remoteHead !== headId) {
    const fastForwardable =
      state.commits.has(remoteHead) && isAncestor(state, remoteHead, headId);
    if (!fastForwardable) {
      return invalid(
        state,
        `To ${remote.url}\n ! [rejected]        ${branch} -> ${branch} (non-fast-forward)\nerror: 无法推送一些引用到 '${remote.url}'\nhint: 更新被拒绝，因为远程包含你本地还没有的工作。\nhint: 先执行 git fetch 查看远程状态，再用 git pull 整合远程更改，然后重新推送。`
      );
    }
  }

  if (remoteHead === headId) {
    return success(state, 'Everything up-to-date');
  }

  const queue = [headId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || remote.commits.has(id)) {
      continue;
    }
    const commit = next.commits.get(id);
    if (!commit) {
      continue;
    }
    remote.commits.set(id, { ...commit });
    queue.push(...commit.parents);
  }

  remote.branches.set(branch, headId);
  if (setUpstream) {
    next.upstream.set(branch, `origin/${branch}`);
  }

  const lines: string[] = [`To ${remote.url}`];
  if (remoteHead) {
    lines.push(
      `   ${remoteHead.slice(0, 7)}..${headId.slice(0, 7)}  ${branch} -> ${branch}`
    );
  } else {
    lines.push(` * [new branch]      ${branch} -> ${branch}`);
  }
  if (setUpstream) {
    lines.push(`分支 '${branch}' 设置为跟踪 'origin/${branch}'。`);
  }

  return success(next, lines.join('\n'));
}

export function executeCommand(state: GitState, input: string): ExecResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return invalid(state, '请输入一条 Git 命令。');
  }

  const command = trimmed.replace(/\s+/g, ' ');
  const parts = command.split(' ');

  if (parts[0] !== 'git') {
    // 本平台的辅助命令（模拟冲突解决界面操作）
    if (command === 'resolve-conflict' || parts[0] === 'resolve-conflict') {
      if (!state.mergeConflict) {
        return invalid(state, '当前没有待解决的合并冲突。');
      }

      const choice = parts[1];
      const conflict = state.mergeConflict;
      if (choice !== 'ours' && choice !== 'theirs' && choice !== 'both') {
        return invalid(
          state,
          [
            `config.js 中的冲突内容:`,
            `<<<<<<< HEAD（当前分支）`,
            conflict.ours,
            '=======',
            conflict.theirs,
            `>>>>>>> ${conflict.sourceBranch}`,
            ``,
            `使用 resolve-conflict ours|theirs|both 选择保留方案。`,
          ].join('\n')
        );
      }

      const headId = getHeadCommit(state);
      if (!headId) {
        return invalid(state, '当前 HEAD 无法解析到任何提交。');
      }

      const currentBranch = getHeadBranch(state);
      if (!currentBranch) {
        return invalid(state, '分离 HEAD 状态下不支持合并。');
      }

      const resolvedValue =
        choice === 'ours'
          ? conflict.ours
          : choice === 'theirs'
            ? conflict.theirs
            : `${conflict.ours} + ${conflict.theirs}`;

      const id = shortId();
      const next = cloneState(state);
      next.commits.set(id, {
        id,
        message: `Merge branch '${conflict.sourceBranch}' (resolved: ${choice})`,
        parents: [headId, state.branches.get(conflict.sourceBranch) ?? headId],
        configValue: resolvedValue,
      });
      next.branches.set(currentBranch, id);
      next.HEAD = `ref: ${currentBranch}`;
      next.mergeConflict = null;
      next.workingTreeDirty = false;

      const withReflog = appendReflog(
        next,
        `merge ${conflict.sourceBranch}`,
        headId,
        id
      );
      return success(
        withReflog,
        [
          `已按 "${choice}" 方案解决 config.js 冲突。`,
          `config.js -> ${resolvedValue}`,
          "Merge made by the 'ort' strategy.",
        ].join('\n')
      );
    }

    // 本平台的辅助命令（交互式变基的待办清单）
    if (parts[0] === 'rebase-todo') {
      if (!state.rebaseTodo) {
        return invalid(state, '当前没有进行中的交互式变基，先执行 git rebase -i HEAD~<n>。');
      }

      // rebase-todo <action> <序号>：编辑待办清单项（序号从 1 开始）
      if (parts[1] !== 'apply' && parts[1] !== 'show') {
        const actionName = parts[1];
        const index = Number(parts[2]) - 1;
        const validActions = ['pick', 'fixup', 'squash', 'drop'];

        if (
          !validActions.includes(actionName ?? '') ||
          !Number.isInteger(index) ||
          index < 0 ||
          index >= state.rebaseTodo.length
        ) {
          return invalid(
            state,
            `用法: rebase-todo <pick|fixup|squash|drop> <序号>（序号 1~${state.rebaseTodo.length}），或 rebase-todo apply 应用清单。`
          );
        }

        const edited = cloneState(state);
        edited.rebaseTodo = edited.rebaseTodo!.map((item, i) =>
          i === index ? { ...item, action: actionName as RebaseTodoItem['action'] } : item
        );

        return success(
          edited,
          [
            `已将第 ${index + 1} 项改为 ${actionName}。当前清单:`,
            ...edited.rebaseTodo.map(
              (t) => `  ${t.action.padEnd(6)} ${t.commitId.slice(0, 7)} ${t.message}`
            ),
            '',
            '继续编辑或执行: rebase-todo apply',
          ].join('\n')
        );
      }

      if (parts[1] === 'show') {
        return success(
          state,
          state.rebaseTodo
            .map((t) => `${t.action.padEnd(6)} ${t.commitId.slice(0, 7)} ${t.message}`)
            .join('\n')
        );
      }

      // rebase-todo apply：应用待办清单，重放提交
      const currentBranch = getHeadBranch(state);
      if (!currentBranch) {
        return invalid(state, '分离 HEAD 状态下不支持交互式变基。');
      }

      const headId = getHeadCommit(state);
      if (!headId) {
        return invalid(state, '当前 HEAD 无法解析到任何提交。');
      }
      // 重放的基底 = 清单里第一个提交的父提交（不是当前 HEAD 的父——
      // apply 时 HEAD 仍在原始历史顶端，但清单可能只覆盖最近 n 个提交）
      const firstTodo = state.rebaseTodo[0];
      const baseCommit =
        state.commits.get(firstTodo.commitId)?.parents[0] ??
        state.commits.get(headId)?.parents[0] ??
        null;

      const plan = state.rebaseTodo;
      const drops = plan.filter((t) => t.action === 'drop');
      if (drops.length === plan.length) {
        return invalid(state, '不能 drop 全部提交，至少保留一个。');
      }

      const next = cloneState(state);
      let parent: string | null = baseCommit;

      // 先按序把 pick 链接起来（不含 drop）；fixup/squash 与前面的提交合并
      const kept = plan.filter((t) => t.action !== 'drop');
      const mergedCount = kept.length - kept.filter((t) => t.action === 'pick').length;

      for (const item of kept) {
        const sourceCommit = state.commits.get(item.commitId);
        const configValue = sourceCommit?.configValue;

        // fixup/squash 简化语义：与前一提交合并 = 沿用前一新提交的消息与内容，
        // 这里等价于"跳过单独成提交"，但因为消息要保留第一条 pick 的，
        // 直接在重放时把 fixup/squash 项的消息并入前一项即可。
        // 实现：pick 新建提交；fixup/squash 不新建。
        if (item.action === 'pick') {
          const id = shortId();
          next.commits.set(id, {
            id,
            message: item.message,
            parents: [parent!],
            configValue:
              configValue ?? next.commits.get(parent!)?.configValue ?? 'log_level=info',
          });
          parent = id;
        }
      }

      next.branches.set(currentBranch, parent!);
      next.HEAD = `ref: ${currentBranch}`;
      next.rebaseTodo = null;

      const withReflog = appendReflog(
        next,
        `rebase -i (applied ${plan.length - drops.length})`,
        headId,
        parent!
      );
      const squashed = plan.filter(
        (t) => t.action === 'fixup' || t.action === 'squash'
      ).length;
      const dropped = drops.length;
      return success(
        withReflog,
        [
          `交互式变基完成：${plan.length - dropped - squashed} 个提交保留`,
          squashed > 0 ? `${squashed} 个提交被合并` : '',
          dropped > 0 ? `${dropped} 个提交被删除` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    return unsupported(state, '当前沙盒仅支持 Git 命令。');
  }

  if (command === 'git init' || /^git init \S+$/.test(command)) {
    return success(createInitialState(), '已初始化一个新的 Git 仓库。');
  }

  if (parts[1] === 'clone' && parts.length >= 3) {
    const url = parts[2];
    const nameMatch = url.match(/\/([^/]+?)(?:\.git)?\/?$/);
    const repoName = parts[3] ?? nameMatch?.[1] ?? 'repo';

    // 克隆 = 在本地重建远程的全部历史，并配置 origin 跟踪
    const cloned = createCollaborationState({ url });
    const next = cloneState(cloned);
    next.HEAD = 'ref: main';

    const reflog = appendReflog(
      next,
      `clone: from ${url}`,
      null,
      next.remoteTracking.get('origin/main') ?? null
    );
    return success(
      reflog,
      [
        `Cloning into '${repoName}'...`,
        'remote: Enumerating objects: done, done.',
        `已克隆远程仓库 "${url}"，并配置 origin 跟踪。`,
        `当前位于 main 分支，跟踪 origin/main。`,
      ].join('\n')
    );
  }

  if (
    command === 'git add .' ||
    command === 'git add --all' ||
    command === 'git add -A'
  ) {
    if (state.mergeConflict) {
      return invalid(
        state,
        '存在未解决的合并冲突，请先执行 resolve-conflict 解决冲突。'
      );
    }

    if (!state.workingTreeDirty) {
      return invalid(state, '没有检测到可暂存的工作区改动。');
    }

    const next = cloneState(state);
    next.staging = true;
    next.workingTreeDirty = false;
    return success(next, '已将工作区改动加入暂存区。');
  }

  if (parts[1] === 'add' && parts.length >= 3) {
    if (!state.workingTreeDirty) {
      return invalid(state, '没有检测到可暂存的工作区改动。');
    }

    const next = cloneState(state);
    next.staging = true;
    next.workingTreeDirty = false;
    return success(next, '已将工作区改动加入暂存区。');
  }

  if (parts[1] === 'commit') {
    const allowEmpty = command.includes('--allow-empty');
    const isAmend = command.includes('--amend');

    if (!state.staging && !allowEmpty && !isAmend) {
      return invalid(state, '没有可提交的内容，请先执行 git add。');
    }

    const msgMatch = command.match(
      /git commit(?: --allow-empty)?(?: --amend)? -m ["'](.+?)["']/
    );
    const message = msgMatch?.[1];
    if (!message) {
      return invalid(state, '请使用 git commit -m "提交信息" 提交。');
    }

    // --amend: 修补最近一次提交（替换 HEAD，保留父链）
    if (command.includes('--amend')) {
      const headId = getHeadCommit(state);
      if (!headId) {
        return invalid(state, '当前 HEAD 无法解析到任何提交。');
      }
      const headCommit = state.commits.get(headId);
      if (!headCommit || headCommit.parents.length === 0) {
        return invalid(state, '初始提交不能 amend，请直接重新提交。');
      }

      const configMatch = command.match(/config=("([^"]+)"|'([^']+)')/);
      const amendConfig = configMatch?.[2] ?? configMatch?.[3];

      const id = shortId();
      const next = cloneState(state);
      next.commits.set(id, {
        id,
        message,
        parents: headCommit.parents,
        configValue: amendConfig ?? headCommit.configValue ?? 'log_level=info',
      });
      // amend 语义：旧提交被替换出分支历史，从图中移除以保持提交总数不变
      next.commits.delete(headId);

      const branch = getHeadBranch(next);
      if (branch) {
        next.branches.set(branch, id);
        next.HEAD = `ref: ${branch}`;
      } else {
        next.HEAD = id;
      }
      next.staging = false;
      next.workingTreeDirty = false;

      const withReflog = appendReflog(next, `commit (amend): ${message}`, headId, id);
      return success(withReflog, `[${branch || 'detached'} ${id.slice(0, 7)}] ${message}`);
    }

    // config=参数模拟"修改 config.js 的内容"（冲突模拟用）
    const configMatch = command.match(/config=("([^"]+)"|'([^']+)')/);
    const configValue =
      configMatch?.[2] ?? configMatch?.[3] ?? undefined;

    return createCommitFromHead(
      state,
      message,
      `commit: ${message}`,
      configValue
    );
  }

  if (parts[1] === 'restore' && parts.length >= 3) {
    const isStaged = parts.includes('--staged');

    if (isStaged) {
      if (!state.staging) {
        return invalid(state, '暂存区没有可以取消的改动。');
      }
      const next = cloneState(state);
      next.staging = false;
      next.workingTreeDirty = true;
      return success(next, `已将 ${parts[3] ?? '文件'} 移出暂存区，改动保留在工作区。`);
    }

    if (!state.workingTreeDirty) {
      return invalid(state, '工作区没有可以丢弃的改动。');
    }
    const next = cloneState(state);
    next.workingTreeDirty = false;
    return success(next, `已丢弃 ${parts[2] ?? '文件'} 的工作区改动。`);
  }

  if (parts[1] === 'status' && (parts.length === 2 || parts[2] === '-s' || parts[2] === '--short')) {
    return success(state, buildStatusOutput(state, parts[2] === '-s' || parts[2] === '--short'));
  }

  if (parts[1] === 'diff' && parts.length === 2) {
    if (state.mergeConflict) {
      const c = state.mergeConflict;
      return success(
        state,
        [
          `diff --git a/config.js b/config.js (冲突中)`,
          `<<<<<<< HEAD: ${c.ours}`,
          `=======: ${c.theirs}`,
          `>>>>>>> ${c.sourceBranch}`,
          `（使用 resolve-conflict 解决）`,
        ].join('\n')
      );
    }

    if (state.staging && !state.workingTreeDirty) {
      return success(state, 'diff: 工作区与暂存区一致，没有未暂存的差异。');
    }

    if (state.workingTreeDirty) {
      return success(
        state,
        [
          'diff --git a/example.txt b/example.txt',
          '--- a/example.txt',
          '+++ b/example.txt',
          '@@ -1 +1 @@',
          '-旧内容',
          '+新内容（尚未暂存）',
        ].join('\n')
      );
    }

    return success(state, '工作区很干净，没有任何差异。');
  }

  if (parts[1] === 'diff' && (parts[2] === '--staged' || parts[2] === '--cached')) {
    if (!state.staging) {
      return success(state, '暂存区没有待提交的差异。');
    }

    return success(
      state,
      [
        'diff --git a/example.txt b/example.txt',
        '--- a/example.txt',
        '+++ b/example.txt',
        '@@ -1 +1 @@',
        '-旧内容',
        '+新内容（已暂存，等待提交）',
      ].join('\n')
    );
  }

  if (parts[1] === 'show' && parts.length === 2) {
    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const commit = state.commits.get(headId);
    if (!commit) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const lines = [
      `commit ${commit.id}`,
      `Author: 你 <you@example.com>`,
      '',
      `    ${commit.message}`,
      '',
    ];
    if (commit.configValue) {
      lines.push(`diff --git a/config.js b/config.js`, `+ config: ${commit.configValue}`);
    }
    return success(state, lines.join('\n'));
  }

  if (parts[1] === 'show' && parts.length === 3) {
    const targetId = resolveCommitish(state, parts[2]);
    if (!targetId) {
      return invalid(state, `无法找到提交 "${parts[2]}"。`);
    }

    const commit = state.commits.get(targetId);
    if (!commit) {
      return invalid(state, `无法找到提交 "${parts[2]}"。`);
    }

    const lines = [
      `commit ${commit.id}`,
      `Author: 你 <you@example.com>`,
      '',
      `    ${commit.message}`,
      '',
    ];
    if (commit.configValue) {
      lines.push(`diff --git a/config.js b/config.js`, `+ config: ${commit.configValue}`);
    }
    return success(state, lines.join('\n'));
  }

  if (parts[1] === 'log') {
    const rest = parts.slice(2);
    const allowedFlags = new Set([
      '--oneline',
      '--graph',
      '--all',
      '-n',
    ]);
    const unknownFlag = rest.find(
      (token) => token.startsWith('-') && !allowedFlags.has(token) && !/^-\d+$/.test(token)
    );

    if (unknownFlag) {
      return unsupported(state, getUnsupportedMessage(command));
    }

    return success(state, buildLogOutput(state, rest.includes('--oneline')));
  }

  if (
    parts[1] === 'branch' &&
    (parts.length === 2 || (parts[2] === '-a' && parts.length === 3))
  ) {
    const currentBranch = getHeadBranch(state);
    const lines: string[] = [];

    for (const name of Array.from(state.branches.keys()).sort()) {
      lines.push(`${name === currentBranch ? '* ' : '  '}${name}`);
    }

    if (parts[2] === '-a') {
      for (const ref of Array.from(state.remoteTracking.keys()).sort()) {
        lines.push(`  remotes/${ref}`);
      }
    }

    return success(state, lines.join('\n'));
  }

  if (parts[1] === 'branch' && parts.length === 3) {
    const name = parts[2];
    if (state.branches.has(name)) {
      return invalid(state, `分支 "${name}" 已存在。`);
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const next = cloneState(state);
    next.branches.set(name, headId);
    return success(next, `已创建分支 "${name}"。`);
  }

  if (parts[1] === 'branch' && parts[2] === '-d' && parts.length === 4) {
    const name = parts[3];
    const branchCommit = state.branches.get(name);
    if (!branchCommit) {
      return invalid(state, `分支 "${name}" 不存在。`);
    }

    if (getHeadBranch(state) === name) {
      return invalid(state, '不能删除当前所在分支。');
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    if (!isAncestor(state, branchCommit, headId)) {
      return invalid(state, `分支 "${name}" 尚未合并到当前分支。`);
    }

    const next = cloneState(state);
    next.branches.delete(name);
    return success(next, `已删除分支 "${name}"。`);
  }

  if (parts[1] === 'branch' && parts[2] === '-D' && parts.length === 4) {
    const name = parts[3];
    if (!state.branches.has(name)) {
      return invalid(state, `分支 "${name}" 不存在。`);
    }

    if (getHeadBranch(state) === name) {
      return invalid(state, '不能删除当前所在分支。');
    }

    const next = cloneState(state);
    next.branches.delete(name);
    return success(next, `已强制删除分支 "${name}"（未合并的提交仍可通过 reflog 找回）。`);
  }

  if (parts[1] === 'branch' && parts[2] === '-m' && parts.length === 5) {
    const oldName = parts[3];
    const newName = parts[4];

    if (!state.branches.has(oldName)) {
      return invalid(state, `分支 "${oldName}" 不存在。`);
    }
    if (state.branches.has(newName)) {
      return invalid(state, `分支 "${newName}" 已存在。`);
    }

    const next = cloneState(state);
    const commitId = next.branches.get(oldName)!;
    next.branches.delete(oldName);
    next.branches.set(newName, commitId);
    if (next.HEAD === `ref: ${oldName}`) {
      next.HEAD = `ref: ${newName}`;
    }
    return success(next, `已将分支 "${oldName}" 重命名为 "${newName}"。`);
  }

  if (parts[1] === 'tag') {
    if (parts.length === 2) {
      // 列出所有 tag（按字母序）
      const lines = Array.from(state.tags.keys()).sort();
      return success(state, lines.length > 0 ? lines.join('\n') : '（当前没有任何 tag）');
    }

    const name = parts[2];
    if (!/^[vV]?\d[\w.-]*$/.test(name) && !/^[\w.-]+$/.test(name)) {
      return invalid(state, `非法的 tag 名称 "${name}"。`);
    }

    if (parts[2] === '-d' && parts.length === 4) {
      const target = parts[3];
      if (!state.tags.has(target)) {
        return invalid(state, `tag "${target}" 不存在。`);
      }
      const next = cloneState(state);
      next.tags.delete(target);
      return success(next, `已删除 tag "${target}"。`);
    }

    if (parts.length === 3) {
      if (state.tags.has(name)) {
        return invalid(state, `tag "${name}" 已存在。`);
      }

      const headId = getHeadCommit(state);
      if (!headId) {
        return invalid(state, '当前 HEAD 无法解析到任何提交。');
      }

      const next = cloneState(state);
      next.tags.set(name, headId);
      return success(next, `已在提交 ${headId.slice(0, 7)} 上创建 tag "${name}"。`);
    }

    return invalid(state, '请使用 git tag <名称> 创建，或 git tag 查看列表。');
  }

  if (parts[1] === 'checkout' && parts[2] === '-b' && parts.length === 4) {
    const name = parts[3];
    if (state.branches.has(name)) {
      return invalid(state, `分支 "${name}" 已存在。`);
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const next = cloneState(state);
    next.branches.set(name, headId);
    next.HEAD = `ref: ${name}`;

    const withReflog = appendReflog(
      next,
      `checkout: ${getHeadLabel(state)} -> ${name}`,
      headId,
      headId
    );
    return success(withReflog, `已创建并切换到分支 "${name}"。`);
  }

  if (parts[1] === 'switch' && parts[2] === '-c' && parts.length === 4) {
    const name = parts[3];
    if (state.branches.has(name)) {
      return invalid(state, `分支 "${name}" 已存在。`);
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const next = cloneState(state);
    next.branches.set(name, headId);
    next.HEAD = `ref: ${name}`;

    const withReflog = appendReflog(
      next,
      `switch: ${getHeadLabel(state)} -> ${name}`,
      headId,
      headId
    );
    return success(withReflog, `已创建并切换到新分支 "${name}"。`);
  }

  // git switch - : 回到上一个分支（由 reflog 推断）
  if (parts[1] === 'switch' && parts[2] === '-' && parts.length === 3) {
    const previousCommit = getHeadCommit(state);
    if (!previousCommit) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    // reflog 里最近一次 switch 的"来源分支"就是上一个分支
    const currentLabel = getHeadLabel(state);
    const previousTarget = state.reflog
      .filter((entry) => entry.action.startsWith('switch:'))
      .map((entry) => {
        const match = entry.action.match(/^switch: .+? -> (.+)$/);
        return match?.[1]?.trim() ?? '';
      })
      .find((name) => name && name !== currentLabel && state.branches.has(name))
      // 没有目标可取时，从最近一次 switch 的 from 侧推断（存放在 entry.from 无法直接给名字，
      // 因此再退一步：找出除了当前分支外、存在 switch 记录提到过的分支）
      ?? state.reflog
        .filter((entry) => entry.action.startsWith('switch:'))
        .map((entry) => {
          const from = entry.action.match(/^switch: (.+?) -> /);
          return from?.[1]?.trim() ?? '';
        })
        .find((name) => name && name !== currentLabel && state.branches.has(name));

    if (!previousTarget) {
      return invalid(state, '找不到上一个分支（当前会话中没有可用的 switch 记录）。');
    }

    const targetCommit = state.branches.get(previousTarget)!;
    const next = cloneState(state);
    next.HEAD = `ref: ${previousTarget}`;

    const withReflog = appendReflog(
      next,
      `switch: ${getHeadLabel(state)} -> ${previousTarget}`,
      previousCommit,
      targetCommit
    );
    return success(withReflog, `已切换到分支 "${previousTarget}"（上一个分支）。`);
  }


  if (parts[1] === 'switch' && parts.length === 3) {
    const target = parts[2];
    const previousCommit = getHeadCommit(state);
    if (!previousCommit) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    if (!state.branches.has(target)) {
      return invalid(state, `分支 "${target}" 不存在。`);
    }

    const targetCommit = state.branches.get(target)!;
    const next = cloneState(state);
    next.HEAD = `ref: ${target}`;

    const withReflog = appendReflog(
      next,
      `switch: ${getHeadLabel(state)} -> ${target}`,
      previousCommit,
      targetCommit
    );
    return success(withReflog, `已切换到分支 "${target}"。`);
  }

  if (parts[1] === 'checkout' && parts.length === 3) {
    const target = parts[2];
    const previousCommit = getHeadCommit(state);
    if (!previousCommit) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const branchCommit = state.branches.get(target);
    if (branchCommit) {
      const next = cloneState(state);
      next.HEAD = `ref: ${target}`;

      const withReflog = appendReflog(
        next,
        `checkout: ${getHeadLabel(state)} -> ${target}`,
        previousCommit,
        branchCommit
      );
      return success(withReflog, `已切换到分支 "${target}"。`);
    }

    const targetCommit = resolveCommitish(state, target);
    if (!targetCommit) {
      return invalid(state, `无法找到引用 "${target}"。`);
    }

    const next = cloneState(state);
    next.HEAD = targetCommit;

    const withReflog = appendReflog(
      next,
      `checkout: ${getHeadLabel(state)} -> detached`,
      previousCommit,
      targetCommit
    );
    return success(
      withReflog,
      `已切换到提交 ${targetCommit.slice(0, 7)}，当前处于 detached HEAD 状态。`
    );
  }

  if (parts[1] === 'merge' && parts.length === 3) {
    const sourceBranch = parts[2];
    const sourceCommit = state.branches.get(sourceBranch);
    if (!sourceCommit) {
      return invalid(state, `分支 "${sourceBranch}" 不存在。`);
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    if (headId === sourceCommit || isAncestor(state, sourceCommit, headId)) {
      return success(state, 'Already up to date.');
    }

    const currentBranch = getHeadBranch(state);
    if (!currentBranch) {
      return invalid(state, '分离 HEAD 状态下不支持合并。');
    }

    // 冲突判定：双方各自基于共同祖先修改了 config.js
    const baseId = findCommonAncestor(state, headId, sourceCommit);
    const baseConfig = baseId
      ? state.commits.get(baseId)?.configValue ?? null
      : null;
    const oursConfig = state.commits.get(headId)?.configValue ?? null;
    const theirsConfig = state.commits.get(sourceCommit)?.configValue ?? null;

    if (
      baseConfig !== null &&
      oursConfig !== null &&
      theirsConfig !== null &&
      oursConfig !== baseConfig &&
      theirsConfig !== baseConfig &&
      oursConfig !== theirsConfig
    ) {
      const conflict: MergeConflict = {
        file: 'config.js',
        base: baseConfig,
        ours: oursConfig,
        theirs: theirsConfig,
        sourceBranch,
      };
      const conflicted = cloneState(state);
      conflicted.mergeConflict = conflict;
      conflicted.workingTreeDirty = true;
      return invalid(
        conflicted,
        [
          `Auto-merging config.js`,
          `CONFLICT (content): Merge conflict in config.js`,
          `Automatic merge failed; fix conflicts and then commit the result.`,
          `（在本平台执行 resolve-conflict 命令解决冲突）`,
        ].join('\n')
      );
    }

    const id = shortId();
    const next = cloneState(state);
    next.commits.set(id, {
      id,
      message: `Merge branch '${sourceBranch}'`,
      parents: [headId, sourceCommit],
      configValue:
        theirsConfig !== baseConfig ? theirsConfig ?? undefined : oursConfig ?? undefined,
    });
    next.branches.set(currentBranch, id);
    next.HEAD = `ref: ${currentBranch}`;
    next.staging = false;
    next.workingTreeDirty = false;

    const withReflog = appendReflog(next, `merge ${sourceBranch}`, headId, id);
    return success(withReflog, "Merge made by the 'ort' strategy.");
  }

  if (parts[1] === 'rebase' && parts[2] === '--onto' && parts.length === 6) {
    const newBaseRef = parts[3];
    const oldBaseRef = parts[4];
    const branchName = parts[5];

    const branchHead = state.branches.get(branchName);
    if (!branchHead) {
      return invalid(state, `分支 "${branchName}" 不存在。`);
    }

    const newBaseId = resolveCommitish(state, newBaseRef);
    if (!newBaseId) {
      return invalid(state, `无法找到新基底 "${newBaseRef}"。`);
    }

    const oldBaseId = resolveCommitish(state, oldBaseRef);
    if (!oldBaseId) {
      return invalid(state, `无法找到旧基底 "${oldBaseRef}"。`);
    }

    if (!isAncestor(state, oldBaseId, branchHead)) {
      return invalid(state, `引用 "${oldBaseRef}" 不在分支 "${branchName}" 的历史上。`);
    }

    const commitsToReplay = collectLinearCommitsSince(state, branchHead, oldBaseId);
    if (commitsToReplay.length === 0) {
      return success(state, `分支 "${branchName}" 没有需要搬运的提交。`);
    }

    const next = cloneState(state);
    let parentId = newBaseId;
    let lastRebasedId = newBaseId;

    for (const commit of commitsToReplay) {
      const rebasedId = shortId();
      next.commits.set(rebasedId, {
        id: rebasedId,
        message: commit.message,
        parents: [parentId],
      });
      parentId = rebasedId;
      lastRebasedId = rebasedId;
    }

    next.branches.set(branchName, lastRebasedId);
    if (getHeadBranch(state) === branchName) {
      next.HEAD = `ref: ${branchName}`;
    }

    const withReflog = appendReflog(
      next,
      `rebase --onto ${newBaseRef} ${oldBaseRef} ${branchName}`,
      branchHead,
      lastRebasedId
    );
    return success(
      withReflog,
      `已将分支 "${branchName}" 从 ${oldBaseRef} 之上的提交搬到 ${newBaseRef}。`
    );
  }

  if (parts[1] === 'rebase' && parts.length === 3) {
    const targetBranch = parts[2];
    const targetCommit = state.branches.get(targetBranch);
    if (!targetCommit) {
      return invalid(state, `分支 "${targetBranch}" 不存在。`);
    }

    const currentBranch = getHeadBranch(state);
    if (!currentBranch) {
      return invalid(state, '分离 HEAD 状态下不支持 rebase。');
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const commonAncestor = findCommonAncestor(state, headId, targetCommit);
    if (commonAncestor === targetCommit) {
      return success(state, '当前分支已经基于目标分支，无需变基。');
    }

    const commitsToReplay = collectLinearCommitsSince(
      state,
      headId,
      commonAncestor
    );

    if (commitsToReplay.length === 0) {
      return success(state, '当前分支没有可变基的提交。');
    }

    const next = cloneState(state);
    let parentId = targetCommit;
    let lastRebasedId = targetCommit;

    for (const commit of commitsToReplay) {
      const rebasedId = shortId();
      next.commits.set(rebasedId, {
        id: rebasedId,
        message: commit.message,
        parents: [parentId],
      });
      parentId = rebasedId;
      lastRebasedId = rebasedId;
    }

    next.branches.set(currentBranch, lastRebasedId);
    next.HEAD = `ref: ${currentBranch}`;
    next.staging = false;
    next.workingTreeDirty = false;

    const withReflog = appendReflog(
      next,
      `rebase ${targetBranch}`,
      headId,
      lastRebasedId
    );
    return success(withReflog, `已将当前分支变基到 ${targetBranch}（简化模拟）。`);
  }

  if (command.startsWith('git reset --soft ') && parts.length === 4) {
    const targetRef = parts[3];
    const targetCommit = resolveCommitish(state, targetRef);
    if (!targetCommit) {
      return invalid(state, `无法找到重置目标 "${targetRef}"。`);
    }

    return performReset(state, targetCommit, `reset --soft ${targetRef}`, 'soft');
  }

  if (command.startsWith('git reset --hard ') && parts.length === 4) {
    const targetRef = parts[3];
    const targetCommit = resolveCommitish(state, targetRef);
    if (!targetCommit) {
      return invalid(state, `无法找到重置目标 "${targetRef}"。`);
    }

    return performReset(state, targetCommit, `reset --hard ${targetRef}`, 'hard');
  }

  if (parts[1] === 'revert' && parts[2] === 'HEAD') {
    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    const headCommit = state.commits.get(headId);
    if (!headCommit || headCommit.parents.length === 0) {
      return invalid(state, '初始提交不能直接 revert。');
    }

    const branch = getHeadBranch(state);
    if (!branch) {
      return invalid(state, '分离 HEAD 状态下不支持 revert。');
    }

    const id = shortId();
    const next = cloneState(state);
    next.commits.set(id, {
      id,
      message: `Revert "${headCommit.message}"`,
      parents: [headId],
    });
    next.branches.set(branch, id);
    next.HEAD = `ref: ${branch}`;
    next.staging = false;
    next.workingTreeDirty = false;

    const withReflog = appendReflog(
      next,
      `revert: ${headCommit.message}`,
      headId,
      id
    );
    return success(
      withReflog,
      `[${branch} ${id.slice(0, 7)}] Revert "${headCommit.message}"`
    );
  }

  if (parts[1] === 'cherry-pick' && parts.length === 3) {
    const sourceRef = parts[2];
    const sourceCommitId = resolveCommitish(state, sourceRef);
    if (!sourceCommitId) {
      return invalid(state, `无法找到提交 "${sourceRef}"。`);
    }

    const currentBranch = getHeadBranch(state);
    if (!currentBranch) {
      return invalid(state, '分离 HEAD 状态下不支持 cherry-pick。');
    }

    const sourceCommit = state.commits.get(sourceCommitId);
    if (!sourceCommit) {
      return invalid(state, `无法找到提交 "${sourceRef}"。`);
    }

    return createCommitFromHead(
      state,
      sourceCommit.message,
      `cherry-pick ${sourceCommitId.slice(0, 7)}`
    );
  }

  if (command === 'git stash') {
    if (!state.staging && !state.workingTreeDirty) {
      return invalid(state, '没有本地改动可暂存。');
    }

    const next = cloneState(state);
    next.stash = {
      message: `WIP on ${getHeadBranch(state) ?? 'detached HEAD'}`,
      hadStaging: state.staging,
      hadWorkingTreeChanges: state.workingTreeDirty,
    };
    next.staging = false;
    next.workingTreeDirty = false;
    return success(next, '已保存当前工作区和暂存区状态。');
  }

  if (command === 'git stash list') {
    if (!state.stash) {
      return success(state, '当前没有 stash 记录。');
    }

    return success(state, `stash@{0}: ${state.stash.message}`);
  }

  if (command === 'git stash pop') {
    if (!state.stash) {
      return invalid(state, '当前没有 stash 记录可恢复。');
    }

    const next = cloneState(state);
    next.staging = state.stash.hadStaging;
    next.workingTreeDirty = state.stash.hadWorkingTreeChanges;
    next.stash = null;
    return success(next, '已恢复最近一次 stash。');
  }

  if (command === 'git reflog') {
    return success(state, buildReflogOutput(state));
  }

  if (parts[1] === 'remote' && parts[2] === '-v') {
    if (!state.remote) {
      return success(state, '（当前仓库没有配置远程仓库）');
    }

    return success(
      state,
      `origin  ${state.remote.url} (fetch)\norigin  ${state.remote.url} (push)`
    );
  }

  if (parts[1] === 'remote' && parts[2] === 'add' && parts.length === 5) {
    const name = parts[3];
    const url = parts[4];

    if (state.remote) {
      return invalid(state, `远程仓库 "${name}" 已存在。`);
    }

    const next = cloneState(state);
    next.remote = { url, commits: new Map(), branches: new Map() };
    return success(next, `已添加远程仓库 "${name}" -> ${url}。`);
  }

  if (parts[1] === 'fetch' && (parts.length === 2 || parts.length === 3)) {
    return fetchFromRemote(state, parts[2] ?? 'origin');
  }

  if (parts[1] === 'pull') {
    if (parts.length === 2) {
      return pullFromRemote(state, 'origin', null);
    }

    if (parts.length === 4 && parts[2] === 'origin') {
      return pullFromRemote(state, 'origin', parts[3]);
    }

    return invalid(state, '请使用 git pull 或 git pull origin <分支名>。');
  }

  if (parts[1] === 'push') {
    if (parts.length === 2) {
      return pushToRemote(state, 'origin', null, false);
    }

    if (parts.length === 5 && parts[2] === '-u' && parts[3] === 'origin') {
      return pushToRemote(state, 'origin', parts[4], true);
    }

    if (parts.length === 4 && parts[2] === 'origin') {
      return pushToRemote(state, 'origin', parts[3], false);
    }

    return invalid(
      state,
      '请使用 git push、git push origin <分支名> 或 git push -u origin <分支名>。'
    );
  }

  if (parts[1] === 'worktree') {
    // git worktree list
    if (parts.length === 3 && parts[2] === 'list') {
      const lines = [`* ${'/main/worktree'}  ${getHeadBranch(state) ?? '(detached HEAD)'} ${getShortId(getHeadCommit(state))}`];
      for (const wt of state.worktrees) {
        lines.push(`  ${wt.path}  ${wt.branch ?? '(detached HEAD)'} ${getShortId(wt.head)}`);
      }
      return success(state, lines.join('\n'));
    }

    // git worktree add <path> <branch> | -b <new> <path> [base]
    if (parts[2] === 'add' && parts.length >= 5) {
      let newPath: string;
      let branchName: string | null = null;
      let baseRef: string | null = null;

      if (parts[3] === '-b' && parts.length >= 6) {
        // git worktree add -b <new-branch> <path> [base]
        branchName = parts[4];
        newPath = parts[5];
        baseRef = parts[6] ?? null;

        if (state.branches.has(branchName)) {
          return invalid(state, `分支 "${branchName}" 已存在。`);
        }
      } else {
        // git worktree add <path> <branch>
        newPath = parts[3];
        branchName = parts[4];
        baseRef = null;
      }

      if (!branchName) {
        return invalid(state, '请指定要检出的分支名。');
      }

      const baseCommit = baseRef
        ? resolveCommitish(state, baseRef)
        : getHeadCommit(state);
      if (!baseCommit) {
        return invalid(state, baseRef ? `无法找到引用 "${baseRef}"。` : '当前 HEAD 无法解析到任何提交。');
      }

      if (!state.branches.has(branchName)) {
        return invalid(state, `分支 "${branchName}" 不存在（沙盒中不支持从 worktree 创建已存在的分支，先 git branch）。`);
      }

      if (state.worktrees.some((w) => w.path === newPath)) {
        return invalid(state, `工作树 "${newPath}" 已存在。`);
      }

      const next = cloneState(state);
      next.worktrees = [...next.worktrees, { path: newPath, branch: branchName, head: baseCommit }];
      return success(
        next,
        `已在 "${newPath}" 检出分支 "${branchName}"（共享同一仓库历史）。`
      );
    }

    // git worktree remove <path>
    if (parts[2] === 'remove' && parts.length === 4) {
      const target = parts[3];
      if (!state.worktrees.some((w) => w.path === target)) {
        return invalid(state, `工作树 "${target}" 不存在。`);
      }

      const next = cloneState(state);
      next.worktrees = next.worktrees.filter((w) => w.path !== target);
      return success(next, `已删除工作树 "${target}"。`);
    }

    return invalid(
      state,
      '支持: git worktree list / git worktree add <路径> <分支> / git worktree remove <路径>'
    );
  }

  // git rebase -i <range>：生成待办清单，等待 rebase-todo 应用
  if (parts[1] === 'rebase' && parts[2] === '-i' && parts.length >= 4) {
    const range = parts[3];
    if (command.includes('--exec')) {
      return unsupported(state, getUnsupportedMessage(command));
    }

    const rangeMatch = range.match(/^HEAD~(\d+)$/);
    if (!rangeMatch) {
      return invalid(state, '沙盒支持 git rebase -i HEAD~<n> 形式的范围。');
    }

    const count = Number(rangeMatch[1]);
    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }

    // 收集最近 n 个提交（旧 -> 新）
    const todos: RebaseTodoItem[] = [];
    let cursor: string | null = headId;
    for (let i = 0; i < count && cursor; i++) {
      const commit = state.commits.get(cursor);
      if (!commit || commit.parents.length !== 1) {
        break;
      }
      todos.unshift({
        action: 'pick',
        commitId: commit.id,
        message: commit.message,
      });
      cursor = commit.parents[0];
    }

    if (todos.length === 0) {
      return invalid(state, '没有可以整理的提交。');
    }

    const next = cloneState(state);
    next.rebaseTodo = todos;
    return success(
      next,
      [
        '交互式变基待办清单（提示符模拟）:',
        ...todos.map(
          (t, i) => `  pick ${t.commitId.slice(0, 7)} ${t.message}`
        ),
        '',
        '修改某项 action: rebase-todo <pick|fixup|squash|drop> <序号>',
        '应用清单: rebase-todo apply',
      ].join('\n')
    );
  }

  // rebase-todo <action> <序号>：编辑待办清单项（序号从 1 开始）
  if (command.startsWith('rebase-todo ') && parts[1] !== 'apply' && parts[1] !== 'show') {
    if (!state.rebaseTodo) {
      return invalid(state, '当前没有进行中的交互式变基，先执行 git rebase -i HEAD~<n>。');
    }

    const actionName = parts[1];
    const index = Number(parts[2]) - 1;
    const validActions = ['pick', 'fixup', 'squash', 'drop'];

    if (!validActions.includes(actionName ?? '') || !Number.isInteger(index) || index < 0 || index >= state.rebaseTodo.length) {
      return invalid(
        state,
        `用法: rebase-todo <pick|fixup|squash|drop> <序号>（序号 1~${state.rebaseTodo.length}），或 rebase-todo apply 应用清单。`
      );
    }

    const next = cloneState(state);
    next.rebaseTodo = next.rebaseTodo!.map((item, i) =>
      i === index ? { ...item, action: actionName as RebaseTodoItem['action'] } : item
    );

    return success(
      next,
      [
        `已将第 ${index + 1} 项改为 ${actionName}。当前清单:`,
        ...next.rebaseTodo.map(
          (t) => `  ${t.action.padEnd(6)} ${t.commitId.slice(0, 7)} ${t.message}`
        ),
        '',
        '继续编辑或执行: rebase-todo apply',
      ].join('\n')
    );
  }

  // rebase-todo apply：应用当前待办清单，重放提交（教学辅助命令）
  if (command.startsWith('rebase-todo ')) {
    if (!state.rebaseTodo) {
      return invalid(state, '当前没有进行中的交互式变基，先执行 git rebase -i HEAD~<n>。');
    }

    if (parts[1] === 'show') {
      return success(
        state,
        state.rebaseTodo
          .map((t) => `${t.action.padEnd(6)} ${t.commitId.slice(0, 7)} ${t.message}`)
          .join('\n')
      );
    }

    if (parts[1] !== 'apply') {
      return invalid(state, '使用 rebase-todo apply 应用清单，或 rebase-todo show 查看。');
    }

    const currentBranch = getHeadBranch(state);
    if (!currentBranch) {
      return invalid(state, '分离 HEAD 状态下不支持交互式变基。');
    }

    const headId = getHeadCommit(state);
    if (!headId) {
      return invalid(state, '当前 HEAD 无法解析到任何提交。');
    }
    const baseCommit = state.commits.get(headId)?.parents[0] ?? null;

    // 过滤 drop，按 fixup/squash 合并消息
    const plan = state.rebaseTodo;
    const drops = plan.filter((t) => t.action === 'drop');
    if (drops.length === plan.length) {
      return invalid(state, '不能 drop 全部提交，至少保留一个。');
    }

    const next = cloneState(state);
    let parent = baseCommit;
    let pendingFixup: { messages: string[]; configValue: string | undefined } | null = null;

    const finalizePending = () => {
      if (!pendingFixup) return;
      const id = shortId();
      next.commits.set(id, {
        id,
        message: pendingFixup.messages[0],
        parents: [parent!],
        configValue: pendingFixup.configValue,
      });
      parent = id;
      pendingFixup = null;
    };

    for (const item of plan) {
      if (item.action === 'drop') {
        continue;
      }

      const sourceCommit = state.commits.get(item.commitId);
      const configValue = sourceCommit?.configValue;

      if (item.action === 'pick') {
        finalizePending();
        const id = shortId();
        next.commits.set(id, {
          id,
          message: item.message,
          parents: [parent!],
          configValue: configValue ?? next.commits.get(parent!)?.configValue ?? 'log_level=info',
        });
        parent = id;
      } else {
        // fixup / squash：合并到前一个提交
        if (!pendingFixup) {
          // 第一个就是 fixup/squash 且没有前一个可合并 → 降级为 pick
          pendingFixup = { messages: [item.message], configValue };
        } else {
          pendingFixup.messages.push(item.message);
        }
      }
    }
    finalizePending();

    next.branches.set(currentBranch, parent!);
    next.HEAD = `ref: ${currentBranch}`;
    next.rebaseTodo = null;

    const withReflog = appendReflog(
      next,
      `rebase -i (applied ${plan.length - drops.length})`,
      headId,
      parent!
    );
    const squashed = plan.filter((t) => t.action === 'fixup' || t.action === 'squash').length;
    const dropped = drops.length;
    return success(
      withReflog,
      [
        `交互式变基完成：${plan.length - dropped - squashed} 个提交保留`,
        squashed > 0 ? `${squashed} 个提交被合并` : '',
        dropped > 0 ? `${dropped} 个提交被删除` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  const unsupportedFamilies = new Set([
    'submodule',
    'config',
  ]);

  if (
    unsupportedFamilies.has(parts[1]) ||
    (parts[1] === 'rebase' && command.includes('--exec')) ||
    (parts[1] === 'config' && command.includes('rerere.enabled'))
  ) {
    return unsupported(state, getUnsupportedMessage(command));
  }

  return invalid(state, `无法识别命令：${command}`);
}
