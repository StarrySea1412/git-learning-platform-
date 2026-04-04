'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface BranchNode {
  id: string;
  branch: string;
  x: number;
  y: number;
}

export default function BranchAnimation() {
  const [branches, setBranches] = useState<
    { name: string; color: string; nodes: BranchNode[] }[]
  >([
    {
      name: 'main',
      color: '#3b82f6',
      nodes: [{ id: 'c1', branch: 'main', x: 50, y: 100 }],
    },
  ]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [newBranchName, setNewBranchName] = useState('feature-login');

  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const createBranch = () => {
    if (!newBranchName.trim()) return;
    if (branches.find((branch) => branch.name === newBranchName)) return;

    const currentBranchData = branches.find((branch) => branch.name === currentBranch);
    const lastNode = currentBranchData?.nodes[currentBranchData.nodes.length - 1];

    const newBranch = {
      name: newBranchName,
      color: colors[branches.length % colors.length],
      nodes: lastNode
        ? [
            {
              id: `${newBranchName}-c1`,
              branch: newBranchName,
              x: lastNode.x,
              y: 100 + branches.length * 60,
            },
          ]
        : [],
    };

    setBranches([...branches, newBranch]);
    setCurrentBranch(newBranchName);
    setNewBranchName('bugfix-header');
  };

  const switchBranch = (branchName: string) => {
    setCurrentBranch(branchName);
  };

  const addCommit = () => {
    setBranches(
      branches.map((branch) => {
        if (branch.name !== currentBranch) return branch;

        const lastNode = branch.nodes[branch.nodes.length - 1];
        const newNode: BranchNode = {
          id: `${branch.name}-c${branch.nodes.length + 1}`,
          branch: branch.name,
          x: lastNode ? lastNode.x + 80 : 50,
          y:
            branch.name === 'main'
              ? 100
              : 100 + branches.findIndex((item) => item.name === branch.name) * 60,
        };

        return { ...branch, nodes: [...branch.nodes, newNode] };
      })
    );
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        为登录功能拉出独立分支
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        先从稳定的 main 拉出 feature-login，再在自己的开发线上继续提交。
      </p>

      <div className="mb-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-gray-900 dark:text-slate-300">
        当前演示：主线保持稳定，你把新功能放到独立分支里继续推进。
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            placeholder="例如：feature-login"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && createBranch()}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createBranch}
            className="rounded-lg bg-green-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600"
          >
            创建并切换
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={addCommit}
          className="rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-600"
        >
          在当前分支提交一次
        </motion.button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {branches.map((branch) => (
          <motion.button
            key={branch.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => switchBranch(branch.name)}
            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
              currentBranch === branch.name
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            style={currentBranch === branch.name ? { backgroundColor: branch.color } : undefined}
          >
            {branch.name}
          </motion.button>
        ))}
      </div>

      <div className="relative h-64 overflow-x-auto rounded-lg bg-gray-50 dark:bg-gray-900">
        <svg className="absolute inset-0 h-full w-full min-w-[600px]">
          {branches.map((branch) => (
            <g key={branch.name}>
              {branch.nodes.map((node, index) => {
                if (index === 0) return null;
                const prevNode = branch.nodes[index - 1];
                return (
                  <motion.line
                    key={`line-${node.id}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                    x1={prevNode.x}
                    y1={prevNode.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={branch.color}
                    strokeWidth="3"
                  />
                );
              })}
            </g>
          ))}
        </svg>

        {branches.map((branch) => (
          <div key={branch.name}>
            {branch.nodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
                style={{
                  left: node.x - 20,
                  top: node.y - 20,
                  backgroundColor: branch.color,
                }}
              >
                {index + 1}
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <p>先在 main 上拉出 feature-login，再在自己的分支里连续提交。</p>
        <p>切换按钮模拟的是 checkout / switch，提交节点则表示这条分支正在独立前进。</p>
      </div>
    </div>
  );
}
