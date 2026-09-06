'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePracticeProgress } from '@/lib/usePracticeProgress';
import { interactivePracticeTasks, getTopicMastery } from '@/lib/practice';
import { achievements } from '@/lib/achievements';

/**
 * 分享成绩卡：把学习进度渲染成一张可下载的图片海报。
 * 用 SVG foreignObject 生成，避免 Canvas 字体加载的复杂性。
 */
export default function ShareCard() {
  const { completedIds, streak, earnedAchievements } = usePracticeProgress();
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  const totalDone = interactivePracticeTasks.filter((task) =>
    completedIds.has(task.id)
  ).length;
  const totalAll = interactivePracticeTasks.length;
  const percent = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const topicRows = getTopicMastery(completedIds).slice(0, 6);

  const handleDownload = async () => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    // 序列化 SVG 并转成 PNG 下载
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, 1080, 1080);
        ctx.drawImage(image, 0, 0, 1080, 1080);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.download = `git-learning-progress-${Date.now()}.png`;
          link.href = pngUrl;
          link.click();
          URL.revokeObjectURL(pngUrl);
          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2500);
        });
      }
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const barWidth = 620;
  const rowY = (index: number) => 620 + index * 52;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分享成绩卡</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            把你的学习进度生成一张海报，保存后发给朋友或晒到社交媒体。
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleDownload}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          {downloaded ? '✓ 已保存' : '下载海报'}
        </motion.button>
      </div>

      {/* 海报预览（SVG 绘制，下载时序列化） */}
      <div className="overflow-hidden rounded-xl">
        <svg
          ref={svgRef}
          viewBox="0 0 1080 1080"
          className="w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1080" height="1080" fill="#111827" />
          <rect x="40" y="40" width="1000" height="1000" rx="32" fill="#1f2937" />

          {/* 标题区 */}
          <text x="80" y="150" fill="#f59e0b" fontSize="28" fontWeight="600" fontFamily="sans-serif">
            GIT 学习挑战
          </text>
          <text x="80" y="230" fill="#ffffff" fontSize="56" fontWeight="700" fontFamily="sans-serif">
            我的 Git 学习成绩单
          </text>

          {/* 核心数字 */}
          <g fontFamily="sans-serif">
            <text x="80" y="370" fill="#3b82f6" fontSize="96" fontWeight="800">
              {percent}%
            </text>
            <text x="80" y="410" fill="#9ca3af" fontSize="24">
              总进度（{totalDone}/{totalAll} 个练习）
            </text>

            <text x="560" y="370" fill="#f97316" fontSize="96" fontWeight="800">
              {streak}
            </text>
            <text x="560" y="410" fill="#9ca3af" fontSize="24">
              连续学习天数
            </text>

            <text x="800" y="370" fill="#10b981" fontSize="96" fontWeight="800">
              {earnedAchievements.length}
            </text>
            <text x="800" y="410" fill="#9ca3af" fontSize="24">
              成就解锁（{achievements.length}）
            </text>
          </g>

          {/* 分隔线 */}
          <line x1="80" y1="460" x2="1000" y2="460" stroke="#374151" strokeWidth="2" />
          <text x="80" y="520" fill="#e5e7eb" fontSize="30" fontWeight="600" fontFamily="sans-serif">
            分主题掌握度
          </text>

          {/* 主题条 */}
          {topicRows.map((row, index) => {
            const y = rowY(index);
            const width = (barWidth * row.percent) / 100;
            return (
              <g key={row.topic} fontFamily="sans-serif">
                <text x="80" y={y - 10} fill="#d1d5db" fontSize="24">
                  {row.topic}
                </text>
                <text x="1000" y={y - 10} fill="#9ca3af" fontSize="22" textAnchor="end">
                  {row.percent}%
                </text>
                <rect x="80" y={y + 4} width={barWidth} height="18" rx="9" fill="#374151" />
                <rect
                  x="80"
                  y={y + 4}
                  width={width}
                  height="18"
                  rx="9"
                  fill={row.percent === 100 ? '#10b981' : '#3b82f6'}
                />
              </g>
            );
          })}

          {/* 底部信息 */}
          <line x1="80" y1="960" x2="1000" y2="960" stroke="#374151" strokeWidth="2" />
          <text x="80" y="1005" fill="#9ca3af" fontSize="22" fontFamily="sans-serif">
            Git Learning Platform · 交互式 Git 学习
          </text>
          <text x="1000" y="1005" fill="#6b7280" fontSize="22" textAnchor="end" fontFamily="sans-serif">
            github.com/StarrySea1412/git-learning-platform-
          </text>
        </svg>
      </div>
    </div>
  );
}
