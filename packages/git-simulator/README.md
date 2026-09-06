# git-simulator-core

[![CI](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml/badge.svg)](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml)

零依赖的内存版 Git 模拟器——用纯 TypeScript 实现了一个"能跑命令的假仓库"。
为 Git 教学工具、交互式沙盒和可视化项目而生，也是 [Git 学习平台](https://github.com/StarrySea1412/git-learning-platform-)的核心引擎。

## 特性

- **零依赖**：纯函数式状态机，状态是普通对象（`Map` + 数组），随时克隆、序列化、放进 React state
- **完整的本地命令**：`init` / `add` / `commit` / `status` / `log` / `branch` / `checkout` / `switch` / `merge` / `rebase`（含 `--onto`）/ `reset`（soft/hard）/ `revert` / `cherry-pick` / `stash` / `reflog`
- **远程仓库模型**：本地 + origin 双仓库，支持 `remote` / `fetch` / `pull` / `push`，真实还原 non-fast-forward 推送拒绝
- **合并冲突模拟**：文件内容模型，双方修改同一配置时 merge 产生冲突，可展示冲突标记并按方案解决
- **协作场景工厂**：`createCollaborationState` 一行构造"队友已推送但你还没 fetch"的练习场景
- **中文反馈**：所有命令输出模拟真实 Git 的中文本地化提示

## 安装

```bash
npm install git-simulator-core
```

## 快速开始

```ts
import {
  createInitialState,
  executeCommand,
  createCollaborationState,
  teammatePush,
} from 'git-simulator-core';

// 从一个干净仓库开始
let state = createInitialState();

// 执行命令，返回新的不可变状态
const result = executeCommand(state, 'git checkout -b feature');
if (result.ok) {
  state = result.state;
}
console.log(result.output); // 已创建并切换到分支 "feature"

// 提交（--allow-empty 模拟空提交，config= 模拟修改 config.js 内容）
state = executeCommand(state, 'git commit --allow-empty -m "feat: login" config="log_level=debug"').state;

// 构造一个协作场景：队友已推送，你还没 fetch
let collab = createCollaborationState({
  sharedMessages: ['setup project'],
  teammateMessages: ['teammate: add docs'],
});

// 练习途中，队友"突然"又推了一个提交
const pushed = teammatePush(collab, 'teammate: fix navbar');
collab = pushed.state;
// 本地的 origin/main 镜像纹丝不动——必须自己 git fetch 才能发现
```

## 状态模型

`GitState` 是一个纯对象，包含：

| 字段 | 说明 |
|------|------|
| `commits` | `Map<id, GitCommit>` — 全部提交，含父指针与文件内容 |
| `branches` | `Map<name, commitId>` — 本地分支 |
| `HEAD` | `"ref: main"` 或提交 id（detached） |
| `staging` / `workingTreeDirty` | 暂存区 / 工作区状态 |
| `stash` | 单层 stash 记录 |
| `reflog` | HEAD 移动记录（支持 `HEAD@{1}` 语法） |
| `remote` | origin 仓库：独立的提交与分支 |
| `remoteTracking` | `origin/*` 镜像，只在 fetch 时更新 |
| `mergeConflict` | 冲突进行中的双方内容与来源分支 |

每次 `executeCommand` 都返回**全新状态**（输入不可变），可以直接做时间旅行或撤销。

## 支持的命令一览

```
git init [path]           git clone <url>
git add <files|.>         git commit -m "msg" [--allow-empty] [config="value"]
git status [-s]           git log [--oneline] [--graph] [--all]
git branch [name|-a|-d]   git checkout <branch|commit|HEAD~n> [-b]
git switch <branch> [-c]  git merge <branch>
git rebase <branch>       git rebase --onto <new> <old> <branch>
git reset --soft|--hard   git revert HEAD
git cherry-pick <ref>     git stash [pop|list]
git reflog                git remote [-v|add <name> <url>]
git fetch [origin]        git pull [origin <branch>]
git push [origin <branch>] [-u]
resolve-conflict [ours|theirs|both]   ← 合并冲突解决（教学辅助命令）
```

`commit` 的 `config="value"` 参数是文件内容模型的简化入口：修改 `config.js`
的值，两侧都改过再 merge 就会触发冲突——这是冲突教学的钩子。

## 用途

- **教学平台**：本包驱动着一个 30 题的交互式 Git 练习系统
- **沙盒**：给用户一个"弄不坏的仓库"随便试命令
- **可视化**：状态是纯数据，画提交图/分支图不需要 hook 进真实 Git
- **测试**：需要 Git 仓库行为 fixture 的单元测试

## 开发

本包是 git-learning-platform 仓库的子包，源码在 `packages/git-simulator`：

```bash
# 构建类型与 ESM 产物
npm run build
```

## 许可证

[MIT](../../LICENSE)
