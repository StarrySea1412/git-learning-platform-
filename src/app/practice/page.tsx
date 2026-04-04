import type { Metadata } from 'next';
import PracticeList from '@/components/PracticeList';

export const metadata: Metadata = {
  title: '实战练习',
  description: '在模拟终端中练习 Git 命令，巩固所学知识',
};

export default function PracticePage() {
  return <PracticeList />;
}
