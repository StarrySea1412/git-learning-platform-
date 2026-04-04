'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  advancedLabSections,
  getPracticeTasksByIds,
  interactivePracticeTasks,
  isInteractiveTask,
  practiceSections,
  type PracticeDifficulty,
} from '@/lib/practice';
import { usePracticeProgress } from '@/lib/usePracticeProgress';

const difficultyColors: Record<PracticeDifficulty, string> = {
  入门: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  进阶: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  高级: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

type DifficultyFilter = '全部' | PracticeDifficulty;

const filters: DifficultyFilter[] = ['全部', '入门', '进阶', '高级'];

export default function PracticeList() {
  const [filter, setFilter] = useState<DifficultyFilter>('全部');
  const { isCompleted, completedIds } = usePracticeProgress();

  const visibleSections = useMemo(
    () =>
      practiceSections
        .map((section) => ({
          ...section,
          tasks: getPracticeTasksByIds(section.taskIds).filter((task) =>
            filter === '全部' ? true : task.difficulty === filter
          ),
        }))
        .filter((section) => section.tasks.length > 0),
    [filter]
  );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            实战练习
          </h1>
          <p className="mx-auto mb-3 max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            从基础命令到高级实验室，所有练习都围绕真实的仓库状态变化和常见协作场景来设计。
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            已完成 {completedIds.size} / {interactivePracticeTasks.length} 道可交互练习
          </p>
          <div className="h-2 max-w-xs mx-auto mt-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-primary-500 transition-all"
              style={{ width: `${Math.round((completedIds.size / interactivePracticeTasks.length) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === item
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Link
            href="/sandbox"
            className="block rounded-2xl border border-primary-400 bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 text-3xl">🧪</div>
            <h2 className="mb-2 text-2xl font-semibold">自由沙盒</h2>
            <p className="text-sm leading-6 text-primary-100">
              这里预置了一份示例仓库，适合自由试验命令、观察提交图变化，或者把概念题拿来自己实操。
            </p>
          </Link>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-500">
              Advanced Lab
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              三条高级实战专题线
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {advancedLabSections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300"
                >
                  {section.title.replace('高级实验室 · ', '')}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {visibleSections.map((section) => (
            <section key={section.id} id={section.id}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                    {section.description}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    section.kind === 'lab'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : section.kind === 'concept'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {section.kind === 'lab'
                    ? '高级实验室'
                    : section.kind === 'concept'
                    ? '概念延伸'
                    : '核心路径'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {section.tasks.map((task) => {
                  const interactive = isInteractiveTask(task);
                  const completed = interactive ? isCompleted(task.id) : false;

                  return (
                    <Link
                      key={task.id}
                      href={`/practice/${task.id}`}
                      className="relative block rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    >
                      {completed && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${difficultyColors[task.difficulty]}`}
                        >
                          {task.difficulty}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            interactive
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                        >
                          {interactive ? '可交互' : '概念'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {task.estimatedMinutes} 分钟
                        </span>
                      </div>

                      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <p className="mb-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                        {task.description}
                      </p>

                      {task.prerequisiteIds.length > 0 && (
                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          前置练习 {task.prerequisiteIds.length} 项
                        </p>
                      )}

                      {!interactive && (
                        <p className="text-sm text-amber-600 dark:text-amber-300">
                          本题暂不计入完成进度，也不提供图形模拟。
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {visibleSections.length === 0 && (
          <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
            当前筛选条件下还没有对应练习。
          </p>
        )}
      </div>
    </div>
  );
}
