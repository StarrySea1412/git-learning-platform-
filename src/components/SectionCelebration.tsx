'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { playFanfareSound } from '@/lib/sound';

interface SectionCelebrationProps {
  /** 章节标题，如"分支协作" */
  sectionTitle: string;
  /** 本章节完成的练习数 */
  doneCount: number;
  /** 全局已完成练习数 */
  totalCompleted: number;
  /** 全局总练习数 */
  totalAll: number;
  /** 连续学习天数 */
  streak: number;
  /** 下一个章节（可能为 null） */
  nextSection: { id: string; title: string; description: string } | null;
  onClose: () => void;
}

const EMOJIS = ['🎉', '✨', '🌿', '🔀', '🚀', '⭐', '🏆', '💫'];

/** 伪随机纸屑位置（固定种子，避免 SSR 抖动） */
function generateConfetti(count: number) {
  const pieces: { left: number; delay: number; duration: number; emoji: string; size: number }[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    pieces.push({
      left: rand() * 100,
      delay: rand() * 0.8,
      duration: 2.5 + rand() * 2,
      emoji: EMOJIS[Math.floor(rand() * EMOJIS.length)],
      size: 16 + rand() * 16,
    });
  }
  return pieces;
}

export default function SectionCelebration({
  sectionTitle,
  doneCount,
  totalCompleted,
  totalAll,
  streak,
  nextSection,
  onClose,
}: SectionCelebrationProps) {
  const confetti = useMemo(() => generateConfetti(28), []);

  useEffect(() => {
    playFanfareSound();
  }, []);

  const percent = totalAll === 0 ? 0 : Math.round((totalCompleted / totalAll) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* 纸屑层 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((piece, i) => (
            <motion.span
              key={i}
              initial={{ y: '-10vh', opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', opacity: [1, 1, 0.6], rotate: 360 }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: 'linear' }}
              className="absolute"
              style={{ left: `${piece.left}%`, fontSize: piece.size }}
            >
              {piece.emoji}
            </motion.span>
          ))}
        </div>

        {/* 主卡片 */}
        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-800"
          onClick={(event) => event.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 260 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-4xl shadow-lg"
          >
            🏆
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            章节通关！
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            「<span className="font-semibold text-primary-600 dark:text-primary-400">{sectionTitle}</span>」
            的全部 {doneCount} 个练习你都拿下了。
          </p>

          {/* 成绩速览 */}
          <div className="my-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-primary-50 p-3 dark:bg-primary-900/20">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{percent}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">总进度</div>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-500">{streak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">连续天数</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalCompleted}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">已完成练习</div>
            </div>
          </div>

          {nextSection ? (
            <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4 dark:border-primary-900/30 dark:bg-primary-900/10">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary-500">
                下一章节已解锁
              </div>
              <Link
                href={`/practice/${nextSection.id ? `?section=${nextSection.id}` : ''}`}
                onClick={onClose}
                className="mt-1 block text-left"
              >
                <div className="font-semibold text-gray-900 hover:text-primary-600 dark:text-white">
                  {nextSection.title} →
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {nextSection.description}
                </p>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              🎊 你已经完成了全部练习路径，是时候去自由沙盒任意驰骋了！
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Link
              href="/stats"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              查看统计
            </Link>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              {nextSection ? '继续冒险' : '太棒了'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
