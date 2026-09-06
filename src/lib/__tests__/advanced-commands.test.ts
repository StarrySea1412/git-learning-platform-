import { describe, expect, it } from 'vitest';
import { createInitialState, executeCommand, getHeadBranch } from '@/lib/git-simulator';

describe('worktree 简化模型', () => {
  it('add/list/remove 全流程', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git branch hotfix').state;

    const added = executeCommand(state, 'git worktree add ../hotfix hotfix');
    expect(added.ok).toBe(true);
    expect(added.state.worktrees).toHaveLength(1);
    expect(added.state.worktrees[0].branch).toBe('hotfix');

    const listed = executeCommand(added.state, 'git worktree list');
    expect(listed.ok).toBe(true);
    expect(listed.output).toContain('../hotfix');
    expect(listed.output).toContain('hotfix');

    const removed = executeCommand(added.state, 'git worktree remove ../hotfix');
    expect(removed.ok).toBe(true);
    expect(removed.state.worktrees).toHaveLength(0);
  });

  it('不存在的分支和重复路径会被拒绝', () => {
    const state = createInitialState();
    const noBranch = executeCommand(state, 'git worktree add ../x nope');
    expect(noBranch.ok).toBe(false);
    expect(noBranch.output).toContain('不存在');
  });
});

describe('交互式变基 rebase -i', () => {
  function buildState() {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "feat: login form"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "wip"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "feat: validate input"').state;
    return state;
  }

  it('rebase -i 生成 pick 清单', () => {
    const state = buildState();
    const result = executeCommand(state, 'git rebase -i HEAD~3');

    expect(result.ok).toBe(true);
    expect(result.state.rebaseTodo).not.toBeNull();
    expect(result.state.rebaseTodo).toHaveLength(3);
    expect(result.output).toContain('pick');
    expect(result.output).toContain('wip');
  });

  it('rebase-todo fixup 合并琐碎提交', () => {
    const state = buildState();
    const started = executeCommand(state, 'git rebase -i HEAD~3').state;
    // 把第 2 项（wip）标记为 fixup
    const edited = executeCommand(started, 'rebase-todo fixup 2');
    expect(edited.ok).toBe(true);
    expect(edited.state.rebaseTodo?.[1].action).toBe('fixup');

    const applied = executeCommand(edited.state, 'rebase-todo apply');
    expect(applied.ok).toBe(true);
    expect(applied.output).toContain('1 个提交被合并');

    // 3 个提交变成 2 个，HEAD 是 validate input
    const headId = getHeadCommit(applied.state);
    const head = headId ? applied.state.commits.get(headId) : null;
    expect(head?.message).toBe('feat: validate input');
    expect(applied.state.rebaseTodo).toBeNull();
  });

  it('rebase-todo drop 删除提交', () => {
    const state = buildState();
    const started = executeCommand(state, 'git rebase -i HEAD~3').state;
    const edited = executeCommand(started, 'rebase-todo drop 2').state;
    const applied = executeCommand(edited, 'rebase-todo apply');

    expect(applied.ok).toBe(true);
    expect(applied.output).toContain('1 个提交被删除');

    // drop 后 HEAD 链上不再有 wip：从 HEAD 沿父链回溯
    const headId = applied.state.HEAD.startsWith('ref: ')
      ? applied.state.branches.get(applied.state.HEAD.slice(5)) ?? null
      : applied.state.HEAD;
    const chainMessages: string[] = [];
    let cursor: string | null = headId;
    while (cursor) {
      const c = applied.state.commits.get(cursor);
      if (!c) break;
      chainMessages.push(c.message);
      cursor = c.parents[0] ?? null;
    }
    expect(chainMessages).not.toContain('wip');
    expect(chainMessages).toContain('feat: validate input');
    expect(chainMessages).toContain('feat: login form');
  });

  it('squash 保留合并后的第一条消息', () => {
    const state = buildState();
    const started = executeCommand(state, 'git rebase -i HEAD~2').state;
    const edited = executeCommand(started, 'rebase-todo squash 2').state;
    const applied = executeCommand(edited, 'rebase-todo apply');

    expect(applied.ok).toBe(true);
    const headId = getHeadCommit(applied.state);
    const head = headId ? applied.state.commits.get(headId) : null;
    // squash 的合并提交保留第一条消息
    expect(head?.message).toBe('wip');
  });

  it('非法序号和不存在的范围被拒绝', () => {
    const state = buildState();
    const started = executeCommand(state, 'git rebase -i HEAD~3').state;

    const badIndex = executeCommand(started, 'rebase-todo fixup 9');
    expect(badIndex.ok).toBe(false);

    const badRange = executeCommand(state, 'git rebase -i main');
    expect(badRange.ok).toBe(false);
  });
});

function getHeadCommit(state: Parameters<typeof getHeadBranch>[0]) {
  if (state.HEAD.startsWith('ref: ')) {
    return state.branches.get(state.HEAD.slice(5)) ?? null;
  }
  return state.HEAD;
}
