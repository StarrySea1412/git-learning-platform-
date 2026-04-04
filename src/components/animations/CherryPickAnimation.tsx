'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Commit {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

export default function CherryPickAnimation() {
  const [picked, setPicked] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const mainCommits: Commit[] = [
    { id: 'm1', label: 'A', x: 60, y: 80, color: '#3b82f6' },
    { id: 'm2', label: 'B', x: 160, y: 80, color: '#3b82f6' },
    { id: 'm3', label: 'C', x: 260, y: 80, color: '#3b82f6' },
  ];

  const featureCommits: Commit[] = [
    { id: 'm1b', label: 'A', x: 60, y: 180, color: '#6b7280' },
    { id: 'f1', label: 'D', x: 160, y: 180, color: '#10b981' },
    { id: 'f2', label: 'E', x: 260, y: 180, color: '#f59e0b' },
    { id: 'f3', label: 'F', x: 360, y: 180, color: '#10b981' },
  ];

  const handlePick = (id: string) => {
    if (picked === id) return;
    setPicked(id);
    setShowNew(false);
    setTimeout(() => setShowNew(true), 800);
  };

  const handleReset = () => {
    setPicked(null);
    setShowNew(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        发版临近，只搬运那一个热修提交
      </h3>

      <div className="flex gap-4 mb-6">
        {picked ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            重置
          </motion.button>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 self-center">
            场景：main 准备发版，hotfix 分支上有一个修复。点击该提交，观察它被复制到 main 之后如何生成新的提交 ID。
          </p>
        )}
      </div>

      <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full">
          {/* Main branch lines */}
          <line x1="60" y1="80" x2="160" y2="80" stroke="#3b82f6" strokeWidth="3" />
          <line x1="160" y1="80" x2="260" y2="80" stroke="#3b82f6" strokeWidth="3" />

          {/* Feature branch lines */}
          <line x1="60" y1="180" x2="160" y2="180" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />
          <line x1="160" y1="180" x2="260" y2="180" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />
          <line x1="260" y1="180" x2="360" y2="180" stroke="#6b7280" strokeWidth="2" strokeDasharray="4,4" />

          {/* Cherry-pick connection line */}
          <AnimatePresence>
            {picked && showNew && (
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
                x1={featureCommits.find(c => c.id === picked)?.x ?? 0}
                y1={180}
                x2={360}
                y2={80}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
            )}
          </AnimatePresence>
        </svg>

        {/* Branch labels */}
        <div className="absolute left-2 top-14 text-xs font-medium text-blue-500">main</div>
        <div className="absolute left-2 top-[140px] text-xs font-medium text-gray-400">feature</div>

        {/* Main commits */}
        {mainCommits.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: i * 0.1 }}
            className="absolute w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
            style={{ left: c.x - 20, top: c.y - 20, backgroundColor: c.color }}
          >
            {c.label}
          </motion.div>
        ))}

        {/* Feature commits - clickable */}
        {featureCommits.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: i * 0.1 }}
            onClick={() => c.id !== 'm1b' && handlePick(c.id)}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all ${
              c.id === 'm1b' ? '' : 'cursor-pointer hover:ring-2 hover:ring-yellow-400 hover:ring-offset-2'
            } ${picked === c.id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
            style={{
              left: c.x - 20,
              top: c.y - 20,
              backgroundColor: c.color,
              opacity: picked && picked !== c.id ? 0.4 : 1,
            }}
          >
            {c.label}
          </motion.div>
        ))}

        {/* New cherry-picked commit on main */}
        <AnimatePresence>
          {showNew && picked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              className="absolute w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-yellow-400"
              style={{
                left: 360 - 24,
                top: 80 - 24,
                backgroundColor: '#f59e0b',
              }}
            >
              {featureCommits.find(c => c.id === picked)?.label}*
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>cherry-pick 可以从任意分支挑选特定的提交应用到当前分支</p>
        <p>挑选的提交会生成一个新的提交（hash 不同），不影响源分支</p>
      </div>
    </div>
  );
}
