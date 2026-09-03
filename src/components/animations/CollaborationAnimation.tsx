'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  dashed?: boolean;
}

interface Edge {
  from: string;
  to: string;
  color: string;
  dashed?: boolean;
}

type Phase =
  | 'idle'
  | 'local-commit'
  | 'push'
  | 'teammate-push'
  | 'rejected'
  | 'fetch'
  | 'pull-merge'
  | 'done';

const ORIGIN_Y = 70;
const LOCAL_Y = 170;
const TEAMMATE_Y = 215;

const ORIGIN_COLOR = '#64748b';
const LOCAL_COLOR = '#3b82f6';
const TEAMMATE_COLOR = '#f97316';
const MERGE_COLOR = '#8b5cf6';

const phases: { key: Phase; label: string; desc: string; command?: string }[] = [
  {
    key: 'idle',
    label: '克隆基线',
    desc: '你和队友克隆了同一个远程仓库，双方本地 main 都停在提交 B，origin/main 也在 B。',
  },
  {
    key: 'local-commit',
    label: '本地提交 C',
    desc: '你在本地 main 上完成提交 C。提交只存在于你的电脑上，队友还看不到。',
    command: 'git commit -m "add feature"',
  },
  {
    key: 'push',
    label: '推送成功',
    desc: 'git push 把提交 C 上传到 origin，远程 main 前进到 C，队友现在能拉到你的工作。',
    command: 'git push origin main',
  },
  {
    key: 'teammate-push',
    label: '队友抢先推送 D',
    desc: '队友在同一分支上推送了提交 D。此时远程比你本地多一个提交，但你的 origin/main 镜像还没更新。',
  },
  {
    key: 'rejected',
    label: '推送被拒',
    desc: '你再执行 push，Git 拒绝了：non-fast-forward。远程有你没有的提交，直接接受会覆盖队友的工作。',
    command: 'git push origin main → ! [rejected]',
  },
  {
    key: 'fetch',
    label: 'fetch 查看远程',
    desc: 'git fetch 把队友的提交 D 下载到本地，并更新 origin/main 镜像。此时可以先 git log 看看队友改了什么。',
    command: 'git fetch origin',
  },
  {
    key: 'pull-merge',
    label: 'pull 整合',
    desc: 'git pull = fetch + merge：生成合并提交 M，把你的 C 和队友的 D 汇到一起，本地 main 现在包含双方的工作。',
    command: 'git pull origin main',
  },
  {
    key: 'done',
    label: '重新推送成功',
    desc: '本地已经包含远程的所有提交，推送顺利通过，双方回到同一条历史线上。',
    command: 'git push origin main ✓',
  },
];

