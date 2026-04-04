import type { Metadata } from 'next';
import SandboxPage from '@/components/SandboxPage';

export const metadata: Metadata = {
  title: '自由沙盒',
  description: '自由探索 Git 命令，观察提交图变化',
};

export default function Sandbox() {
  return <SandboxPage />;
}
