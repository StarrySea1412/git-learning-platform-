import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  executeCommand,
  getHeadBranch,
} from '@/lib/git-simulator';

describe('合并冲突模拟', () => {
  function buildConflictState() {
    let state = createInitialState({ configValue: 'log_level=info' });
    state = executeCommand(state, 'git branch feature').state;

    // main 侧修改 config
    state = { ...state, staging: true };
    state = executeCommand(
      state,
      'git commit -m "main: set config" config="log_level=debug"'
    ).state;

    // feature 侧修改同一个 config（不同值 → 冲突）
    state = executeCommand(state, 'git checkout feature').state;
    state = { ...state, staging: true };
    state = executeCommand(
      state,
      'git commit -m "feat: tweak config" config="log_level=trace"'
    ).state;

    return executeCommand(state, 'git checkout main').state;
  }

  it('双方修改同一配置时 merge 产生冲突', () => {
    const state = buildConflictState();
    const result = executeCommand(state, 'git merge feature');

    expect(result.ok).toBe(false);
    expect(result.output).toContain('CONFLICT');
    expect(result.output).toContain('config.js');
    expect(result.state.mergeConflict).not.toBeNull();
    expect(result.state.mergeConflict?.ours).toBe('log_level=debug');
    expect(result.state.mergeConflict?.theirs).toBe('log_level=trace');
    expect(result.state.mergeConflict?.sourceBranch).toBe('feature');
  });

  it('冲突期间拒绝 git add', () => {
    const state = buildConflictState();
    const conflicted = executeCommand(state, 'git merge feature').state;
    const result = executeCommand(conflicted, 'git add .');

    expect(result.ok).toBe(false);
    expect(result.output).toContain('resolve-conflict');
  });

  it('无参数 resolve-conflict 展示冲突标记内容', () => {
    const state = buildConflictState();
    const conflicted = executeCommand(state, 'git merge feature').state;
    const result = executeCommand(conflicted, 'resolve-conflict');

    expect(result.ok).toBe(false);
    expect(result.output).toContain('<<<<<<<');
    expect(result.output).toContain('=======');
    expect(result.output).toContain('>>>>>>>');
    expect(result.output).toContain('log_level=debug');
    expect(result.output).toContain('log_level=trace');
  });

  it.each(['ours', 'theirs', 'both'] as const)(
    'resolve-conflict %s 生成合并提交并清除冲突',
    (choice) => {
      const state = buildConflictState();
      const conflicted = executeCommand(state, 'git merge feature').state;
      const result = executeCommand(conflicted, `resolve-conflict ${choice}`);

      expect(result.ok).toBe(true);
      expect(result.state.mergeConflict).toBeNull();
      expect(getHeadBranch(result.state)).toBe('main');

      const headId = result.state.commits.get(
        result.state.branches.get('main') ?? ''
      );
      expect(headId?.parents).toHaveLength(2);
      expect(headId?.message).toContain(`resolved: ${choice}`);
      expect(result.output).toContain('config.js');

      if (choice === 'ours') {
        expect(headId?.configValue).toBe('log_level=debug');
      } else if (choice === 'theirs') {
        expect(headId?.configValue).toBe('log_level=trace');
      } else {
        expect(headId?.configValue).toContain('+');
      }
    }
  );

  it('单侧修改配置时正常快进/合并，不产生冲突', () => {
    let state = createInitialState({ configValue: 'log_level=info' });
    state = executeCommand(state, 'git checkout -b feature').state;
    state = { ...state, staging: true };
    state = executeCommand(
      state,
      'git commit -m "feat: config" config="log_level=warn"'
    ).state;
    state = executeCommand(state, 'git checkout main').state;

    const result = executeCommand(state, 'git merge feature');
    expect(result.ok).toBe(true);
    expect(result.state.mergeConflict).toBeNull();
  });
});
