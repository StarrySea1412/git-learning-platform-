'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Phase = 'branches' | 'merge-start' | 'conflict' | 'resolving' | 'resolved' | 'done';

export default function ConflictAnimation() {
  const [phase, setPhase] = useState<Phase>('branches');
  const [chooseOurs, setChooseOurs] = useState<boolean | null>(null);

  const mainLine = 'const greeting = "Hello, World!";';
  const featureLine = 'const greeting = "你好，世界！";';
  const resolvedOurs = 'const greeting = "你好，世界！";';
  const resolvedTheirs = 'const greeting = "Hello, World!";';

  const next = () => {
    const order: Phase[] = ['branches', 'merge-start', 'conflict', 'resolving', 'resolved', 'done'];
    const idx = order.indexOf(phase);
    if (idx < order.length - 1) setPhase(order[idx + 1]);
  };

  const handleResolve = (ours: boolean) => {
    setChooseOurs(ours);
    setPhase('resolved');
  };

  const reset = () => {
    setPhase('branches');
    setChooseOurs(null);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        冲突出现后，Git 在等你做决定
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        这张动画不是让你背按钮，而是帮助你先认识冲突标记、解决顺序和最终提交动作。
      </p>

      <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
        场景：main 和 feature-login 同时改到了 greeting.ts 的同一行。Git 无法自动判断最终该保留哪种结果，所以会先暂停合并流程。
      </div>

      <div className="mb-6 flex items-center gap-1 text-xs">
        {['各自开发', '执行合并', '看到冲突', '手动决策', '提交结果'].map((label, i) => {
          const phaseIdx = ['branches', 'merge-start', 'conflict', 'resolving', 'resolved', 'done'].indexOf(phase);
          const stepIdx = i < 3 ? i : i === 3 ? 3 : 4;
          return (
            <div key={label} className="flex flex-1 items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-[10px] transition-colors ${
                  phaseIdx > stepIdx + 1
                    ? 'bg-green-500 text-white'
                    : phaseIdx === stepIdx + 1 || (i === 4 && phase === 'done')
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                }`}
              >
                {phaseIdx > stepIdx + 1 || (i === 4 && phase === 'done') ? '✓' : i + 1}
              </div>
              <span
                className={`truncate ${
                  phaseIdx >= stepIdx + 1 || (i === 4 && phase === 'done')
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {i < 4 && (
                <div
                  className={`h-px flex-1 ${
                    phaseIdx > stepIdx + 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-blue-500">main (ours)</p>
          <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
            <div className="text-gray-400">{'// greeting.ts'}</div>
            <div
              className={`mt-1 ${
                phase === 'conflict' || phase === 'resolving'
                  ? 'rounded bg-red-100 px-1 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : phase === 'resolved' && chooseOurs === true
                  ? 'rounded bg-green-100 px-1 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {mainLine}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-green-500">feature-login (theirs)</p>
          <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
            <div className="text-gray-400">{'// greeting.ts'}</div>
            <div
              className={`mt-1 ${
                phase === 'conflict' || phase === 'resolving'
                  ? 'rounded bg-red-100 px-1 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : phase === 'resolved' && chooseOurs === false
                  ? 'rounded bg-green-100 px-1 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {featureLine}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'conflict' && (
          <motion.div
            key="conflict"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          >
            <p className="mb-2 text-sm font-medium text-red-700 dark:text-red-300">
              冲突现场：Git 把两边的版本都标出来，等你决定最终内容
            </p>
            <div className="whitespace-pre rounded bg-gray-900 p-3 font-mono text-xs text-gray-300">
{`<<<<<<< HEAD
${mainLine}
=======
${featureLine}
>>>>>>> feature-login`}
            </div>
          </motion.div>
        )}

        {phase === 'resolving' && (
          <motion.div
            key="resolving"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
          >
            <p className="mb-3 text-sm font-medium text-yellow-700 dark:text-yellow-300">
              实际项目里常常需要“融合两边”，这里先用二选一帮助你理解 Git 在等待什么。
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleResolve(true)}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                保留 main 版本
                <div className="mt-1 font-mono text-xs opacity-80">{mainLine}</div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleResolve(false)}
                className="flex-1 rounded-lg bg-green-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                保留 feature 版本
                <div className="mt-1 font-mono text-xs opacity-80">{featureLine}</div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'resolved' && (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
          >
            <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
              冲突内容已经确定，接下来要把“已解决”这个事实告诉 Git。
            </p>
            <div className="rounded bg-gray-900 p-3 font-mono text-xs text-green-400">
              {chooseOurs ? resolvedOurs : resolvedTheirs}
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4 text-center dark:border-primary-800 dark:bg-primary-900/20"
          >
            <p className="font-medium text-primary-700 dark:text-primary-300">收尾动作：先标记已解决，再提交合并结果。</p>
            <p className="mt-1 text-xs text-primary-500 dark:text-primary-400">
              git add greeting.ts &amp;&amp; git commit
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {phase === 'branches' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="rounded-lg bg-primary-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-600"
          >
            git merge feature-login
          </motion.button>
        )}
        {phase === 'merge-start' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="rounded-lg bg-red-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-red-600"
          >
            看到冲突标记
          </motion.button>
        )}
        {phase === 'conflict' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            className="rounded-lg bg-yellow-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-yellow-600"
          >
            开始手动解决
          </motion.button>
        )}
        {phase === 'resolved' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPhase('done')}
            className="rounded-lg bg-green-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-green-600"
          >
            标记解决并提交
          </motion.button>
        )}
        {phase === 'done' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="rounded-lg bg-gray-200 px-5 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            重置
          </motion.button>
        )}
      </div>
    </div>
  );
}
