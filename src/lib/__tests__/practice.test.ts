import { describe, expect, it } from 'vitest';
import {
  evaluateInteractivePracticeCommand,
  getPracticeTaskById,
} from '@/lib/practice';
import { executeCommand } from '@/lib/git-simulator';

function getInteractiveTask(taskId: string) {
  const task = getPracticeTaskById(taskId);

  if (!task || task.mode !== 'interactive') {
    throw new Error(`${taskId} task not found`);
  }

  return task;
}

function runInteractiveTask(taskId: string, commands: string[]) {
  const task = getInteractiveTask(taskId);
  let state = task.createInitialState();
  let stepIndex = 0;

  for (const command of commands) {
    const result = executeCommand(state, command);
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      stepIndex,
      command,
      state,
      result
    );

    state = result.state;
    stepIndex = evaluation.nextStepIndex;

    if (!evaluation.advanced && !evaluation.completed) {
      throw new Error(`Task ${taskId} did not advance on command: ${command}`);
    }
  }

  return { state, stepIndex };
}

describe('practice evaluation', () => {
  it('advances git-init after the correct command', () => {
    const task = getInteractiveTask('git-init');
    const previousState = task.createInitialState();
    const result = executeCommand(previousState, 'git init');
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      0,
      'git init',
      previousState,
      result
    );

    expect(evaluation.advanced).toBe(true);
    expect(evaluation.completed).toBe(true);
    expect(evaluation.feedback).toBe(task.successMessage);
  });

  it('rejects unsupported commands for the current step', () => {
    const task = getInteractiveTask('git-add');
    const previousState = task.createInitialState();
    const result = executeCommand(previousState, 'git status');
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      0,
      'git status',
      previousState,
      result
    );

    expect(evaluation.advanced).toBe(false);
    expect(evaluation.completed).toBe(false);
    expect(evaluation.feedback).toContain('命令不正确');
  });

  it('completes the upgraded cherry-pick task', () => {
    const task = getInteractiveTask('cherry-pick-commit');
    const previousState = task.createInitialState();
    const result = executeCommand(previousState, 'git cherry-pick 0000003');
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      0,
      'git cherry-pick 0000003',
      previousState,
      result
    );

    expect(evaluation.completed).toBe(true);
    expect(result.state.commits.size).toBe(previousState.commits.size + 1);
  });

  it('completes the upgraded rebase --onto task', () => {
    const { state } = runInteractiveTask('rebase-onto', [
      'git rebase --onto main feature-base feature',
    ]);

    expect(state.branches.has('feature')).toBe(true);
    expect(state.branches.get('feature')).not.toBe('0000004');
  });

  it('completes the reflog recovery task end to end', () => {
    const { state } = runInteractiveTask('reflog-recovery', [
      'git reset --hard HEAD~1',
      'git reflog',
      'git reset --hard HEAD@{1}',
    ]);

    expect(state.branches.get('main')).toBe('0000002');
  });

  it('completes the detached HEAD rescue task end to end', () => {
    const { state } = runInteractiveTask('detached-head-rescue', [
      'git checkout 0000001',
      'git checkout -b rescue',
    ]);

    expect(state.branches.get('rescue')).toBe('0000001');
  });

  it('completes the merged branch deletion task', () => {
    const task = getInteractiveTask('delete-merged-branch');
    const previousState = task.createInitialState();
    const result = executeCommand(previousState, 'git branch -d feature');
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      0,
      'git branch -d feature',
      previousState,
      result
    );

    expect(evaluation.completed).toBe(true);
    expect(result.state.branches.has('feature')).toBe(false);
  });

  it('fails when the rebase --onto command is correct but the resulting state is not the expected scenario', () => {
    const task = getInteractiveTask('rebase-onto');
    let previousState = task.createInitialState();
    previousState = executeCommand(previousState, 'git checkout feature').state;
    const result = executeCommand(
      previousState,
      'git rebase --onto main feature-base feature'
    );
    const evaluation = evaluateInteractivePracticeCommand(
      task,
      0,
      'git rebase --onto main feature-base feature',
      previousState,
      result
    );

    expect(result.ok).toBe(true);
    expect(evaluation.advanced).toBe(false);
    expect(evaluation.completed).toBe(false);
    expect(evaluation.feedback).toContain('仓库状态还没有达到本步骤目标');
  });
});
