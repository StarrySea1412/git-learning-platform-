import { describe, expect, it } from 'vitest';
import {
  createCollaborationState,
  createInitialState,
  executeCommand,
  getHeadBranch,
  getHeadCommit,
} from '@/lib/git-simulator';

describe('git-simulator', () => {
  it('stages working tree changes with git add', () => {
    const state = createInitialState({ workingTreeDirty: true });
    const result = executeCommand(state, 'git add .');

    expect(result.ok).toBe(true);
    expect(result.state.staging).toBe(true);
    expect(result.state.workingTreeDirty).toBe(false);
  });

  it('creates a commit and advances HEAD', () => {
    const state = createInitialState({ staging: true });
    const previousHead = getHeadCommit(state);
    const result = executeCommand(state, 'git commit -m "initial commit"');
    const nextHead = getHeadCommit(result.state);

    expect(result.ok).toBe(true);
    expect(nextHead).not.toBe(previousHead);
    expect(getHeadBranch(result.state)).toBe('main');
    expect(result.state.commits.get(nextHead ?? '')?.message).toBe('initial commit');
    expect(result.state.reflog[0]?.action).toBe('commit: initial commit');
  });

  it('merges another branch into the current branch', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = executeCommand(state, 'git checkout -b feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "feature work"').state;
    state = executeCommand(state, 'git checkout main').state;

    const result = executeCommand(state, 'git merge feature');
    const headId = getHeadCommit(result.state);
    const mergeCommit = headId ? result.state.commits.get(headId) : null;

    expect(result.ok).toBe(true);
    expect(mergeCommit?.parents).toHaveLength(2);
    expect(result.state.reflog[0]?.action).toBe('merge feature');
  });

  it('creates a new commit from cherry-pick', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = executeCommand(state, 'git checkout -b hotfix').state;
    state = executeCommand(state, 'git commit --allow-empty -m "fix: login redirect"').state;
    state = executeCommand(state, 'git checkout main').state;

    const result = executeCommand(state, 'git cherry-pick 0000003');
    const headId = getHeadCommit(result.state);
    const headCommit = headId ? result.state.commits.get(headId) : null;

    expect(result.ok).toBe(true);
    expect(headCommit?.message).toBe('fix: login redirect');
    expect(headId).not.toBe('0000003');
    expect(result.state.reflog[0]?.action).toBe('cherry-pick 0000003');
  });

  it('rebases a branch with --onto while keeping the current branch checked out', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "main baseline"').state;
    state = executeCommand(state, 'git branch feature-base').state;
    state = executeCommand(state, 'git checkout -b feature').state;
    state = executeCommand(state, 'git commit --allow-empty -m "feature step 1"').state;
    state = executeCommand(state, 'git commit --allow-empty -m "feature step 2"').state;
    state = executeCommand(state, 'git checkout main').state;
    state = executeCommand(state, 'git commit --allow-empty -m "main release prep"').state;

    const previousFeatureHead = state.branches.get('feature');
    const mainHead = state.branches.get('main');
    const result = executeCommand(state, 'git rebase --onto main feature-base feature');
    const featureHead = result.state.branches.get('feature');
    const featureCommit = featureHead ? result.state.commits.get(featureHead) : null;
    const firstRebasedId = featureCommit?.parents[0] ?? null;
    const firstRebasedCommit = firstRebasedId
      ? result.state.commits.get(firstRebasedId)
      : null;

    expect(result.ok).toBe(true);
    expect(getHeadBranch(result.state)).toBe('main');
    expect(featureHead).not.toBe(previousFeatureHead);
    expect(featureCommit?.message).toBe('feature step 2');
    expect(firstRebasedCommit?.message).toBe('feature step 1');
    expect(firstRebasedCommit?.parents[0]).toBe(mainHead);
  });

  it('enters detached HEAD when checking out a commit hash', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "stabilize build"').state;

    const result = executeCommand(state, 'git checkout 0000001');

    expect(result.ok).toBe(true);
    expect(getHeadBranch(result.state)).toBeNull();
    expect(getHeadCommit(result.state)).toBe('0000001');
    expect(result.output).toContain('detached HEAD');
  });

  it('restores a lost commit with reset --hard HEAD@{1}', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "keep me"').state;
    state = executeCommand(state, 'git reset --hard HEAD~1').state;

    const result = executeCommand(state, 'git reset --hard HEAD@{1}');

    expect(result.ok).toBe(true);
    expect(getHeadCommit(result.state)).toBe('0000002');
    expect(result.state.commits.get('0000002')?.message).toBe('keep me');
  });

  it('only deletes merged branches with git branch -d', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = executeCommand(state, 'git checkout -b feature').state;
    state = executeCommand(state, 'git commit --allow-empty -m "feature work"').state;
    state = executeCommand(state, 'git checkout main').state;

    const invalidDelete = executeCommand(state, 'git branch -d feature');
    expect(invalidDelete.ok).toBe(false);
    expect(invalidDelete.output).toContain('尚未合并');

    state = executeCommand(state, 'git merge feature').state;
    const validDelete = executeCommand(state, 'git branch -d feature');

    expect(validDelete.ok).toBe(true);
    expect(validDelete.state.branches.has('feature')).toBe(false);
  });
});

