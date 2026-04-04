import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent mb-4">
              Git Learning Platform
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              一个交互式的Git学习平台，通过动画演示和实战练习帮助用户更直观地理解Git版本控制。
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">快速链接</h4>
            <ul className="space-y-2">
              <li><Link href="/tutorials" className="text-gray-600 dark:text-gray-400 hover:text-primary-500">教程</Link></li>
              <li><Link href="/practice" className="text-gray-600 dark:text-gray-400 hover:text-primary-500">实战练习</Link></li>
              <li><Link href="/animations" className="text-gray-600 dark:text-gray-400 hover:text-primary-500">动画演示</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">社区</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-primary-500">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Git Learning Platform. MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
