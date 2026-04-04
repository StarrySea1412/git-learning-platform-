'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Achievement } from '@/lib/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementToast({
  achievement,
  onDismiss,
}: AchievementToastProps) {
  useEffect(() => {
    if (!achievement) {
      return;
    }

    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-yellow-200 dark:border-yellow-700 p-4 flex items-center gap-4 min-w-[300px]"
          onClick={onDismiss}
        >
          <span className="text-4xl">{achievement.icon}</span>
          <div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold uppercase tracking-wide">
              新成就
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {achievement.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {achievement.description}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
