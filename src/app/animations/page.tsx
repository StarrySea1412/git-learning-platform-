import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  animationScenes,
  animationSections,
  type AnimationId,
} from '@/lib/animations';
import { getPracticeTasksByIds } from '@/lib/practice';

const animationComponents = {
  commit: dynamic(() => import('@/components/animations/CommitAnimation'), {
    loading: () => <Skeleton />,
  }),
  branch: dynamic(() => import('@/components/animations/BranchAnimation'), {
    loading: () => <Skeleton />,
  }),
  merge: dynamic(() => import('@/components/animations/MergeAnimation'), {
    loading: () => <Skeleton />,
  }),
  rebase: dynamic(() => import('@/components/animations/RebaseAnimation'), {
    loading: () => <Skeleton />,
  }),
  'cherry-pick': dynamic(
    () => import('@/components/animations/CherryPickAnimation'),
    {
      loading: () => <Skeleton />,
    }
  ),
  reset: dynamic(() => import('@/components/animations/ResetAnimation'), {
    loading: () => <Skeleton />,
  }),
  stash: dynamic(() => import('@/components/animations/StashAnimation'), {
    loading: () => <Skeleton />,
  }),
  bisect: dynamic(() => import('@/components/animations/BisectAnimation'), {
    loading: () => <Skeleton />,
  }),
  workflow: dynamic(() => import('@/components/animations/WorkflowAnimation'), {
    loading: () => <Skeleton />,
  }),
  conflict: dynamic(() => import('@/components/animations/ConflictAnimation'), {
    loading: () => <Skeleton />,
  }),
  collaboration: dynamic(
    () => import('@/components/animations/CollaborationAnimation'),
    {
      loading: () => <Skeleton />,
    }
  ),
} as const satisfies Record<AnimationId, ComponentType>;

function Skeleton() {
  return <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />;
}

export const metadata: Metadata = {
  title: '动画演示',
  description: '通过可视化动画直观理解 Git 的提交、分支、合并和变基等操作',
};

export default function AnimationsPage() {
  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            场景化讲解
          </span>
          <h1 className="mb-4 mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            动画演示
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            先用动画看懂 Git 为什么这样运作，再顺着每个场景直接去做对应练习。
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-primary-100 bg-primary-50/70 p-6 dark:border-primary-900/30 dark:bg-primary-900/10">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                怎么看这一页最有效
              </h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                <li>1. 先看场景背景，明确当前动画是在解决什么问题。</li>
                <li>2. 再跟着关键命令和步骤说明，看仓库状态如何变化。</li>
                <li>3. 最后直接跳到对应练习，把概念变成真正会操作的流程。</li>
              </ul>
            </div>
            <div className="rounded-xl bg-white/80 p-5 shadow-sm dark:bg-gray-900/40">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
                推荐路径
              </div>
              <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>基础起步：提交 → 分支 → 合并</p>
                <p>进阶整理：rebase → reset → reflog</p>
                <p>工作流串联：workflow → 对应练习专题</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {animationSections.map((section) => (
            <section key={section.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                  {section.description}
                </p>
              </div>
              <div className="space-y-8">
                {section.animationIds.map((animationId) => {
                  const Animation = animationComponents[animationId];
                  const scene = animationScenes[animationId];
                  const relatedTasks = getPracticeTasksByIds(scene.relatedPracticeIds);

                  return (
                    <article
                      key={animationId}
                      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-6 grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
                        <div className="space-y-5">
                          <div>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {scene.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                              {scene.summary}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4 dark:bg-gray-900/50">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              场景背景
                            </div>
                            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                              {scene.scenario}
                            </p>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              关键命令
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {scene.keyCommands.map((command) => (
                                <code
                                  key={command}
                                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                >
                                  {command}
                                </code>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              看动画时重点关注
                            </div>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                              {scene.focusPoints.map((point) => (
                                <li key={point} className="flex gap-2">
                                  <span className="mt-1 text-primary-500">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                            <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                              常见误区
                            </div>
                            <p className="mt-2 text-sm leading-6 text-amber-700 dark:text-amber-300">
                              {scene.pitfall}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <Animation />

                          <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900/30 dark:bg-primary-900/10">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  看完就去练
                                </h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                  把这组动画对应的命令链路放进可交互练习里，才能真正形成操作记忆。
                                </p>
                              </div>
                              <Link
                                href="/practice"
                                className="text-sm font-medium text-primary-500 hover:text-primary-600"
                              >
                                查看练习库 →
                              </Link>
                            </div>

                            {relatedTasks.length > 0 ? (
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {relatedTasks.map((task) => (
                                  <Link
                                    key={task.id}
                                    href={`/practice/${task.id}`}
                                    className="rounded-xl border border-white/80 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {task.title}
                                    </div>
                                    <div className="mt-1 text-gray-500 dark:text-gray-400">
                                      {task.description}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                这一块暂时还是讲解型内容，后续会继续补充对应练习。
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
