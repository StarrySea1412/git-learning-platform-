import { describe, expect, it } from 'vitest';
import { createInitialState, executeCommand } from '@/lib/git-simulator';

describe('rerere 与 config', () => {
  function buildConflictState() {
    let state = createInitialState({ configValue: 'log_level=info' });
    state = executeCommand(state, 'git branch feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "main: set" config="log_level=debug"').state;
    state = executeCommand(state, 'git checkout feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "feat: set" config="log_level=trace"').state;
    return executeCommand(state, 'git checkout main').state;
  }

  it('未开启 rerere 时冲突照常发生', () => {
    const state = buildConflictState();
    const merged = executeCommand(state, 'git merge feature');
    expect(merged.ok).toBe(false);
    expect(merged.state.mergeConflict).not.toBeNull();
  });

  it('开启 rerere 后解决一次，再次同冲突自动套用', () => {
    const enabled = executeCommand(buildConflictState(), 'git config rerere.enabled true').state;
    expect(enabled.rerereEnabled).toBe(true);

    // 第一次冲突 + 手动解决
    const conflicted1 = executeCommand(enabled, 'git merge feature').state;
    expect(conflicted1.mergeConflict).not.toBeNull();
    const resolved1 = executeCommand(conflicted1, 'resolve-conflict theirs');
    expect(resolved1.ok).toBe(true);
    expect(resolved1.state.rerereCache).toContain('log_level=debug|log_level=trace');

    // 构造第二次同样的冲突（切回分支再合）
    let state2 = createInitialState({ configValue: 'log_level=info' });
    state2 = executeCommand(state2, 'git branch feature').state;
    state2 = { ...state2, staging: true };
    state2 = executeCommand(state2, 'git commit -m "main: set" config="log_level=debug"').state;
    state2 = executeCommand(state2, 'git checkout feature').state;
    state2 = { ...state2, staging: true };
    state2 = executeCommand(state2, 'git commit -m "feat: set" config="log_level=trace"').state;
    state2 = executeCommand(state2, 'git checkout main').state;
    // 带上第一次的 rerere 记录
    const withCache = {
      ...state2,
      rerereEnabled: resolved1.state.rerereEnabled,
      rerereCache: resolved1.state.rerereCache,
      rerereResolved: resolved1.state.rerereResolved,
    };

    const merged2 = executeCommand(withCache, 'git merge feature');
    expect(merged2.output).toContain('rerere 已自动套用');
    expect(merged2.state.mergeConflict).toBeNull();
  });

  it('git config 读写基础键', () => {
    const get = executeCommand(createInitialState(), 'git config rerere.enabled');
    expect(get.ok).toBe(true);
    expect(get.output).toBe('false');

    const setName = executeCommand(createInitialState(), 'git config user.name "Lin"');
    expect(setName.ok).toBe(true);
    expect(setName.output).toContain('user.name');
  });
});
