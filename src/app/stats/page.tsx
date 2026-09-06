'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePracticeProgress } from '@/lib/usePracticeProgress';
import {
  interactivePracticeTasks,
  getRecommendedTask,
  getTopicMastery,
  getWeakestTopic,
} from '@/lib/practice';
import { achievements } from '@/lib/achievements';
import ShareCard from '@/components/ShareCard';

const TOPIC_ORDER = [
  '基础命令',
  '分支协作',
  '远程协作',
  '提交搬运',
  '历史整理',
  '恢复与切换',
  '扩展概念',
] as const;

function getActivityColor(count: number): string {
  if (count === 0) {
    return 'bg-gray-100 dark:bg-gray-800';
  }
  if (count === 1) {
    return 'bg-primary-200 dark:bg-primary-900/60';
  }
  if (count === 2) {
    return 'bg-primary-400 dark:bg-primary-700';
  }
  return 'bg-primary-600 dark:bg-primary-500';
}

export default function StatsPage() {
  const { completedIds, streak, earnedAchievements } = usePracticeProgress();

  // 过去 91 天（13 周）的活动热力图网格
  const heatmap = useMemo(() => {
    const weeks: { date: string; count: number; inFuture: boolean }[][] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    // 对齐到周日开始
    start.setDate(start.getDate() - start.getDay());

    const totalDays = Math.ceil((today.getTime() - start.getTime()) / 86400000) + 1;
    const days: { date: string; count: number; inFuture: boolean }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday =
        key ===
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      days.push({
        date: key,
        count: isToday && completedIds.size > 0 ? 1 : 0,
        inFuture: d > today,
      });
    }

    for (let w = 0; w < days.length; w += 7) {
      weeks.push(days.slice(w, w + 7));
    }

    return weeks;
  }, [completedIds.size]);

  const topicStats = useMemo(
    () =>
      getTopicMastery(completedIds).filter(({ topic }) =>
        (TOPIC_ORDER as readonly string[]).includes(topic)
      ),
    [completedIds]
  );

  const totalInteractive = interactivePracticeTasks.length;
  const totalDone = interactivePracticeTasks.filter((task) =>
    completedIds.has(task.id)
  ).length;
  const percent =
    totalInteractive === 0 ? 0 : Math.round((totalDone / totalInteractive) * 100);

  const nextIncomplete = useMemo(() => getRecommendedTask(completedIds), [completedIds]);

  // 薄弱主题：掌握度最低且未做完的方向
  const weakest = useMemo(() => getWeakestTopic(completedIds), [completedIds]);

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            成长记录
          </span>
          <h1 className="mb-4 mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            学习统计
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            练习进度保存在你的浏览器本地，随做随记。
          </p>
        </div>

        {/* 总览卡片 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-4xl font-bold text-primary-500">{totalDone}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              已完成练习 / 共 {totalInteractive}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-4xl font-bold text-orange-500">{streak}</div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              连续学习天数
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-4xl font-bold text-emerald-500">
              {earnedAchievements.length}
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              已解锁成就 / 共 {achievements.length}
            </div>
          </div>
        </div>

        {/* 总进度条 */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              总进度
            </h2>
            <span className="text-2xl font-bold text-primary-500">{percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          {nextIncomplete && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              下一课：
              <Link
                href={`/practice/${nextIncomplete.id}`}
                className="ml-1 font-medium text-primary-500 hover:text-primary-600"
              >
                {nextIncomplete.title}
              </Link>
              <span className="ml-2 text-gray-400">{nextIncomplete.description}</span>
            </div>
          )}
          {weakest?.nextTask && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
              <span className="font-medium text-amber-800 dark:text-amber-200">
                薄弱方向：
              </span>
              <span className="text-amber-700 dark:text-amber-300">
                「{weakest.topic}」目前完成 {weakest.percent}%，建议从
              </span>
              <Link
                href={`/practice/${weakest.nextTask.id}`}
                className="mx-1 font-medium text-amber-800 underline dark:text-amber-200"
              >
                {weakest.nextTask.title}
              </Link>
              <span className="text-amber-700 dark:text-amber-300">开始补强。</span>
            </div>
          )}
        </div>

        {/* 活动热力图 */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
            学习热力图
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            深色的方块代表当天完成过练习。
          </p>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1">
              {heatmap.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}：${day.count} 次活动`}
                      className={`h-4 w-4 rounded-sm ${day.inFuture ? 'bg-transparent' : getActivityColor(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 主题掌握度 */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            分主题掌握度
          </h2>
          <div className="space-y-4">
            {topicStats.map(({ topic, done, total }) => {
              const topicPercent = Math.round((done / total) * 100);
              return (
                <div key={topic}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {topic}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${topicPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 成就墙 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            成就墙
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {achievements.map((achievement) => {
              const earned = earnedAchievements.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  title={achievement.description}
                  className={`rounded-xl p-3 text-center transition-colors ${
                    earned
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-gray-50 opacity-50 dark:bg-gray-900/40'
                  }`}
                >
                  <div className={`text-2xl ${earned ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className="mt-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {achievement.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 分享成绩卡 */}
        <div className="mt-8">
          <ShareCard />
        </div>
      </div>
    </div>
  );
}
