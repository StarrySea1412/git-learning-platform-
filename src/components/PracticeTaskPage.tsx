'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import AchievementToast from '@/components/AchievementToast';
import CodeBlock from '@/components/CodeBlock';
import GitGraph from '@/components/GitGraph';
import Terminal from '@/components/Terminal';
import {
  evaluateInteractivePracticeCommand,
  getNextPracticeTask,
  getPrevPracticeTask,
  getPracticeTaskById,
  getPracticeTaskHints,
  getPracticeTaskInstructions,
  getPracticeTasksByIds,
  getReferenceCommands,
  isInteractiveTask,
} from '@/lib/practice';
import {
  createInitialState,
  executeCommand,
  teammatePush,
  type GitState,
} from '@/lib/git-simulator';
import { getTutorialsForPracticeTask } from '@/lib/tutorials';
import { usePracticeProgress } from '@/lib/usePracticeProgress';

interface PracticeTaskPageProps {
  id: string;
}

export default function PracticeTaskPage({ id }: PracticeTaskPageProps) {
  const task = getPracticeTaskById(id);
  const { markCompleted, newAchievement, dismissAchievement, isCompleted } =
    usePracticeProgress();
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  /** 最近一次答错时的教学卡片内容（答对后清除） */
  const [lastTeaching, setLastTeaching] = useState<string | null>(null);
  const [gitState, setGitState] = useState<GitState>(() =>
    task && isInteractiveTask(task) ? task.createInitialState() : createInitialState()
  );

  const nextTask = task ? getNextPracticeTask(task) : null;
  const prevTask = task ? getPrevPracticeTask(task) : null;
  const prerequisites = useMemo(
    () => (task ? getPracticeTasksByIds(task.prerequisiteIds) : []),
    [task]
  );
  const relatedTutorials = useMemo(
    () => (task ? getTutorialsForPracticeTask(task.id) : []),
    [task]
  );
  const taskHints = useMemo(() => (task ? getPracticeTaskHints(task) : []), [task]);
  const referenceCommands = useMemo(
    () => (task ? getReferenceCommands(task) : []),
    [task]
  );
  const instructions = useMemo(
    () => (task ? getPracticeTaskInstructions(task) : []),
    [task]
  );

  useEffect(() => {
    if (!task || !isInteractiveTask(task)) {
      return;
    }

    setCompleted(false);
    setCurrentStep(0);
    setShowHints(false);
    setShowAnswers(false);
    setLastTeaching(null);
    setGitState(task.createInitialState());
    setResetKey((value) => value + 1);
  }, [id, task]);

  const handleCommand = useCallback(
    (command: string) => {
      if (!task || !isInteractiveTask(task)) {
        return {
          success: false,
          output: '当前任务不支持交互式命令练习。',
        };
      }

      if (command.trim() === 'help') {
        const currentHint = task.steps[currentStep]?.hint ?? '当前任务没有更多提示。';
        const currentCommand = task.steps[currentStep]?.acceptedCommands[0];
        return {
          success: true,
          output: [
            `当前步骤提示：${currentHint}`,
            currentCommand ? `参考命令：${currentCommand}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        };
      }

      const previousState = gitState;
      const result = executeCommand(previousState, command);
      let nextState = result.state;

      const evaluation = evaluateInteractivePracticeCommand(
        task,
        currentStep,
        command,
        previousState,
        result
      );

      // 虚拟队友：该步完成后，队友"突然"向 origin/main 推送新提交
      if (evaluation.teammatePushMessage) {
        const push = teammatePush(nextState, evaluation.teammatePushMessage);
        if (push.ok) {
          nextState = push.state;
        }
      }

      setGitState(nextState);

      if (evaluation.advanced) {
        setCurrentStep(evaluation.nextStepIndex);
        setLastTeaching(null);
      } else if (evaluation.teaching) {
        setLastTeaching(evaluation.teaching);
      }

      if (evaluation.completed) {
        setCompleted(true);
        markCompleted(task.id);
      }

      return {
        success: evaluation.advanced || evaluation.completed,
        output: evaluation.feedback,
      };
    },
    [currentStep, gitState, markCompleted, task]
  );

  const handleRetry = useCallback(() => {
    if (!task || !isInteractiveTask(task)) {
      return;
    }

    setCompleted(false);
    setCurrentStep(0);
    setShowHints(false);
    setShowAnswers(false);
    setLastTeaching(null);
    setGitState(task.createInitialState());
    setResetKey((value) => value + 1);
  }, [task]);

  if (!task) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">任务未找到</h1>
          <Link
            href="/practice"
            className="mt-4 inline-block text-primary-500 hover:text-primary-600"
          >
            返回练习列表
          </Link>
        </div>
      </div>
    );
  }

  const interactive = isInteractiveTask(task);
  const globallyCompleted = interactive ? isCompleted(task.id) : false;

  return (
    <>
      <AchievementToast achievement={newAchievement} onDismiss={dismissAchievement} />
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/practice"
              className="inline-flex items-center text-primary-500 hover:text-primary-600"
            >
              <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回练习列表
            </Link>

            <div className="flex items-center gap-3 text-sm">
              {prevTask && (
                <Link
                  href={`/practice/${prevTask.id}`}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  title={`上一题：${prevTask.title}`}
                >
                  ← 上一题
                </Link>
              )}
              {nextTask && (
                <Link
                  href={`/practice/${nextTask.id}`}
                  className="rounded-lg bg-primary-100 px-3 py-1.5 text-primary-700 transition-colors hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60"
                  title={`下一题：${nextTask.title}`}
                >
                  下一题 →
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          interactive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {interactive ? '可交互练习' : '概念练习'}
                      </span>
                      <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {task.topic}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {task.estimatedMinutes} 分钟
                      </span>
                      {globallyCompleted && (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          已完成
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {task.title}
                    </h1>
                  </div>
                </div>

                <p className="mb-6 text-gray-600 dark:text-gray-400">{task.description}</p>

                {interactive && (
                  <div className="mb-6">
                    <div className="mb-1 flex items-baseline justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        进度：步骤 {Math.min(currentStep + 1, task.steps.length)} / {task.steps.length}
                      </span>
                      <span>{Math.round((currentStep / task.steps.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${(currentStep / task.steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {interactive && task.contextNote && (
                  <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                    <div className="mb-1 font-semibold">当前仓库背景</div>
                    <div>{task.contextNote}</div>
                  </div>
                )}

                {!interactive && (
                  <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <div className="mb-1 font-semibold">说明</div>
                    <div>{task.conceptNote}</div>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
                    {interactive ? '任务步骤' : '学习要点'}
                  </h2>
                  <ul className="space-y-2">
                    {instructions.map((instruction, index) => (
                      <li
                        key={instruction}
                        className={`flex items-start gap-2 ${
                          interactive
                            ? index < currentStep
                              ? 'text-green-600 dark:text-green-400'
                              : index === currentStep
                              ? 'font-medium text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs">
                          {interactive ? (index < currentStep ? '✓' : index + 1) : '•'}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>

                  {interactive && lastTeaching && !completed && (
                    <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-800 dark:bg-sky-900/20">
                      <div className="mb-1 font-semibold text-sky-800 dark:text-sky-200">
                        💡 为什么这一步容易错
                      </div>
                      <div className="leading-6 text-sky-800 dark:text-sky-200">
                        {lastTeaching}
                      </div>
                    </div>
                  )}
                </div>

                {prerequisites.length > 0 && (
                  <div className="mb-6">
                    <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
                      前置练习
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {prerequisites.map((prerequisite) => (
                        <Link
                          key={prerequisite.id}
                          href={`/practice/${prerequisite.id}`}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          {prerequisite.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {relatedTutorials.length > 0 && (
                  <div className="mb-6">
                    <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">
                      相关教程
                    </h2>
                    <div className="space-y-2">
                      {relatedTutorials.map((tutorial) => (
                        <Link
                          key={tutorial.id}
                          href={`/tutorials/${tutorial.id}`}
                          className="block rounded-lg border border-gray-100 px-4 py-3 text-sm transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tutorial.title}
                          </div>
                          <div className="mt-1 text-gray-500 dark:text-gray-400">
                            {tutorial.description}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {nextTask && (
                  <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                    <h2 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      明确下一步
                    </h2>
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      这题之后建议顺着训练链继续做下一题，保持同一条专题线的连贯性。
                    </p>
                    <Link
                      href={`/practice/${nextTask.id}`}
                      className="text-sm font-medium text-primary-500 hover:text-primary-600"
                    >
                      下一题：{nextTask.title}
                    </Link>
                  </div>
                )}

                <button
                  onClick={() => setShowHints((value) => !value)}
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {showHints ? '隐藏提示' : '显示提示'}
                </button>

                <AnimatePresence>
                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20"
                    >
                      <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
                        提示
                      </h3>
                      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                        {taskHints.map((hint) => (
                          <li key={hint}>• {hint}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setShowAnswers((value) => !value)}
                  className="mt-3 w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {showAnswers ? '隐藏参考命令' : '显示参考命令'}
                </button>

                <AnimatePresence>
                  {showAnswers && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20"
                    >
                      <h3 className="mb-2 font-semibold text-blue-800 dark:text-blue-200">
                        参考命令
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                        {referenceCommands.map((item, index) => (
                          <li key={item}>
                            <span className="text-blue-500 dark:text-blue-400">
                              {interactive ? `步骤 ${index + 1}` : `示例 ${index + 1}`}
                            </span>
                            <div className="mt-1">
                              <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono dark:bg-blue-800/50">
                                {item}
                              </code>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {interactive && completed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20"
                  >
                    <h3 className="mb-2 font-semibold text-green-800 dark:text-green-200">
                      任务完成
                    </h3>
                    <p className="mb-4 text-sm text-green-700 dark:text-green-300">
                      {task.successMessage}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleRetry}
                        className="w-full rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        重试本题
                      </button>
                      {nextTask && (
                        <Link
                          href={`/practice/${nextTask.id}`}
                          className="w-full rounded-lg bg-primary-500 px-4 py-2 text-center text-white transition-colors hover:bg-primary-600"
                        >
                          下一题：{nextTask.title}
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}

                {!interactive && (
                  <div className="mt-6 flex flex-col gap-2">
                    <Link
                      href="/sandbox"
                      className="w-full rounded-lg bg-primary-500 px-4 py-2 text-center text-white transition-colors hover:bg-primary-600"
                    >
                      去自由沙盒试一试
                    </Link>
                    {nextTask && (
                      <Link
                        href={`/practice/${nextTask.id}`}
                        className="w-full rounded-lg bg-gray-100 px-4 py-2 text-center text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        下一题：{nextTask.title}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:col-span-2">
              {interactive ? (
                <>
                  <GitGraph state={gitState} />
                  <Terminal
                    onCommand={handleCommand}
                    initialOutput={[
                      task.terminalIntro ?? `任务：${task.title}`,
                      '输入 "help" 获取当前步骤提示。',
                    ].join('\n')}
                    resetKey={resetKey}
                  />
                </>
              ) : (
                <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      为什么这一题暂时不做交互
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">{task.conceptNote}</p>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      命令示例
                    </h3>
                    <CodeBlock code={referenceCommands.join('\n')} />
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      学习提示
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      {task.hints.map((hint) => (
                        <li key={hint}>• {hint}</li>
                      ))}
                    </ul>
                  </div>

                  {nextTask && (
                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900/40">
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                        明确下一步
                      </h3>
                      <Link
                        href={`/practice/${nextTask.id}`}
                        className="text-primary-500 hover:text-primary-600"
                      >
                        去下一题：{nextTask.title}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
