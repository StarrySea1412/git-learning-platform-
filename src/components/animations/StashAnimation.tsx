'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'working' | 'stashed' | 'switched' | 'done-new' | 'popped';

export default function StashAnimation() {
  const [step, setStep] = useState<Step>('working');
  const [stashCount, setStashCount] = useState(0);

  const files = [
    { name: 'app.ts', status: 'modified', color: '#f59e0b' },
    { name: 'utils.ts', status: 'modified', color: '#f59e0b' },
    { name: 'new.ts', status: 'untracked', color: '#ef4444' },
  ];

  const handleStash = () => {
    setStashCount(1);
    setStep('stashed');
  };

  const handleSwitchBranch = () => setStep('switched');
  const handleNewCommit = () => setStep('done-new');
  const handlePop = () => {
    setStashCount(0);
    setStep('popped');
  };

  const handleReset = () => {
    setStep('working');
    setStashCount(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        正在做功能，被紧急插队——先把现场收好
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        场景：你正在 feature-login 上开发，线上突然报警，需要立刻切到 main 处理——但工作区还有未提交的改动。
      </p>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {['working', 'stashed', 'switched', 'done-new', 'popped'].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-primary-500 text-white' :
              ['working','stashed','switched','done-new','popped'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {['working','stashed','switched','done-new','popped'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            {i < 4 && <div className={`flex-1 h-0.5 ${
              ['working','stashed','switched','done-new','popped'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace */}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            工作区 ({step === 'switched' || step === 'done-new' ? 'hotfix 分支' : 'feature 分支'})
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[180px]">
            <AnimatePresence mode="wait">
              {(step === 'working' || step === 'popped') && (
                <motion.div
                  key="working-files"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {files.map((f) => (
                    <div key={f.name} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                      <span className="text-gray-700 dark:text-gray-300 font-mono">{f.name}</span>
                      <span className="text-xs text-gray-400">({f.status})</span>
                    </div>
                  ))}
                  <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    {step === 'popped' ? '修改已恢复！' : '有未提交的修改'}
                  </div>
                </motion.div>
              )}
              {(step === 'stashed') && (
                <motion.div
                  key="clean"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center h-full text-center py-6"
                >
                  <span className="text-3xl mb-2">✨</span>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">工作区已清理干净</p>
                  <p className="text-xs text-gray-400 mt-1">修改已保存到 stash</p>
                </motion.div>
              )}
              {(step === 'switched') && (
                <motion.div
                  key="hotfix"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="text-xs text-gray-400 mb-2">紧急 Bug 修复中...</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-700 dark:text-gray-300 font-mono">fix-login.ts</span>
                    <span className="text-xs text-gray-400">(new file)</span>
                  </div>
                </motion.div>
              )}
              {step === 'done-new' && (
                <motion.div
                  key="committed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-6"
                >
                  <span className="text-3xl mb-2">✅</span>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">紧急修复已提交！</p>
                  <p className="text-xs text-gray-400 mt-1">可以切回 feature 分支恢复工作了</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stash */}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Stash 栈
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[180px]">
            <AnimatePresence mode="wait">
              {stashCount > 0 ? (
                <motion.div
                  key="has-stash"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <span className="text-yellow-500 font-bold text-sm">stash@{0}</span>
                    <span className="text-xs text-gray-500">WIP on feature</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    {files.map(f => (
                      <div key={f.name} className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        - {f.name}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-stash"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-6"
                >
                  <span className="text-2xl mb-2 text-gray-300 dark:text-gray-600">📦</span>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Stash 栈为空</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mt-6">
        {step === 'working' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStash}
            className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
          >
            git stash
          </motion.button>
        )}
        {step === 'stashed' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchBranch}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            切换到 hotfix 分支
          </motion.button>
        )}
        {step === 'switched' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewCommit}
            className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            提交修复
          </motion.button>
        )}
        {step === 'done-new' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePop}
            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            git stash pop (恢复工作)
          </motion.button>
        )}
        {step === 'popped' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
          >
            重置
          </motion.button>
        )}
      </div>
    </div>
  );
}
