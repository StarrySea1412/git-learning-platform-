'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  branch: string;
  color: string;
}

interface Edge {
  from: string;
  to: string;
  color: string;
}

type Phase =
  | 'idle'
  | 'develop'
  | 'branch'
  | 'feature-work'
  | 'main-work'
  | 'rebase'
  | 'merge'
  | 'done';

const phases: { key: Phase; label: string; desc: string }[] = [
  { key: 'idle', label: '稳定基线', desc: 'main 上已经有一段稳定历史，准备开始新功能。' },
  { key: 'develop', label: '主线前进', desc: '主线继续前进到提交 C，成为当前最新基底。' },
  { key: 'branch', label: '拉出功能分支', desc: '从 C 拉出 feature-login，功能开发从这里开始。' },
  {
    key: 'feature-work',
    label: '功能开发',
    desc: 'feature-login 上连续完成两次提交，功能逐渐成形。',
  },
  {
    key: 'main-work',
    label: '主线插入热修',
    desc: 'main 在你开发期间插入 hotfix 提交 H，主线已经和功能分支不同步。',
  },
  {
    key: 'rebase',
    label: '同步主线',
    desc: '先把 feature-login 变基到 main 最新位置，减少后续收尾时的历史噪音。',
  },
  { key: 'merge', label: '收尾合并', desc: '同步完成后，把 feature-login 安全合并回 main。' },
  { key: 'done', label: '交付完成', desc: '功能已回到主线，团队可以沿着 main 继续向前推进。' },
];

