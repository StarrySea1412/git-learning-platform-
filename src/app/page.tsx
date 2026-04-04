import type { Metadata } from 'next';
import HomeContent from '@/components/HomeContent';
import { animationCount } from '@/lib/animations';
import { interactivePracticeTasks } from '@/lib/practice';
import { tutorials } from '@/lib/tutorials';

export const metadata: Metadata = {
  title: '首页',
  description:
    '一个交互式的 Git 学习平台，通过动画演示和实战练习帮助你掌握 Git 版本控制',
};

const homeStats = [
  { label: '篇教程', value: tutorials.length },
  { label: '道可交互练习', value: interactivePracticeTasks.length },
  { label: '个动画', value: animationCount },
];

export default function Home() {
  return <HomeContent stats={homeStats} />;
}
