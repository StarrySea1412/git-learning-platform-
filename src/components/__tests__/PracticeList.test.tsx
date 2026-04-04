import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PracticeList from '@/components/PracticeList';

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

vi.mock('@/lib/usePracticeProgress', () => ({
  usePracticeProgress: () => ({
    completedIds: new Set<string>(),
    isCompleted: () => false,
  }),
}));

describe('PracticeList', () => {
  it('renders the advanced lab sections as topic-based groups', () => {
    render(<PracticeList />);

    expect(screen.getByText('高级实验室 · 提交搬运')).toBeInTheDocument();
    expect(screen.getByText('高级实验室 · 历史整理')).toBeInTheDocument();
    expect(screen.getByText('高级实验室 · 恢复与切换')).toBeInTheDocument();

    expect(screen.getByText('发布前搬运热修提交')).toBeInTheDocument();
    expect(screen.getByText('精准搬运提交段')).toBeInTheDocument();
    expect(screen.getByText('误用 hard reset 后自救')).toBeInTheDocument();
  });
});
