import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  createCollaborationState,
  executeCommand,
  teammatePush,
  getHeadBranch,
  getHeadCommit,
} from '../src';

describe('git-simulator-core package', () => {
  it('runs a full local workflow', () => {
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = executeCommand(state, 'git switch -c feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "work"').state;
    state = executeCommand(state, 'git switch main').state;

    const merged = executeCommand(state, 'git merge feature');
    expect(merged.ok).toBe(true);
    expect(getHeadBranch(merged.state)).toBe('main');
  });

  it('rejects non-fast-forward pushes and recovers', () => {
    const state = createCollaborationState({
      sharedMessages: ['setup'],
      localMessages: ['local work'],
      teammateMessages: ['teammate work'],
    });

    const rejected = executeCommand(state, 'git push origin main');
    expect(rejected.ok).toBe(false);
    expect(rejected.output).toContain('non-fast-forward');

    const merged = executeCommand(rejected.state, 'git pull origin main');
    const pushed = executeCommand(merged.state, 'git push origin main');
    expect(pushed.ok).toBe(true);
  });

  it('produces merge conflicts on same-file edits', () => {
    let state = createInitialState({ configValue: 'a' });
    state = executeCommand(state, 'git branch feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "ours" config="b"').state;
    state = executeCommand(state, 'git checkout feature').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "theirs" config="c"').state;
    state = executeCommand(state, 'git checkout main').state;

    const merged = executeCommand(state, 'git merge feature');
    expect(merged.ok).toBe(false);
    expect(merged.state.mergeConflict).not.toBeNull();

    const resolved = executeCommand(merged.state, 'resolve-conflict both');
    expect(resolved.ok).toBe(true);
    expect(resolved.state.mergeConflict).toBeNull();
  });

  it('simulates teammate pushing mid-practice', () => {
    const state = createCollaborationState({ sharedMessages: ['setup'] });
    const trackingBefore = state.remoteTracking.get('origin/main');

    const pushed = teammatePush(state, 'teammate: late change');
    expect(pushed.ok).toBe(true);
    expect(pushed.state.remoteTracking.get('origin/main')).toBe(trackingBefore);

    const fetched = executeCommand(pushed.state, 'git fetch');
    expect(fetched.state.remoteTracking.get('origin/main')).not.toBe(trackingBefore);
  });

  it('exposes head helpers', () => {
    const state = createInitialState();
    expect(getHeadBranch(state)).toBe('main');
    expect(getHeadCommit(state)).not.toBeNull();
  });
});