export default function WorkflowAnimation() {
  const [phase, setPhase] = useState<Phase>('idle');

  const phaseIndex = phases.findIndex((item) => item.key === phase);
  const nextPhase = () => {
    const idx = phases.findIndex((item) => item.key === phase);
    if (idx < phases.length - 1) setPhase(phases[idx + 1].key);
  };
  const reset = () => setPhase('idle');

  const getNodes = (): Node[] => {
    const base: Node[] = [
      { id: 'A', label: 'A', x: 60, y: 100, branch: 'main', color: '#3b82f6' },
      { id: 'B', label: 'B', x: 150, y: 100, branch: 'main', color: '#3b82f6' },
    ];
    if (phase === 'idle') return base;

    base.push({ id: 'C', label: 'C', x: 240, y: 100, branch: 'main', color: '#3b82f6' });
    if (phase === 'develop') return base;
    if (phase === 'branch') return base;

    if (phase === 'feature-work') {
      return [
        ...base,
        { id: 'D', label: 'D', x: 330, y: 180, branch: 'feature', color: '#10b981' },
        { id: 'E', label: 'E', x: 420, y: 180, branch: 'feature', color: '#10b981' },
      ];
    }

    if (phase === 'main-work') {
      return [
        ...base,
        { id: 'H', label: 'H', x: 330, y: 100, branch: 'main', color: '#ef4444' },
        { id: 'D', label: 'D', x: 330, y: 180, branch: 'feature', color: '#10b981' },
        { id: 'E', label: 'E', x: 420, y: 180, branch: 'feature', color: '#10b981' },
      ];
    }

    if (phase === 'rebase') {
      return [
        ...base,
        { id: 'H', label: 'H', x: 330, y: 100, branch: 'main', color: '#ef4444' },
        { id: "D'", label: "D'", x: 420, y: 100, branch: 'feature', color: '#10b981' },
        { id: "E'", label: "E'", x: 510, y: 100, branch: 'feature', color: '#10b981' },
      ];
    }

    if (phase === 'merge') {
      return [
        ...base,
        { id: 'H', label: 'H', x: 330, y: 100, branch: 'main', color: '#ef4444' },
        { id: "D'", label: "D'", x: 420, y: 100, branch: 'feature', color: '#10b981' },
        { id: "E'", label: "E'", x: 510, y: 100, branch: 'feature', color: '#10b981' },
        { id: 'M', label: 'M', x: 600, y: 100, branch: 'main', color: '#8b5cf6' },
      ];
    }

    return [
      ...base,
      { id: 'H', label: 'H', x: 330, y: 100, branch: 'main', color: '#ef4444' },
      { id: "D'", label: "D'", x: 420, y: 100, branch: 'main', color: '#10b981' },
      { id: "E'", label: "E'", x: 510, y: 100, branch: 'main', color: '#10b981' },
      { id: 'M', label: 'M', x: 600, y: 100, branch: 'main', color: '#8b5cf6' },
    ];
  };

  const getEdges = (): Edge[] => {
    const nodes = getNodes();
    const edges: Edge[] = [];

    const addEdge = (from: string, to: string, color: string) => {
      if (findNode(nodes, from) && findNode(nodes, to)) edges.push({ from, to, color });
    };

    addEdge('A', 'B', '#3b82f6');
    if (phase !== 'idle') addEdge('B', 'C', '#3b82f6');

    if (phase === 'feature-work') {
      addEdge('C', 'D', '#10b981');
      addEdge('D', 'E', '#10b981');
    }
    if (phase === 'main-work') {
      addEdge('C', 'H', '#ef4444');
      addEdge('C', 'D', '#10b981');
      addEdge('D', 'E', '#10b981');
    }
    if (phase === 'rebase') {
      addEdge('C', 'H', '#ef4444');
      addEdge('H', "D'", '#10b981');
      addEdge("D'", "E'", '#10b981');
    }
    if (phase === 'merge' || phase === 'done') {
      addEdge('C', 'H', '#ef4444');
      addEdge('H', "D'", '#10b981');
      addEdge("D'", "E'", '#10b981');
      addEdge("E'", 'M', '#8b5cf6');
    }

    return edges;
  };

  const nodes = getNodes();
  const edges = getEdges();

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        一个完整的功能分支工作流
      </h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        从拉分支、做功能、同步主线到合并收尾，顺着看一遍真实协作路径。
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {phases.map((item, i) => (
          <button
            key={item.key}
            onClick={() => setPhase(item.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              phase === item.key
                ? 'bg-primary-500 text-white'
                : i <= phaseIndex
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300"
        >
          <span className="font-medium text-primary-600 dark:text-primary-400">
            [{phaseIndex + 1}/{phases.length}]
          </span>{' '}
          {phases[phaseIndex].desc}
        </motion.div>
      </AnimatePresence>

      <div className="relative h-56 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
        <svg className="absolute inset-0 h-full w-full">
          {edges.map((edge, i) => {
            const from = findNode(nodes, edge.from);
            const to = findNode(nodes, edge.to);
            if (!from || !to) return null;
            return (
              <motion.line
                key={`${edge.from}-${edge.to}-${i}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.color}
                strokeWidth="3"
              />
            );
          })}
        </svg>

        {nodes.map((node, i) => (
          <motion.div
            key={`${node.id}-${phase}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, delay: i * 0.06 }}
            className={`absolute flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg ${
              node.id === 'M' ? 'h-12 w-12 border-2 border-purple-300 text-sm' : ''
            }`}
            style={{ left: node.x - 20, top: node.y - 20, backgroundColor: node.color }}
          >
            {node.label}
          </motion.div>
        ))}

        {phase !== 'idle' && (
          <div className="absolute left-2 top-2 text-xs font-medium text-blue-500">main</div>
        )}
        {(phase === 'feature-work' || phase === 'main-work' || phase === 'branch') && (
          <div className="absolute bottom-2 left-2 text-xs font-medium text-green-500">
            feature-login
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        {phase !== 'done' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextPhase}
            className="rounded-lg bg-primary-500 px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-600"
          >
            下一步 →
          </motion.button>
        )}
        {phase === 'done' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="rounded-lg bg-gray-200 px-5 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            重置
          </motion.button>
        )}
      </div>
    </div>
  );
}

function findNode(nodes: Node[], id: string) {
  return nodes.find((node) => node.id === id);
}
