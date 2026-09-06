import { describe, expect, it } from 'vitest';
import { createInitialState, executeCommand } from '@/lib/git-simulator';

describe('submodule 多仓库教学模拟', () => {
  it('add 注册子模块并生成配置', () => {
    const state = createInitialState();
    const result = executeCommand(
      state,
      'git submodule add https://github.com/lib/lib.git vendor/lib'
    );

    expect(result.ok).toBe(true);
    expect(result.state.submodules).toHaveLength(1);
    expect(result.state.submodules[0]).toMatchObject({
      path: 'vendor/lib',
      url: 'https://github.com/lib/lib.git',
      initialized: true,
    });
    expect(result.output).toContain('.gitmodules');
  });

  it('init/update 完成克隆后的拉起流程', () => {
    // 模拟"clone 了含子模块的项目，但子模块未初始化"的场景：
    // 用自定义初始状态直接注入
    const base = createInitialState();
    const seeded = {
      ...base,
      submodules: [{ path: 'vendor/lib', url: 'https://github.com/lib/lib.git', initialized: false }],
    };

    const updateFirst = executeCommand(seeded, 'git submodule update');
    expect(updateFirst.ok).toBe(false);
    expect(updateFirst.output).toContain('init');

    const initialized = executeCommand(seeded, 'git submodule init');
    expect(initialized.ok).toBe(true);
    expect(initialized.state.submodules[0].initialized).toBe(true);

    const updated = executeCommand(initialized.state, 'git submodule update');
    expect(updated.ok).toBe(true);
    expect(updated.output).toContain('检出');
  });

  it('status 列出子模块', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git submodule add https://github.com/lib/a.git vendor/a').state;

    const result = executeCommand(state, 'git submodule status');
    expect(result.ok).toBe(true);
    expect(result.output).toContain('vendor/a');
  });

  it('重复添加和空列表场景被正确处理', () => {
    let state = createInitialState();
    state = executeCommand(state, 'git submodule add https://x.com/a.git vendor/a').state;

    const duplicate = executeCommand(state, 'git submodule add https://x.com/b.git vendor/a');
    expect(duplicate.ok).toBe(false);

    const empty = executeCommand(createInitialState(), 'git submodule status');
    expect(empty.ok).toBe(true);
    expect(empty.output).toContain('没有子模块');
  });
});
