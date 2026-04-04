'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { advancedLabSections } from '@/lib/practice';
import { usePracticeProgressStore } from '@/lib/usePracticeProgress';

interface HomeStat {
  label: string;
  value: number;
}

interface HomeContentProps {
  stats: HomeStat[];
}

const features = [
  {
    title: '系统教程',
    description: '从 Git 基础到高级技巧，配合示例和代码块循序渐进地学习。',
    href: '/tutorials',
  },
  {
    title: '可交互练习',
    description: '在模拟终端中练习真实支持的 Git 命令，把功能开发、热修发版、误操作自救等场景真正走一遍。',
    href: '/practice',
  },
  {
    title: '动画演示',
    description: '先用可视化动画看懂分支、合并、变基、stash 等场景，再顺手跳去对应练习。',
    href: '/animations',
  },
];

export default function HomeContent({ stats }: HomeContentProps) {
  const { completedIds, streak } = usePracticeProgressStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayStats = [
    ...stats,
    ...(mounted && streak > 0 ? [{ label: '天连续学习', value: streak }] : []),
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <svg
          className="absolute inset-0 h-full w-full opacity-5 dark:opacity-[0.03]"
          viewBox="0 0 800 400"
        >
          <line x1="100" y1="80" x2="200" y2="160" stroke="currentColor" strokeWidth="2" />
          <line x1="200" y1="160" x2="300" y2="160" stroke="currentColor" strokeWidth="2" />
          <line x1="300" y1="160" x2="400" y2="160" stroke="currentColor" strokeWidth="2" />
          <line x1="300" y1="160" x2="350" y2="260" stroke="currentColor" strokeWidth="2" />
          <line x1="350" y1="260" x2="450" y2="260" stroke="currentColor" strokeWidth="2" />
          <line x1="400" y1="160" x2="500" y2="200" stroke="currentColor" strokeWidth="2" />
          <line x1="500" y1="200" x2="550" y2="260" stroke="currentColor" strokeWidth="2" />
          <line x1="450" y1="260" x2="550" y2="260" stroke="currentColor" strokeWidth="2" />
          <line x1="550" y1="260" x2="650" y2="260" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="80" r="16" fill="currentColor" />
          <circle cx="200" cy="160" r="16" fill="currentColor" />
          <circle cx="300" cy="160" r="16" fill="currentColor" />
          <circle cx="400" cy="160" r="16" fill="currentColor" />
          <circle cx="350" cy="260" r="16" fill="currentColor" />
          <circle cx="450" cy="260" r="16" fill="currentColor" />
          <circle cx="500" cy="200" r="16" fill="currentColor" />
          <circle cx="550" cy="260" r="16" fill="currentColor" />
          <circle cx="650" cy="260" r="16" fill="currentColor" />
          <text x="555" y="248" fill="currentColor" fontFamily="monospace" fontSize="12">
            main
          </text>
          <text x="455" y="248" fill="currentColor" fontFamily="monospace" fontSize="12">
            feature
          </text>
        </svg>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-5xl font-bold text-gray-900 dark:text-white sm:text-6xl"
          >
            交互式学习{' '}
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              Git
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-400"
          >
            通过教程、交互式练习、提交图和动画演示，把 Git 从“会背命令”学成“能理解状态变化”。
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/practice/git-init"
              className="rounded-lg bg-primary-500 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-primary-600"
            >
              从第一题开始
            </Link>
            <Link
              href="/practice#lab-transfer"
              className="rounded-lg bg-gray-100 px-8 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              进入高级实验室
            </Link>
            <Link
              href="/sandbox"
              className="rounded-lg bg-gray-100 px-8 py-3 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              进入自由沙盒
            </Link>
          </motion.div>

          {mounted && completedIds.size > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-6 text-sm text-gray-500 dark:text-gray-400"
            >
              你已经完成了 {completedIds.size} 道可交互练习，继续保持节奏。
            </motion.p>
          )}
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-12">
          {displayStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary-500">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((card, index) => (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
              >
                <Link
                  href={card.href}
                  className="block rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">
                Advanced Lab
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                高级实验室
              </h2>
              <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">
                围绕发版热修、历史整理、误操作自救和临时切任务三条高频实战线，把高级 Git 技能练成可重复操作。
              </p>
            </div>
            <Link
              href="/practice"
              className="text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              查看全部练习 →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {advancedLabSections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.45 + index * 0.08 }}
              >
                <Link
                  href={`/practice#${section.id}`}
                  className="block rounded-2xl border border-primary-100 bg-gradient-to-br from-white via-primary-50/30 to-primary-100/60 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-primary-900/40 dark:from-gray-900 dark:via-gray-900 dark:to-primary-950/40"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                      {section.taskIds.length} 道专题题
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Lab {index + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {section.title.replace('高级实验室 · ', '')}
                  </h3>
                  <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {section.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
