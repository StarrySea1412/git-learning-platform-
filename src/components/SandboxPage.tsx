'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import GitGraph from '@/components/GitGraph';
import Terminal from '@/components/Terminal';
import { createInitialState, executeCommand, type GitState } from '@/lib/git-simulator';

function buildSandboxState(): GitState {
  return createInitialState({ workingTreeDirty: true });
}

export default function SandboxPage() {
  const [gitState, setGitState] = useState<GitState>(buildSandboxState);
  const [resetKey, setResetKey] = useState(0);

  const handleCommand = useCallback(
    (command: string) => {
      const result = executeCommand(gitState, command);
      setGitState(result.state);
      return {
        success: result.ok,
        output: result.output,
      };
    },
    [gitState]
  );

  const handleReset = useCallback(() => {
    setGitState(buildSandboxState());
    setResetKey((value) => value + 1);
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <Link
            href="/practice"
            className="inline-flex items-center text-primary-500 hover:text-primary-600"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回练习列表
          </Link>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm text-gray-700 dark:text-gray-300"
          >
            重置沙盒
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            自由沙盒
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            这里预置了一处未暂存修改，方便你先从 add / commit 开始试验。
            如果想继续制造提交历史，可以使用
            <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">git commit --allow-empty -m &quot;message&quot;</code>
            来快速生成示例提交。
          </p>
        </div>

        <div className="space-y-4">
          <GitGraph state={gitState} />
          <Terminal
            onCommand={handleCommand}
            initialOutput={[
              '欢迎来到自由沙盒。',
              '支持的命令：git status / add / commit / log / branch / checkout / switch / merge / rebase / reset / revert / cherry-pick / stash / reflog',
              '如果不确定从哪开始，先试试 git status。',
            ].join('\n')}
            resetKey={resetKey}
          />
        </div>
      </div>
    </div>
  );
}
