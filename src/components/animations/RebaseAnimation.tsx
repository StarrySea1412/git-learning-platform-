'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Commit {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface Line {
  from: string;
  to: string;
  color: string;
  dashed?: boolean;
}

export default function RebaseAnimation() {
  const [phase, setPhase] = useState<'before' | 'rebase' | 'after'>('before');

  const beforeCommits: Commit[] = [
    { id: 'A', label: 'A', x: 60, y: 80, color: '#3b82f6' },
    { id: 'B', label: 'B', x: 160, y: 80, color: '#3b82f6' },
    { id: 'C', label: 'C', x: 260, y: 80, color: '#3b82f6' },
    { id: 'D', label: 'D', x: 160, y: 170, color: '#10b981' },
    { id: 'E', label: 'E', x: 260, y: 170, color: '#10b981' },
  ];

  const afterCommits: Commit[] = [
    { id: 'A', label: 'A', x: 60, y: 80, color: '#3b82f6' },
    { id: 'B', label: 'B', x: 160, y: 80, color: '#3b82f6' },
    { id: 'C', label: 'C', x: 260, y: 80, color: '#3b82f6' },
    { id: "D'", label: "D'", x: 360, y: 80, color: '#10b981' },
    { id: "E'", label: "E'", x: 460, y: 80, color: '#10b981' },
  ];

  const beforeLines: Line[] = [
    { from: 'A', to: 'B', color: '#3b82f6' },
    { from: 'B', to: 'C', color: '#3b82f6' },
    { from: 'B', to: 'D', color: '#10b981' },
    { from: 'D', to: 'E', color: '#10b981' },
  ];

  const afterLines: Line[] = [
    { from: 'A', to: 'B', color: '#3b82f6' },
    { from: 'B', to: 'C', color: '#3b82f6' },
    { from: 'C', to: "D'", color: '#10b981' },
    { from: "D'", to: "E'", color: '#10b981' },
  ];

  const getPos = (commits: Commit[], id: string) => {
    const commit = commits.find((item) => item.id === id);
    return commit ? { x: commit.x, y: commit.y } : { x: 0, y: 0 };
  };

  const handleRebase = () => {
    setPhase('rebase');
    setTimeout(() => setPhase('after'), 1500);
  };

  const handleReset = () => setPhase('before');

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        功能分支跟上 main 的最新进度
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        当 main 已经继续前进时，可以把 feature-login 上的工作重放到最新主线后面。
      </p>

      <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
        这里重点看两件事：旧的 D、E 不会“平移”，而是以新的提交身份 D&apos;、E&apos; 接到 main 最新提交后面。
      </div>

      <div className="mb-6 flex gap-4">
        {phase === 'before' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRebase}
            className="rounded-lg bg-primary-500 px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-600"
          >
            执行 git rebase main
          </motion.button>
        )}
        {phase === 'after' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            重置
          </motion.button>
        )}
        {phase === 'rebase' && (
          <span className="animate-pulse px-6 py-2 text-gray-500 dark:text-gray-400">
            正在把功能提交重放到 main 最新位置...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Rebase 前：功能分支还停在旧基底上
          </p>
          <div className="relative h-48 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
            <svg className="absolute inset-0 h-full w-full">
              {beforeLines.map((line, i) => {
                const from = getPos(beforeCommits, line.from);
                const to = getPos(beforeCommits, line.to);
                return (
                  <motion.line
                    key={`before-${i}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.15 }}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={line.color}
                    strokeWidth="3"
                    strokeDasharray={line.dashed ? '5,5' : undefined}
                  />
                );
              })}
            </svg>
            {beforeCommits.map((commit, i) => (
              <motion.div
                key={commit.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: i * 0.1 }}
                className="absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
                style={{
                  left: commit.x - 20,
                  top: commit.y - 20,
                  backgroundColor: commit.color,
                }}
              >
                {commit.label}
              </motion.div>
            ))}
            <div className="absolute left-2 top-2 text-xs font-medium text-blue-500">main</div>
            <div className="absolute left-2 top-[130px] text-xs font-medium text-green-500">
              feature-login
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Rebase 后：功能历史被接到 main 最新提交后面
          </p>
          <div className="relative h-48 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
            <AnimatePresence mode="wait">
              {phase === 'before' ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-gray-400 dark:text-gray-500"
                >
                  点击“执行 git rebase main”，观察 feature-login 如何跟上主线最新进度。
                </motion.div>
              ) : (
                <motion.div key="result" className="absolute inset-0">
                  <svg className="absolute inset-0 h-full w-full">
                    {afterLines.map((line, i) => {
                      const from = getPos(afterCommits, line.from);
                      const to = getPos(afterCommits, line.to);
                      return (
                        <motion.line
                          key={`after-${i}`}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.4, delay: i * 0.15 + 0.2 }}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={line.color}
                          strokeWidth="3"
                        />
                      );
                    })}
                  </svg>
                  {afterCommits.map((commit, i) => (
                    <motion.div
                      key={commit.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: i * 0.12 + 0.1 }}
                      className="absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
                      style={{
                        left: commit.x - 20,
                        top: commit.y - 20,
                        backgroundColor: commit.color,
                      }}
                    >
                      {commit.label}
                    </motion.div>
                  ))}
                  <div className="absolute left-2 top-2 text-xs font-medium text-blue-500">
                    main / feature-login
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <p>rebase 会生成新的提交身份，因此你看到的是 D&apos;、E&apos;，而不是原来的 D、E 被“搬动”过去。</p>
        <p>这样整理后的历史更线性，适合在功能分支同步主线时保持阅读清晰度。</p>
      </div>
    </div>
  );
}
