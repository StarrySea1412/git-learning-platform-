'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-gray-950">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            系统异常
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            应用程序遇到了严重错误，请稍后重试
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              重试
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
