'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitState, getHeadCommit, getHeadBranch } from '@/lib/git-simulator';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  message: string;
  branchCol: number;
}

interface GraphEdge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isMerge: boolean;
}

interface GitGraphProps {
  state: GitState;
}

const COL_WIDTH = 80;
const ROW_HEIGHT = 60;
const NODE_RADIUS = 14;
const PADDING = 50;

export default function GitGraph({ state }: GitGraphProps) {
  const { nodes, edges, branchLabels, headPos } = useMemo(() => {
    // Build a topological order (DFS from all branch tips)
    const visited = new Set<string>();
    const order: string[] = [];

    // Get all branch tip commits sorted by branch name for stable layout
    const branchTips = Array.from(state.branches.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    function walk(commitId: string) {
      if (visited.has(commitId)) return;
      visited.add(commitId);
      const commit = state.commits.get(commitId);
      if (!commit) return;
      for (const parent of commit.parents) {
        walk(parent);
      }
      order.push(commitId);
    }

    for (const [, tipId] of branchTips) {
      walk(tipId);
    }

    // Assign columns: each branch gets its own column
    const branchColMap = new Map<string, number>();
    branchTips.forEach(([name], i) => {
      branchColMap.set(name, i);
    });

    // Map commit → column based on which branch tip reaches it first
    const commitCol = new Map<string, number>();
    for (const [branchName, tipId] of branchTips) {
      const col = branchColMap.get(branchName)!;
      let current: string | null = tipId;
      const localVisited = new Set<string>();
      while (current && !localVisited.has(current)) {
        localVisited.add(current);
        if (!commitCol.has(current)) {
          commitCol.set(current, col);
        }
        const commit = state.commits.get(current);
        current = commit?.parents[0] ?? null;
      }
    }

    // Position nodes
    const graphNodes: GraphNode[] = order.map((id, i) => {
      const commit = state.commits.get(id)!;
      const col = commitCol.get(id) ?? 0;
      return {
        id,
        x: PADDING + col * COL_WIDTH,
        y: PADDING + i * ROW_HEIGHT,
        message: commit.message,
        branchCol: col,
      };
    });

    // Build edges
    const nodeMap = new Map(graphNodes.map(n => [n.id, n]));
    const graphEdges: GraphEdge[] = [];
    for (const node of graphNodes) {
      const commit = state.commits.get(node.id)!;
      for (const parentId of commit.parents) {
        const parent = nodeMap.get(parentId);
        if (parent) {
          graphEdges.push({
            from: { x: node.x, y: node.y },
            to: { x: parent.x, y: parent.y },
            isMerge: commit.parents.length > 1,
          });
        }
      }
    }

    // Branch labels (at the latest commit of each branch)
    const labels: { name: string; x: number; y: number }[] = [];
    state.branches.forEach((tipId, name) => {
      const node = nodeMap.get(tipId);
      if (node) {
        labels.push({ name, x: node.x, y: node.y });
      }
    });

    // HEAD position
    const headCommitId = getHeadCommit(state);
    const head = headCommitId ? nodeMap.get(headCommitId) : undefined;

    return { nodes: graphNodes, edges: graphEdges, branchLabels: labels, headPos: head };
  }, [state]);

  const svgWidth = PADDING * 2 + Math.max(1, state.branches.size) * COL_WIDTH;
  const svgHeight = PADDING * 2 + Math.max(1, nodes.length) * ROW_HEIGHT;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 overflow-auto">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">提交图</h3>
      <svg
        width={svgWidth}
        height={svgHeight}
        className="font-mono text-xs"
        style={{ minWidth: svgWidth, minHeight: svgHeight }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          if (edge.isMerge) {
            // Curved line for merge
            const midY = (edge.from.y + edge.to.y) / 2;
            return (
              <path
                key={`e-${i}`}
                d={`M ${edge.from.x} ${edge.from.y} C ${edge.from.x} ${midY}, ${edge.to.x} ${midY}, ${edge.to.x} ${edge.to.y}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          }
          if (edge.from.x === edge.to.x) {
            // Straight vertical line
            return (
              <line
                key={`e-${i}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            );
          }
          // Diagonal line
          return (
            <line
              key={`e-${i}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          );
        })}

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_RADIUS}
                fill="#0ea5e9"
                stroke="#0284c7"
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y - NODE_RADIUS - 6}
                textAnchor="middle"
                fill="currentColor"
                className="text-gray-500 dark:text-gray-400"
                fontSize="10"
              >
                {node.id.slice(0, 7)}
              </text>
            </motion.g>
          ))}
        </AnimatePresence>

        {/* Branch labels */}
        {branchLabels.map((label) => {
          const isHead = getHeadBranch(state) === label.name;
          return (
            <g key={`label-${label.name}`}>
              <rect
                x={label.x + NODE_RADIUS + 6}
                y={label.y - 10}
                width={label.name.length * 8 + 16}
                height={20}
                rx={4}
                fill={isHead ? '#0ea5e9' : '#64748b'}
              />
              <text
                x={label.x + NODE_RADIUS + 14}
                y={label.y + 4}
                fill="white"
                fontSize="11"
                fontWeight="600"
              >
                {label.name}
              </text>
            </g>
          );
        })}

        {/* HEAD indicator */}
        {headPos && (
          <g>
            <polygon
              points={`${headPos.x - 8},${headPos.y - NODE_RADIUS - 20} ${headPos.x + 8},${headPos.y - NODE_RADIUS - 20} ${headPos.x},${headPos.y - NODE_RADIUS - 8}`}
              fill="#22c55e"
            />
            <text
              x={headPos.x}
              y={headPos.y - NODE_RADIUS - 24}
              textAnchor="middle"
              fill="#22c55e"
              fontSize="11"
              fontWeight="700"
            >
              HEAD
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
