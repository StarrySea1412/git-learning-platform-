import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TutorialPage from './page';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/components/CodeBlock', () => ({
  default: ({ code }: { code: string }) => React.createElement('pre', null, code),
}));

vi.mock('@/lib/highlight', () => ({
  renderHighlightedCode: vi.fn(async () => '<span>highlighted</span>'),
}));

describe('TutorialPage', () => {
  it('renders related practice links for mapped tutorials', async () => {
    const view = await TutorialPage({
      params: { id: 'git-reflog' },
    });

    render(view);

    expect(screen.getByText('学完马上练')).toBeInTheDocument();
    expect(screen.getByText('查看引用日志')).toBeInTheDocument();
    expect(screen.getByText('误用 hard reset 后自救')).toBeInTheDocument();
    expect(screen.getByText('先做这题：查看引用日志')).toBeInTheDocument();
  });
});
