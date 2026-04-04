'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  color: string;
}

export default function CommitAnimation() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleCommit = () => {
    if (!newMessage.trim()) return;

    const newCommit: Commit = {
      id: `c${commits.length + 1}`,
      message: newMessage,
      author: 'User',
      date: new Date().toLocaleString(),
      color: colors[commits.length % colors.length],
    };

    setCommits([...commits, newCommit]);
    setNewMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Git 提交动画演示
      </h3>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入提交信息..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCommit}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            Commit
          </motion.button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        <svg className="absolute inset-0 w-full h-full" style={{ minHeight: '200px' }}>
          {commits.map((commit, index) => {
            if (index === 0) return null;
            const prevCommit = commits[index - 1];
            return (
              <motion.line
                key={`line-${commit.id}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
                x1={80 + (index - 1) * 100}
                y1={100}
                x2={80 + index * 100}
                y2={100}
                stroke="#6b7280"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        <div className="relative flex items-center py-4 overflow-x-auto">
          <AnimatePresence>
            {commits.map((commit, index) => (
              <motion.div
                key={commit.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex-shrink-0 mx-4"
                style={{ marginLeft: index === 0 ? 0 : undefined }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedCommit(commit)}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer"
                  style={{ backgroundColor: commit.color }}
                >
                  {commit.id}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedCommit && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {selectedCommit.message}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  作者: {selectedCommit.author}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  时间: {selectedCommit.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedCommit(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
