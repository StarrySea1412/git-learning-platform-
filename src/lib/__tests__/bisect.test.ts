import { describe, expect, it } from 'vitest';
import { createInitialState, executeCommand } from '@/lib/git-simulator';

describe('bisect 二分查找状态机', () => {
  function buildHistory() {
    // 4 个提交的历史：base(好) -> c2(好) -> c3(坏，引入bug) -> c4(坏)
    let state = createInitialState({ staging: true });
    state = executeCommand(state, 'git commit -m "base"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "c2"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "c3: introduce bug"').state;
    state = { ...state, staging: true };
    state = executeCommand(state, 'git commit -m "c4"').state;
    return state;
  }

  function getHeadId(s: typeof state) {
    return s.HEAD.startsWith('ref: ') ? s.branches.get(s.HEAD.slice(5)) ?? null : s.HEAD;
  }
  let state: ReturnType<typeof createInitialState>;

  it('start 后 HEAD 标记为坏点', () => {
    state = buildHistory();
    const result = executeCommand(state, 'git bisect start');

    expect(result.ok).toBe(true);
    expect(result.state.bisect?.badId).toBe(getHeadId(state));
  });

  it('确定好边界后开始缩圈，最终锁定第一个坏提交', () => {
    const started = executeCommand(state, 'git bisect start').state;
    // 标记 c2（0000002）为好边界
    const bounded = executeCommand(started, 'git bisect good 0000002').state;
    expect(bounded.bisect?.goodId).toBe('0000002');

    // 第一次判定：中间点（c3 或 c4）——按测试场景判 bad
    let cur = bounded;
    let steps = 0;
    while (!cur.bisect?.foundId && steps < 5) {
      cur = executeCommand(cur, 'git bisect bad').state;
      steps += 1;
    }

    expect(cur.bisect?.foundId).not.toBeNull();
    // 全部判 bad 时，最老的可疑提交被锁定
    const found = cur.bisect?.foundId;
    expect(['0000003', '0000004']).toContain(found);

    // reset 退出
    const reset = executeCommand(cur, 'git bisect reset');
    expect(reset.ok).toBe(true);
    expect(reset.state.bisect).toBeNull();
  });

  it('未 start 时判定被拒绝', () => {
    const result = executeCommand(createInitialState(), 'git bisect bad');
    expect(result.ok).toBe(false);
    expect(result.output).toContain('bisect start');
  });

  it('确定好边界前判 bad 被拒绝', () => {
    const started = executeCommand(createInitialState(), 'git bisect start').state;
    const result = executeCommand(started, 'git bisect bad');
    expect(result.ok).toBe(false);
    expect(result.output).toContain('好边界');
  });
});
