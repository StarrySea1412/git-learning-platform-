import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PracticeTaskPage from '@/components/PracticeTaskPage';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('framer-motion', async () => {
  const ReactModule = await import('react');

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: () =>
          ReactModule.forwardRef(({ children, ...props }: any, ref) =>
            React.createElement('div', { ...props, ref }, children)
          ),
      }
    ),
  };
});

vi.mock('@/components/AchievementToast', () => ({
  default: () => null,
}));

vi.mock('@/components/GitGraph', () => ({
  default: () => React.createElement('div', { 'data-testid': 'git-graph' }),
}));

vi.mock('@/components/Terminal', () => ({
  default: ({ initialOutput }: { initialOutput: string }) =>
    React.createElement('div', { 'data-testid': 'terminal' }, initialOutput),
}));

vi.mock('@/components/CodeBlock', () => ({
  default: ({ code }: { code: string }) => React.createElement('pre', null, code),
}));

vi.mock('@/lib/usePracticeProgress', () => ({
  usePracticeProgress: () => ({
    markCompleted: vi.fn(),
    newAchievement: null,
    dismissAchievement: vi.fn(),
    isCompleted: () => false,
  }),
}));

describe('PracticeTaskPage', () => {
  it('shows prerequisites, related tutorials, and an explicit next step recommendation', () => {
    render(<PracticeTaskPage id="rebase-onto" />);

    expect(screen.getByText('前置练习')).toBeInTheDocument();
    expect(screen.getByText('同步功能分支最新主线')).toBeInTheDocument();

    expect(screen.getByText('相关教程')).toBeInTheDocument();
    expect(screen.getByText('变基 (Rebase)')).toBeInTheDocument();
    expect(screen.getByText('Rebase --onto 与高级用法')).toBeInTheDocument();

    expect(screen.getByText('明确下一步')).toBeInTheDocument();
    expect(screen.getAllByText('下一题：紧急切任务前暂存现场').length).toBeGreaterThan(0);
  });
});
