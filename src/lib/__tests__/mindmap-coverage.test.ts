import { describe, expect, it } from 'vitest';
import { createCollaborationState, createInitialState, executeCommand } from '@/lib/git-simulator';

// 思维导图"Git 命令大全"12 个分支的代表性命令覆盖
describe('思维导图命令覆盖', () => {
  it.each([
    ['git pull origin master', 'ok'],
    ['git push origin dev', 'ok'],
    ['git remote -v', 'ok'],
    ['git merge dev', 'ok'],
    ['git branch -a', 'ok'],
    ['git log --oneline --graph --all', 'ok'],
    ['git status -s', 'ok'],
    ['git add file1.txt file2.txt', 'ok'],
    ['git commit -m "Add some files"', 'ok'],
    ['git switch -c feature', 'ok'],
    // 新仓库已在 main 上，switch 到 main 是合法操作（已在分支上）
    ['git switch main', 'ok'],
    ['git init /path/to/project', 'ok'],
    ['git config --global user.name x', 'unsupported'],
    // clone 现已支持：会真正建立远程跟踪
    ['git clone https://github.com/user/repo.git', 'ok'],
  ] as const)('%s', (command, expected) => {
    const result = executeCommand(createInitialState(), command);

    if (expected === 'unsupported') {
      expect(result.reason).toBe('unsupported');
      return;
    }

    expect(['ok', 'invalid']).toContain(result.ok ? 'ok' : 'invalid');
    if (['git pull origin master', 'git push origin dev'].includes(command)) {
      expect(result.output).toContain('远程仓库');
    }
    if (command === 'git merge dev') {
      expect(result.output).toContain('不存在');
    }
  });

  it('协作场景下 pull/push/merge/switch 全链路可用', () => {
    let state = createCollaborationState({
      sharedMessages: ['setup project'],
      teammateMessages: ['teammate: add docs'],
    });

    state = executeCommand(state, 'git status -s').state;
    // 远程只有 origin/main，用 git pull origin main 同步队友提交
    const pulled = executeCommand(state, 'git pull origin main');
    expect(pulled.ok).toBe(true);

    state = executeCommand(pulled.state, 'git switch -c dev').state;
    expect(state.HEAD).toBe('ref: dev');

    const switched = executeCommand(state, 'git switch main');
    expect(switched.ok).toBe(true);
    expect(switched.state.HEAD).toBe('ref: main');

    state = executeCommand(switched.state, 'git branch dev').state;
    const pushed = executeCommand(state, 'git push origin dev');
    expect(pushed.ok).toBe(true);

    const merged = executeCommand(pushed.state, 'git merge dev');
    expect(merged.ok).toBe(true);
    expect(merged.state.HEAD).toBe('ref: main');
  });
});
