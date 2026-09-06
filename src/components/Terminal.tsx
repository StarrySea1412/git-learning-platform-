'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { playKeySound } from '@/lib/sound';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'error';
  content: string;
}

interface TerminalProps {
  onCommand: (command: string) => { success: boolean; output: string };
  initialOutput?: string;
  helperText?: string;
  resetKey?: number;
  /** 可用于 Tab 补全的命令词表 */
  completionWords?: string[];
}

/** 内置的 Git 命令补全词表 */
const DEFAULT_COMPLETION_WORDS = [
  'git init', 'git clone', 'git add .', 'git add', 'git commit --allow-empty',
  'git commit -m', 'git commit --amend -m', 'git status', 'git status -s',
  'git log --oneline --graph --all', 'git log --oneline', 'git log',
  'git branch -a', 'git branch -d', 'git branch -D', 'git branch -m', 'git branch',
  'git checkout -b', 'git checkout', 'git switch -c', 'git switch -', 'git switch',
  'git merge', 'git rebase -i HEAD~3', 'git rebase --onto', 'git rebase',
  'git reset --soft', 'git reset --hard', 'git revert HEAD',
  'git cherry-pick', 'git stash pop', 'git stash list', 'git stash',
  'git reflog', 'git remote -v', 'git remote add',
  'git fetch', 'git pull origin', 'git push -u origin', 'git push origin',
  'git tag -d', 'git tag', 'git diff --staged', 'git diff', 'git show',
  'git restore --staged', 'git restore', 'git worktree add', 'git worktree list',
  'git worktree remove', 'git bisect start', 'git bisect good', 'git bisect bad',
  'git bisect reset', 'resolve-conflict ours', 'resolve-conflict theirs',
  'resolve-conflict both', 'resolve-conflict', 'rebase-todo apply', 'rebase-todo show',
];

export default function Terminal({
  onCommand,
  initialOutput,
  helperText = '输入命令并按 Enter 执行，↑↓ 历史 · Tab 补全 · Ctrl+L 清屏。',
  resetKey,
  completionWords = DEFAULT_COMPLETION_WORDS,
}: TerminalProps) {
  const lineIdRef = useRef(0);

  function nextLineId() {
    lineIdRef.current += 1;
    return lineIdRef.current;
  }
  const [lines, setLines] = useState<TerminalLine[]>(() => [
    { id: nextLineId(), type: 'output', content: initialOutput || 'Git Learning Terminal v2.0' },
    { id: nextLineId(), type: 'output', content: helperText },
    { id: nextLineId(), type: 'output', content: '' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const getInitialLines = useCallback(
    (): TerminalLine[] => [
      { id: nextLineId(), type: 'output', content: initialOutput || 'Git Learning Terminal v2.0' },
      { id: nextLineId(), type: 'output', content: helperText },
      { id: nextLineId(), type: 'output', content: '' },
    ],
    [helperText, initialOutput]
  );

  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setLines(getInitialLines());
      setCurrentInput('');
      setCommandHistory([]);
      setHistoryIndex(-1);
    }
  }, [getInitialLines, resetKey]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentInput.trim()) {
      return;
    }

    const inputLine: TerminalLine = {
      id: nextLineId(),
      type: 'input',
      content: `$ ${currentInput}`,
    };
    const result = onCommand(currentInput.trim());
    const outputLine: TerminalLine = {
      id: nextLineId(),
      type: result.success ? 'output' : 'error',
      content: result.output,
    };

    setLines((previous) => [...previous, inputLine, outputLine]);
    setCommandHistory((previous) => [...previous, currentInput]);
    setCurrentInput('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'l' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setLines(getInitialLines());
      return;
    }

    // Tab：补全命令。多个候选时补到最长公共前缀
    if (event.key === 'Tab') {
      event.preventDefault();
      const input = currentInput;
      if (!input) {
        return;
      }
      const matches = completionWords.filter((word) => word.startsWith(input));
      if (matches.length === 0) {
        return;
      }
      if (matches.length === 1) {
        setCurrentInput(matches[0] + ' ');
        return;
      }
      // 最长公共前缀
      let prefix = matches[0];
      for (const match of matches.slice(1)) {
        let i = 0;
        while (i < prefix.length && i < match.length && prefix[i] === match[i]) {
          i += 1;
        }
        prefix = prefix.slice(0, i);
      }
      setCurrentInput(prefix);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-gray-900 rounded-t-lg px-4 py-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-4 text-gray-400 text-sm">Terminal</span>
      </div>
      <div
        ref={terminalRef}
        onClick={() => inputRef.current?.focus()}
        className="bg-gray-950 rounded-b-lg p-4 h-96 overflow-y-auto font-mono text-sm cursor-text"
        role="log"
        aria-label="终端输出区域"
        aria-live="polite"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`mb-1 ${
              line.type === 'input'
                ? 'text-green-400'
                : line.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-300'
            }`}
          >
            {line.content || '\u00A0'}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(event) => {
              setCurrentInput(event.target.value);
              playKeySound();
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-green-400 outline-none caret-green-400"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            aria-label="输入 Git 命令"
          />
        </form>
      </div>
    </motion.div>
  );
}
