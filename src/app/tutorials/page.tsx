import type { Metadata } from 'next';
import Link from 'next/link';
import { tutorials } from '@/lib/tutorials';

export const metadata: Metadata = {
  title: 'Git 教程',
  description: '从基础到高级，系统学习 Git 版本控制的完整教程',
};

const categoryLabels = {
  basics: '基础入门',
  intermediate: '进阶知识',
  advanced: '高级技巧',
};

const difficultyColors = {
  入门: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  进阶: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  高级: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function TutorialsPage() {
  const categories = ['basics', 'intermediate', 'advanced'] as const;

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            Git 教程
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            先理解原理，再进入对应练习把它做成可复现的操作。
          </p>
        </div>

        {categories.map((category) => {
          const categoryTutorials = tutorials.filter(
            (tutorial) => tutorial.category === category
          );
          if (categoryTutorials.length === 0) {
            return null;
          }

          return (
            <section key={category} className="mb-12">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {categoryLabels[category]}
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {categoryTutorials.length} 篇
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categoryTutorials.map((tutorial) => (
                  <Link
                    key={tutorial.id}
                    href={`/tutorials/${tutorial.id}`}
                    className="block rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${difficultyColors[tutorial.difficulty]}`}
                      >
                        {tutorial.difficulty}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {tutorial.duration}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {tutorial.title}
                    </h3>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                      {tutorial.description}
                    </p>
                    <p className="text-sm text-primary-500">
                      关联练习 {tutorial.relatedPracticeIds.length} 道 →
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
