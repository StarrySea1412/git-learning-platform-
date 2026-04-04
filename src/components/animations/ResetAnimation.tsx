'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ResetMode = null | 'soft' | 'mixed' | 'hard';

export default function ResetAnimation() {
  const [mode, setMode] = useState<ResetMode>(null);

  const modes = [
    {
      key: 'soft' as const,
      label: '--soft',
      desc: '移动 HEAD，保留暂存区和工作区',
      headColor: '#f59e0b',
      stagedColor: '#10b981',
      workColor: '#3b82f6',
    },
    {
      key: 'mixed' as const,
      label: '--mixed (默认)',
      desc: '移动 HEAD，重置暂存区，保留工作区',
      headColor: '#f59e0b',
      stagedColor: '#f59e0b',
      workColor: '#3b82f6',
    },
    {
      key: 'hard' as const,
      label: '--hard',
      desc: '移动 HEAD，重置暂存区和工作区（危险！）',
      headColor: '#f59e0b',
      stagedColor: '#f59e0b',
      workColor: '#f59e0b',
    },
  ];

  const commits = [
    { id: 'c1', label: 'A', x: 50 },
    { id: 'c2', label: 'B', x: 140 },
    { id: 'c3', label: 'C', x: 230 },
    { id: 'c4', label: 'D', x: 320 },
    { id: 'c5', label: 'E', x: 410 },
  ];

  const headTargetX = mode ? 230 : 410;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Git Reset 三种模式对比
      </h3>

      {/* Mode buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {modes.map((m) => (
          <motion.button
            key={m.key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode(mode === m.key ? null : m.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              mode === m.key
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={mode === m.key ? { backgroundColor: m.headColor } : undefined}
          >
            {m.label}
          </motion.button>
        ))}
        {mode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode(null)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
          >
            重置
          </motion.button>
        )}
      </div>

      {/* Visualization */}
      <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Commit chain */}
        <svg className="absolute inset-0 w-full h-full">
          {commits.map((c, i) => {
            if (i === 0) return null;
            return (
              <line
                key={`line-${c.id}`}
                x1={commits[i - 1].x} y1={80}
                x2={c.x} y2={80}
                stroke="#6b7280"
                strokeWidth="3"
              />
            );
          })}
        </svg>

        {/* Commits */}
        {commits.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: i * 0.08 }}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
              mode && i >= 3 ? 'opacity-40' : ''
            }`}
            style={{
              left: c.x - 20,
              top: 60,
              backgroundColor: mode && i >= 3 ? '#9ca3af' : '#3b82f6',
            }}
          >
            {c.label}
          </motion.div>
        ))}

        {/* HEAD pointer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode ? 'reset-head' : 'current-head'}
            initial={{ x: mode ? 410 : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            className="absolute top-[108px] flex flex-col items-center"
            style={{ left: headTargetX - 16 }}
          >
            <span className="text-lg">▼</span>
            <span className="text-xs font-bold text-yellow-500 mt-0.5">HEAD</span>
          </motion.div>
        </AnimatePresence>

        {/* Area labels */}
        <div className="absolute left-2 bottom-3 flex gap-4 text-xs">
          <AnimatePresence mode="wait">
            {mode ? (
              <motion.div
                key="mode-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5"
              >
                {(() => {
                  const m = modes.find(mk => mk.key === mode)!;
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-gray-600 dark:text-gray-300">HEAD 已移到 C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.stagedColor }} />
                        <span className="text-gray-600 dark:text-gray-300">
                          暂存区: {m.stagedColor === '#f59e0b' ? '已重置' : '保留'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.workColor }} />
                        <span className="text-gray-600 dark:text-gray-300">
                          工作区: {m.workColor === '#f59e0b' ? '已重置（修改丢失！）' : '保留'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              <motion.div
                key="default-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-400 dark:text-gray-500 text-xs"
              >
                点击上方按钮选择 reset 模式，观察 HEAD 和各区域的变化
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      <AnimatePresence mode="wait">
        {mode && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">git reset {modes.find(m => m.key === mode)!.label}:</span>{' '}
              {modes.find(m => m.key === mode)!.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
