import Link from 'next/link';
import { notFound } from 'next/navigation';
import CodeBlock from '@/components/CodeBlock';
import { getPracticeTasksByIds } from '@/lib/practice';
import { renderHighlightedCode } from '@/lib/highlight';
import { getTutorialById, tutorials } from '@/lib/tutorials';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return tutorials.map((tutorial) => ({
    id: tutorial.id,
  }));
}

export function generateMetadata({ params }: PageProps) {
  const tutorial = getTutorialById(params.id);
  if (!tutorial) {
    return { title: '教程未找到' };
  }

  return {
    title: tutorial.title,
    description: tutorial.description,
  };
}

export default async function TutorialPage({ params }: PageProps) {
  const tutorial = getTutorialById(params.id);

  if (!tutorial) {
    notFound();
  }

  const relatedTasks = getPracticeTasksByIds(tutorial.relatedPracticeIds);
  const renderedSections = await Promise.all(
    tutorial.content.map(async (section) => ({
      ...section,
      highlightedHtml: section.codeExample
        ? await renderHighlightedCode(section.codeExample)
        : null,
    }))
  );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/tutorials"
          className="mb-6 inline-flex items-center text-primary-500 hover:text-primary-600"
        >
          <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          返回教程列表
        </Link>

        <header className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            {tutorial.title}
          </h1>
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
            {tutorial.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>难度：{tutorial.difficulty}</span>
            <span>预计时间：{tutorial.duration}</span>
            <span>关联练习：{relatedTasks.length} 道</span>
          </div>
        </header>

        {relatedTasks.length > 0 && (
          <section className="mb-10 rounded-xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900/30 dark:bg-primary-900/10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  学完马上练
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  这些练习会把本教程里的关键命令转成可操作的仓库状态变化。
                </p>
              </div>
              <Link
                href="/practice"
                className="text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                查看练习库 →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relatedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/practice/${task.id}`}
                  className="rounded-lg border border-white/70 bg-white px-4 py-3 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {task.description}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {renderedSections.map((section, index) => (
            <section key={index} className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h2>
              <div className="mb-4 whitespace-pre-line text-gray-700 dark:text-gray-300">
                {section.content}
              </div>
              {section.codeExample && (
                <CodeBlock
                  code={section.codeExample}
                  highlightedHtml={section.highlightedHtml ?? undefined}
                />
              )}
              {section.tips && section.tips.length > 0 && (
                <div className="my-4 rounded-r-lg border-l-4 border-primary-500 bg-primary-50 p-4 dark:bg-primary-900/20">
                  <h3 className="mb-2 font-semibold text-primary-700 dark:text-primary-400">
                    提示
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-primary-600 dark:text-primary-300">
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/tutorials" className="text-primary-500 hover:text-primary-600">
              ← 返回教程列表
            </Link>
            {relatedTasks[0] && (
              <Link
                href={`/practice/${relatedTasks[0].id}`}
                className="rounded-lg bg-primary-500 px-4 py-2 text-white transition-colors hover:bg-primary-600"
              >
                先做这题：{relatedTasks[0].title}
              </Link>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
