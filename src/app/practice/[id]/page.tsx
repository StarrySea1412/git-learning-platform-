import type { Metadata } from 'next';
import PracticeTaskPage from '@/components/PracticeTaskPage';
import { getPracticeTaskById, practiceTasks } from '@/lib/practice';

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return practiceTasks.map((task) => ({
    id: task.id,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const task = getPracticeTaskById(params.id);
  if (!task) {
    return { title: '任务未找到' };
  }

  return {
    title: task.title,
    description: task.description,
  };
}

export default function PracticePage({ params }: PageProps) {
  return <PracticeTaskPage id={params.id} />;
}
