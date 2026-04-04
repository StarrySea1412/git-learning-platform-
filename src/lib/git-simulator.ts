export interface GitCommit {
  id: string;
  message: string;
  parents: string[];
}

export interface ReflogEntry {
  action: string;
  from: string | null;
  to: string | null;
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
}

export interface CreateInitialStateOptions {
  staging?: boolean;
  workingTreeDirty?: boolean;
}

export interface ExecResult {
  ok: boolean;
  output: string;
  state: GitState;
  reason?: 'unsupported' | 'invalid' | 'ok';
}

export interface ExecResult {
  ok: boolean;
  output: string;
  state: GitState;
  reason?: 'unsupported' | 'invalid' | 'ok';
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
  };
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

function buildStatusOutput(state: GitState): string {
  const branch = getHeadBranch(state);
  const branchLine = branch
    ? `位于分支 ${branch}`
    : 'HEAD 处分离状态（detached HEAD）';

  const details: string[] = [branchLine];

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
  action: string
): ExecResult {
  const headId = getHeadCommit(state);
  if (!headId) {
    return invalid(state, '当前 HEAD 无法解析到任何提交。');
  }

  const id = shortId();
  const next = cloneState(state);
  next.commits.set(id, { id, message, parents: [headId] });

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

export function executeCommand(state: GitState, input: string): ExecResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return invalid(state, '请输入一条 Git 命令。');
  }

  const command = trimmed.replace(/\s+/g, ' ');
  const parts = command.split(' ');

  if (parts[0] !== 'git') {
    return unsupported(state, '当前沙盒仅支持 Git 命令。');
  }

  if (command === 'git init') {
    return success(createInitialState(), '已初始化一个新的 Git 仓库。');
  }

  if (
    command === 'git add .' ||
    command === 'git add --all' ||
    command === 'git add -A'
  ) {
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
    if (!state.staging && !allowEmpty) {
      return invalid(state, '没有可提交的内容，请先执行 git add。');
    }

    const msgMatch = command.match(
      /git commit(?: --allow-empty)? -m ["'](.+?)["']/
    );
    const message = msgMatch?.[1];
    if (!message) {
      return invalid(state, '请使用 git commit -m "提交信息" 提交。');
    }

    return createCommitFromHead(state, message, `commit: ${message}`);
  }

  if (parts[1] === 'status') {
    return success(state, buildStatusOutput(state));
  }

  if (parts[1] === 'log') {
    return success(state, buildLogOutput(state, command.includes('--oneline')));
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

    const id = shortId();
    const next = cloneState(state);
    next.commits.set(id, {
      id,
      message: `Merge branch '${sourceBranch}'`,
      parents: [headId, sourceCommit],
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

  const unsupportedFamilies = new Set([
    'clone',
    'submodule',
    'worktree',
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
