'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BisectCommit {
  id: number;
  hash: string;
  message: string;
  hasBug: boolean;
}

const allCommits: BisectCommit[] = [
  { id: 0, hash: 'a1b2c3d', message: '初始提交', hasBug: false },
  { id: 1, hash: 'b2c3d4e', message: '添加用户模块', hasBug: false },
  { id: 2, hash: 'c3d4e5f', message: '添加登录功能', hasBug: false },
  { id: 3, hash: 'd4e5f6g', message: '重构数据库层', hasBug: false },
  { id: 4, hash: 'e5f6g7h', message: '修改配置文件', hasBug: true },
  { id: 5, hash: 'f6g7h8i', message: '添加日志功能', hasBug: true },
  { id: 6, hash: 'g7h8i9j', message: '优化查询性能', hasBug: true },
  { id: 7, hash: 'h8i9j0k', message: '添加缓存层', hasBug: true },
  { id: 8, hash: 'i9j0k1l', message: '修复样式问题', hasBug: true },
  { id: 9, hash: 'j0k1l2m', message: '更新依赖版本', hasBug: true },
];

type Phase = 'start' | 'bisecting' | 'found';

export default function BisectAnimation() {
  const [phase, setPhase] = useState<Phase>('start');
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(allCommits.length - 1);
  const [mid, setMid] = useState(Math.floor((allCommits.length - 1) / 2));
  const [markedGood, setMarkedGood] = useState<number[]>([]);
  const [markedBad, setMarkedBad] = useState<number[]>([]);
  const [foundCommit, setFoundCommit] = useState<BisectCommit | null>(null);
  const [stepCount, setStepCount] = useState(0);

  const startBisect = () => {
    setPhase('bisecting');
    setLow(0);
    setHigh(allCommits.length - 1);
    setMid(Math.floor((allCommits.length - 1) / 2));
    setMarkedGood([]);
    setMarkedBad([]);
    setFoundCommit(null);
    setStepCount(0);
  };

  const markGood = useCallback(() => {
    const newGood = [...markedGood, mid];
    setMarkedGood(newGood);
    setStepCount(s => s + 1);
    const newLow = mid + 1;
    if (newLow >= high) {
      const bad = allCommits[high];
      setFoundCommit(bad);
      setPhase('found');
    } else {
      setLow(newLow);
      setMid(Math.floor((newLow + high) / 2));
    }
  }, [mid, high, markedGood]);

  const markBad = useCallback(() => {
    const newBad = [...markedBad, mid];
    setMarkedBad(newBad);
    setStepCount(s => s + 1);
    const newHigh = mid;
    if (low >= newHigh) {
      const bad = allCommits[newHigh];
      setFoundCommit(bad);
      setPhase('found');
    } else {
      setHigh(newHigh);
      setMid(Math.floor((low + newHigh) / 2));
    }
  }, [mid, low, markedBad]);

  const reset = () => {
    setPhase('start');
    setLow(0);
    setHigh(allCommits.length - 1);
    setMid(Math.floor((allCommits.length - 1) / 2));
    setMarkedGood([]);
    setMarkedBad([]);
    setFoundCommit(null);
    setStepCount(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Git Bisect 二分查找
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        模拟：通过二分法快速定位引入 Bug 的提交（共 {allCommits.length} 个提交，最多 {Math.ceil(Math.log2(allCommits.length))} 步找到）
      </p>

      {/* Commit timeline */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {allCommits.map((c, i) => {
            const isGood = markedGood.includes(i);
            const isBad = markedBad.includes(i);
            const isCurrent = phase === 'bisecting' && i === mid;
            const isRange = phase === 'bisecting' && i >= low && i <= high;

            return (
              <motion.div
                key={c.id}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  opacity: phase === 'bisecting' && !isRange ? 0.3 : 1,
                }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md transition-all border-2 ${
                    isCurrent ? 'ring-4 ring-yellow-300 ring-offset-2 dark:ring-offset-gray-800' : ''
                  } ${isGood ? 'border-green-400' : isBad ? 'border-red-400' : 'border-transparent'}`}
                  style={{
                    backgroundColor: isCurrent ? '#eab308' :
                      c.hasBug ? (isBad ? '#ef4444' : '#6b7280') :
                      (isGood ? '#10b981' : '#3b82f6'),
                  }}
                >
                  {isGood ? '✓' : isBad ? '✗' : i}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 font-mono">{c.hash.slice(0, 5)}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-[60px] truncate text-center">
                  {c.message}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Range indicator */}
        {phase === 'bisecting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-center text-sm text-yellow-600 dark:text-yellow-400"
          >
            搜索范围: [{low}..{high}]，当前检查: {mid}
          </motion.div>
        )}
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
              假设你只知道 <span className="text-green-500 font-medium">初始提交是好的</span>，<span className="text-red-500 font-medium">最新提交有 Bug</span>
            </p>
          </motion.div>
        )}
        {phase === 'bisecting' && (
          <motion.div
            key="bisecting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    检查提交: <span className="font-mono text-yellow-600 dark:text-yellow-400">{allCommits[mid].hash}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{allCommits[mid].message}</p>
                </div>
                <div className="text-xs text-gray-400">
                  已用 {stepCount} / {Math.ceil(Math.log2(allCommits.length))} 步
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">测试这个版本，它有 Bug 吗？</p>
          </motion.div>
        )}
        {phase === 'found' && foundCommit && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 text-center"
          >
            <p className="text-red-700 dark:text-red-300 font-medium">
              Bug 定位！共用了 {stepCount} 步
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">
              {foundCommit.hash} - {foundCommit.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex flex-wrap gap-3 mt-4">
        {phase === 'start' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startBisect}
            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            git bisect start
          </motion.button>
        )}
        {phase === 'bisecting' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markGood}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              Good (无 Bug)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={markBad}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              Bad (有 Bug)
            </motion.button>
          </>
        )}
        {phase === 'found' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            重置
          </motion.button>
        )}
      </div>
    </div>
  );
}
