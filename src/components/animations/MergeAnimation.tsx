'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface CommitNode {
  id: string;
  x: number;
  y: number;
  branch: string;
}

export default function MergeAnimation() {
  const [mainCommits] = useState<CommitNode[]>([
    { id: 'm1', x: 60, y: 80, branch: 'main' },
    { id: 'm2', x: 140, y: 80, branch: 'main' },
  ]);
  const [featureCommits] = useState<CommitNode[]>([
    { id: 'f1', x: 140, y: 160, branch: 'feature-login' },
    { id: 'f2', x: 220, y: 160, branch: 'feature-login' },
  ]);
  const [merged, setMerged] = useState(false);
  const [mergeCommit, setMergeCommit] = useState<CommitNode | null>(null);

  const handleMerge = () => {
    if (merged) return;

    const newMergeCommit: CommitNode = {
      id: 'merge',
      x: 300,
      y: 80,
      branch: 'main',
    };

    setMergeCommit(newMergeCommit);
    setMerged(true);
  };

  const reset = () => {
    setMerged(false);
    setMergeCommit(null);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        把功能分支安全合并回 main
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        功能开发完成后，main 与 feature-login 会在一次合并中重新汇合。
      </p>

      <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
        这里模拟的是典型收尾场景：主线保留上线节奏，功能分支保留独立开发痕迹，最后生成一次 merge commit。
      </div>

      <div className="mb-6 flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMerge}
          disabled={merged}
          className={`rounded-lg px-6 py-2 font-semibold transition-colors ${
            merged
              ? 'cursor-not-allowed bg-gray-300 text-gray-500'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
        >
          {merged ? '已合并回 main' : '执行 git merge feature-login'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={reset}
          className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          重置
        </motion.button>
      </div>

      <div className="relative h-48 overflow-x-auto rounded-lg bg-gray-50 dark:bg-gray-900">
        <svg className="absolute inset-0 h-full w-full min-w-[400px]">
          <line
            x1="60"
            y1="80"
            x2={merged ? 300 : 140}
            y2="80"
            stroke="#3b82f6"
            strokeWidth="3"
          />

          <line x1="140" y1="80" x2="140" y2="160" stroke="#10b981" strokeWidth="3" />
          <line x1="140" y1="160" x2="220" y2="160" stroke="#10b981" strokeWidth="3" />

          <AnimatePresence>
            {merged && (
              <>
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                  x1="220"
                  y1="160"
                  x2="300"
                  y2="80"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
                <motion.line
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  x1="140"
                  y1="80"
                  x2="300"
                  y2="80"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
              </>
            )}
          </AnimatePresence>
        </svg>

        {mainCommits.map((commit) => (
          <motion.div
            key={commit.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
            style={{
              left: commit.x - 20,
              top: commit.y - 20,
              backgroundColor: '#3b82f6',
            }}
          >
            {commit.id}
          </motion.div>
        ))}

        {featureCommits.map((commit) => (
          <motion.div
            key={commit.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg"
            style={{
              left: commit.x - 20,
              top: commit.y - 20,
              backgroundColor: '#10b981',
            }}
          >
            {commit.id}
          </motion.div>
        ))}

        <AnimatePresence>
          {mergeCommit && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
              className="absolute flex h-12 w-12 items-center justify-center rounded-full border-4 border-purple-400 text-sm font-bold text-white shadow-lg"
              style={{
                left: mergeCommit.x - 24,
                top: mergeCommit.y - 24,
                backgroundColor: '#8b5cf6',
              }}
            >
              M
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute left-2 top-16 text-sm font-medium text-blue-600">main</div>
        <div className="absolute left-2 top-36 text-sm font-medium text-green-600">
          feature-login
        </div>
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <p>合并前两条线各自前进，合并后会在 main 上出现一个新的汇合点。</p>
        <p>这类历史更适合保留真实协作轨迹，方便回看“谁在什么时候把功能带回了主线”。</p>
      </div>
    </div>
  );
}