export default function CollaborationAnimation() {
  const [phase, setPhase] = useState<Phase>('idle');

  const phaseIndex = phases.findIndex((item) => item.key === phase);
  const nextPhase = () => {
    if (phaseIndex < phases.length - 1) setPhase(phases[phaseIndex + 1].key);
  };
  const reset = () => setPhase('idle');

  const getNodes = (): Node[] => {
    const base = (y: number, color: string) => [
      { id: `o-A-${y}`, label: 'A', x: 70, y, color },
      { id: `o-B-${y}`, label: 'B', x: 150, y, color },
    ];

    switch (phase) {
      case 'idle':
        return [...base(ORIGIN_Y, ORIGIN_COLOR), ...base(LOCAL_Y, LOCAL_COLOR)];
      case 'local-commit':
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
        ];
      case 'push':
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          { id: 'o-C', label: 'C', x: 230, y: ORIGIN_Y, color: ORIGIN_COLOR },
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
        ];
      case 'teammate-push':
      case 'rejected':
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          { id: 'o-C', label: 'C', x: 230, y: ORIGIN_Y, color: ORIGIN_COLOR },
          { id: 'o-D', label: 'D', x: 310, y: ORIGIN_Y, color: TEAMMATE_COLOR },
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
        ];
      case 'fetch':
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          { id: 'o-C', label: 'C', x: 230, y: ORIGIN_Y, color: ORIGIN_COLOR },
          { id: 'o-D', label: 'D', x: 310, y: ORIGIN_Y, color: TEAMMATE_COLOR },
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
          {
            id: 'l-D',
            label: 'D',
            x: 310,
            y: LOCAL_Y,
            color: TEAMMATE_COLOR,
            dashed: true,
          },
        ];
      case 'pull-merge':
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          { id: 'o-C', label: 'C', x: 230, y: ORIGIN_Y, color: ORIGIN_COLOR },
          { id: 'o-D', label: 'D', x: 310, y: ORIGIN_Y, color: TEAMMATE_COLOR },
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
          {
            id: 'l-D',
            label: 'D',
            x: 310,
            y: TEAMMATE_Y,
            color: TEAMMATE_COLOR,
          },
          {
            id: 'l-M',
            label: 'M',
            x: 390,
            y: LOCAL_Y,
            color: MERGE_COLOR,
          },
        ];
      case 'done':
      default:
        return [
          ...base(ORIGIN_Y, ORIGIN_COLOR),
          { id: 'o-C', label: 'C', x: 230, y: ORIGIN_Y, color: ORIGIN_COLOR },
          { id: 'o-D', label: 'D', x: 310, y: ORIGIN_Y, color: TEAMMATE_COLOR },
          { id: 'o-M', label: 'M', x: 390, y: ORIGIN_Y, color: MERGE_COLOR },
          ...base(LOCAL_Y, LOCAL_COLOR),
          { id: 'l-C', label: 'C', x: 230, y: LOCAL_Y, color: LOCAL_COLOR },
          {
            id: 'l-D',
            label: 'D',
            x: 310,
            y: TEAMMATE_Y,
            color: TEAMMATE_COLOR,
          },
          {
            id: 'l-M',
            label: 'M',
            x: 390,
            y: LOCAL_Y,
            color: MERGE_COLOR,
          },
        ];
    }
  };

  const getEdges = (): Edge[] => {
    const nodes = getNodes();
    const edges: Edge[] = [];

    const addEdge = (from: string, to: string, color: string, dashed = false) => {
      const fromNode = findNode(nodes, from);
      const toNode = findNode(nodes, to);
      if (fromNode && toNode) {
        edges.push({ from, to, color, dashed });
      }
    };

    addEdge('o-A-70', 'o-B-70', ORIGIN_COLOR);
    addEdge('l-A-170', 'l-B-170', LOCAL_COLOR);

    if (phase !== 'idle') {
      addEdge('l-B-170', 'l-C', LOCAL_COLOR);
    }
    if (phase === 'push' || phase === 'teammate-push' || phase === 'rejected' || phase === 'fetch' || phase === 'pull-merge' || phase === 'done') {
      addEdge('o-B-70', 'o-C', ORIGIN_COLOR);
    }
    if (phase === 'teammate-push' || phase === 'rejected' || phase === 'fetch' || phase === 'pull-merge' || phase === 'done') {
      addEdge('o-C', 'o-D', TEAMMATE_COLOR);
    }
    if (phase === 'fetch') {
      addEdge('l-C', 'l-D', TEAMMATE_COLOR, true);
    }
    if (phase === 'pull-merge' || phase === 'done') {
      addEdge('l-C', 'l-M', LOCAL_COLOR);
      addEdge('l-D', 'l-M', TEAMMATE_COLOR);
    }
    if (phase === 'done') {
      addEdge('o-D', 'o-M', MERGE_COLOR);
    }

    return edges;
  };

  const nodes = getNodes();
  const edges = getEdges();
  const current = phases[phaseIndex];
  const showRejectedBadge = phase === 'rejected';
  const showLocalOriginTag = phase === 'fetch' || phase === 'pull-merge';

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        和队友隔着远程仓库协作
      </h3>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        push 为什么会被拒绝？fetch、pull、push 的日常同步闭环长什么样。
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
          {current.desc}
          {current.command && (
            <code className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {current.command}
            </code>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative h-72 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
        <div className="absolute left-2 top-3 text-xs font-semibold text-slate-500">
          origin/main · GitHub
        </div>
        <div className="absolute bottom-16 left-2 text-xs font-semibold text-blue-500">
          你的本地 main
        </div>
        {showLocalOriginTag && (
          <div className="absolute bottom-6 left-2 text-xs font-semibold text-orange-500">
            origin/main（本地镜像）
          </div>
        )}
        {showRejectedBadge && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-10 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-300"
          >
            ! [rejected] main → main
            <br />
            (non-fast-forward)
          </motion.div>
        )}

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
                transition={{ duration: 0.5, delay: i * 0.08 }}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.color}
                strokeWidth="3"
                strokeDasharray={edge.dashed ? '6 4' : undefined}
                opacity={edge.dashed ? 0.6 : 1}
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
              node.dashed ? 'border-2 border-dashed border-white/70' : ''
            }`}
            style={{ left: node.x - 20, top: node.y - 20, backgroundColor: node.color }}
          >
            {node.label}
          </motion.div>
        ))}
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
