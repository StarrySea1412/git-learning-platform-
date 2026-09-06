import { describe, expect, it } from 'vitest';
import { createInitialState, executeCommand } from '@/lib/git-simulator';

describe('常用命令补齐（restore/tag/amend/branch -m/-D/switch -/diff/show）', () => {
  it('restore --staged 把文件移出暂存区', () => {
    const state = createInitialState({ staging: true });
    const result = executeCommand(state, 'git restore --staged file.txt');

    expect(result.ok).toBe(true);
    expect(result.state.staging).toBe(false);
    expect(result.state.workingTreeDirty).toBe(true);
  });

  it('restore 丢弃工作区改动', () => {
    const state = createInitialState({ workingTreeDirty: true });
    const result = executeCommand(state, 'git restore file.txt');

    expect(result.ok).toBe(true);
    expect(result.state.workingTreeDirty).toBe(false);
  });

  it('branch -D 强制删除未合并分支', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git branch feature').state;
    state = executeCommand(state, 'git checkout feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit --allow-empty -m "unmerged"').state;
    state = executeCommand(state, 'git checkout main').state;

    const safeDelete = executeCommand(state, 'git branch -d feature');
    expect(safeDelete.ok).toBe(false);

    const forceDelete = executeCommand(state, 'git branch -D feature');
    expect(forceDelete.ok).toBe(true);
    expect(forceDelete.state.branches.has('feature')).toBe(false);
  });

  it('branch -m 重命名分支（含当前分支）', () => {
    const state = createInitialState();
    const result = executeCommand(state, 'git branch -m main trunk');

    expect(result.ok).toBe(true);
    expect(result.state.branches.has('main')).toBe(false);
    expect(result.state.branches.has('trunk')).toBe(true);
    expect(result.state.HEAD).toBe('ref: trunk');
  });

  it('tag 创建、列出和删除', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git tag v1.0').state;

    const list = executeCommand(state, 'git tag');
    expect(list.ok).toBe(true);
    expect(list.output).toContain('v1.0');

    const duplicate = executeCommand(state, 'git tag v1.0');
    expect(duplicate.ok).toBe(false);

    const deleted = executeCommand(state, 'git tag -d v1.0');
    expect(deleted.ok).toBe(true);
    expect(deleted.state.tags.has('v1.0')).toBe(false);
  });

  it('commit --amend 替换最近提交并保留父链', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "wip typo"').state;
    const previousHead = state.branches.get('main');
    const previousParent = state.commits.get(previousHead ?? '')?.parents ?? [];

    const amended = executeCommand(state, 'git commit --amend -m "feat: fixed message"');
    const newHead = amended.state.branches.get('main');

    expect(amended.ok).toBe(true);
    expect(newHead).not.toBe(previousHead);
    expect(amended.state.commits.get(newHead ?? '')?.message).toBe('feat: fixed message');
    expect(amended.state.commits.get(newHead ?? '')?.parents).toEqual(previousParent);
    expect(amended.state.commits.size).toBe(state.commits.size);
  });

  it('switch - 回到上一个分支', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git branch feature').state;
    state = executeCommand(state, 'git switch feature').state;
    const back = executeCommand(state, 'git switch -');

    expect(back.ok).toBe(true);
    expect(back.state.HEAD).toBe('ref: main');
  });

  it('diff 在冲突、脏工作区和干净状态下都合理', () => {
    const dirty = executeCommand(createInitialState({ workingTreeDirty: true }), 'git diff');
    expect(dirty.ok).toBe(true);
    expect(dirty.output).toContain('+++');

    const clean = executeCommand(createInitialState(), 'git diff');
    expect(clean.ok).toBe(true);
    expect(clean.output).toContain('干净');
  });

  it('show 查看当前提交详情', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "detailed work"').state;

    const result = executeCommand(state, 'git show');
    expect(result.ok).toBe(true);
    expect(result.output).toContain('detailed work');
    expect(result.output).toContain('commit');
  });
});