describe('git-simulator 远程协作', () => {
  it('lists local and remote-tracking branches with git branch -a', () => {
    const state = createCollaborationState({ sharedMessages: ['setup project'] });
    const result = executeCommand(state, 'git branch -a');

    expect(result.ok).toBe(true);
    expect(result.output).toContain('* main');
    expect(result.output).toContain('remotes/origin/main');
  });

  it('shows ahead info in git status when local is ahead of origin', () => {
    const state = createCollaborationState({
      sharedMessages: ['setup project'],
      localMessages: ['local: update readme'],
    });
    const result = executeCommand(state, 'git status');

    expect(result.ok).toBe(true);
    expect(result.output).toContain('领先');
  });

  it('fetches teammate commits without merging them', () => {
    const state = createCollaborationState({
      sharedMessages: ['setup project'],
      teammateMessages: ['teammate: add docs'],
    });
    const trackingBefore = state.remoteTracking.get('origin/main');
    const mainBefore = state.branches.get('main');
    const result = executeCommand(state, 'git fetch origin');

    expect(result.ok).toBe(true);
    const trackingAfter = result.state.remoteTracking.get('origin/main');
    expect(trackingAfter).not.toBe(trackingBefore);
    expect(result.state.commits.has(trackingAfter ?? '')).toBe(true);
    expect(result.output).toContain('origin/main');
    expect(result.state.branches.get('main')).toBe(mainBefore);
  });

  it('fast-forwards local main with git pull', () => {
    const state = createCollaborationState({
      sharedMessages: ['setup project'],
      teammateMessages: ['teammate: add docs'],
    });
    const result = executeCommand(state, 'git pull origin main');
    const mainHead = result.state.branches.get('main');

    expect(result.ok).toBe(true);
    expect(mainHead).toBe(result.state.remote?.branches.get('main'));
    expect(mainHead).not.toBe(state.branches.get('main'));
  });

  it('pushes a new branch and sets up tracking', () => {
    let state = createCollaborationState({ sharedMessages: ['setup project'] });
    state = executeCommand(state, 'git checkout -b feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "feature work"').state;

    const featureHead = state.branches.get('feature');
    const result = executeCommand(state, 'git push -u origin feature');

    expect(result.ok).toBe(true);
    expect(result.state.remote?.branches.get('feature')).toBe(featureHead);
    expect(result.state.upstream.get('feature')).toBe('origin/feature');
  });

  it('rejects a non-fast-forward push and recovers with pull then push', () => {
    const state = createCollaborationState({
      sharedMessages: ['setup project'],
      localMessages: ['local: update readme'],
      teammateMessages: ['teammate: fix navbar'],
    });

    const rejected = executeCommand(state, 'git push origin main');
    expect(rejected.ok).toBe(false);
    expect(rejected.output).toContain('non-fast-forward');
    expect(rejected.state.remote?.branches.get('main')).toBe(
      state.remote?.branches.get('main')
    );

    const merged = executeCommand(rejected.state, 'git pull origin main');
    expect(merged.ok).toBe(true);
    const mergedHeadId = getHeadCommit(merged.state);
    const mergedHead = mergedHeadId
      ? merged.state.commits.get(mergedHeadId)
      : null;
    expect(mergedHead?.parents).toHaveLength(2);

    const pushed = executeCommand(merged.state, 'git push origin main');
    expect(pushed.ok).toBe(true);
    expect(pushed.state.remote?.branches.get('main')).toBe(mergedHeadId);
  });
});
