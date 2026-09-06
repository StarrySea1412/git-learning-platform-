# 我给 Git 学习平台加了一个"虚拟队友"：它会突然往 origin/main 推代码

> 项目地址：
> - GitHub: https://github.com/StarrySea1412/git-learning-platform-
> - Gitee: https://gitee.com/starry-sea-1412/git-learning-platform

## 起因：交互式 Git 教程都停在"会合并"这一步

市面上交互式 Git 学习工具不少（learnGitBranching 是最出名的），它们解决了一个真问题：让你在可视化界面里理解分支、合并、rebase。

但用的时候我一直觉得缺了点什么——**这些工具里的"远程仓库"都是假的**。

- 你 `git push`，它演一下"推送成功"
- 从来不会有队友和你抢 origin/main
- 推送永远成功，`non-fast-forward` 这个词只是文档里的一行字
- merge 永远不冲突，`<<<<<<<` 标记只在截图里见过

而现实中把新手卡死的，恰恰是这些场景：推送被拒了怎么办？冲突标记怎么读？队友先推了怎么办？

所以我做了这个平台，并且专门把这三个"没人教"的场景做成了可以亲手操作的练习。这篇主要讲其中最有意思的两个设计。

## 一、一个真的"本地 + 远程"双仓库模型

大部分教学模拟器的状态只有一份：仓库。我的模拟器（`git-simulator-core`，已抽成零依赖 npm 包）的 `GitState` 里是两个仓库：

```
GitState
├── commits / branches / HEAD     ← 本地仓库
├── remote: RemoteRepo            ← origin：独立的 commits + branches
├── remoteTracking: Map           ← origin/* 在你本地的镜像
└── mergeConflict                 ← 冲突进行中的现场
```

关键设计：**`remote.commits` 是一个真正独立的对象图**。队友的提交只存在于远程仓库里，你本地的 `origin/main` 镜像停在旧位置——直到你 `git fetch`，才会把远程新对象拉进本地对象库并更新镜像。

这意味着这些行为都是"真的"：

- `git fetch` 前后，`origin/main` 指向不同提交，而且不 fetch 你永远看不到
- 本地领先远程时，`git status` 会告诉你"领先 N 个提交"
- 两边分叉时 `git push` 会被拒绝，输出和真 Git 一模一样：

```
 ! [rejected]        main -> main (non-fast-forward)
hint: 更新被拒绝，因为远程包含你本地还没有的工作。
hint: 先执行 git fetch 查看远程状态，再用 git pull 整合远程更改
```

配套的练习《推送被拒后的自救》完整走一遍：被拒 → fetch 看看远程发生了什么 → pull 生成合并提交 → 重新推送成功。做完这道题，生产环境里收到 non-fast-forward 你就不会慌了。

## 二、虚拟队友：它会"突然"给你发难

静态场景好做，但真实协作的精髓是"不可预期"。

于是有了 `teammatePush`：练习进行中，模拟队友向 origin/main 推送一个新提交。它有三个特性：

1. **只动远程**。本地仓库、本地镜像纹丝不动——你必须自己 fetch 才能发现，这正是要训练的肌肉记忆
2. **有触发时机**。练习配置里声明"第几步完成后触发"，比如你刚 fetch 完第一轮，队友就又推了一个
3. **有剧情**。推送信息是真实风格："teammate: fix navbar overflow"

《同步队友推送的更新》这道练习现在长这样：

1. 你 fetch，发现队友的第一个提交 → 2. **队友突然又推了一个** → 3. 你再 fetch → 4. 合并进本地

两轮"远程变了 → 重新同步"之后，push 前先 fetch 就不再是口诀了。

## 三、合并冲突：给模拟器加了一个文件内容模型

模拟器原本没有"文件"的概念，只有提交图——所以永远产生不了冲突（冲突的本质是文件内容的分歧）。

完整文件系统太重，我用了最小化方案：给提交加一个 `configValue` 字段，代表 `config.js` 的内容。提交时用 `config="值"` 修改它：

```
git commit -m "main: set log level" config="log_level=debug"
```

merge 时做三方对比（base / ours / theirs）：两边都改了且值不同 → 冲突，Git 暂停，`mergeConflict` 记录双方内容和来源分支。此时：

- `resolve-conflict`（不带参数）展示完整的冲突标记：

```
<<<<<<< HEAD（当前分支）
log_level=debug
=======
log_level=trace
>>>>>>> feature
```

- `resolve-conflict ours|theirs|both` 按方案解决，生成带 `resolved:` 标记的合并提交
- 冲突期间 `git add` 会被拦截，模拟"没解决完冲突不能提交"的真实约束

配套练习《解决合并冲突》四步：触发冲突 → 看懂标记 → 做出取舍（剧情里给了理由：main 的 debug 是测试环境验证过的）→ 用 git log 验证结果。

## 四、这个模拟器现在是个 npm 包

整个引擎没有抽出任何依赖，纯函数式：每次 `executeCommand` 返回全新的不可变状态，天然支持时间旅行和 React 集成。

```bash
npm install git-simulator-core
```

```ts
import { createInitialState, executeCommand } from 'git-simulator-core';

let state = createInitialState();
const result = executeCommand(state, 'git checkout -b feature');
// result.ok / result.output / result.state（全新状态）
```

如果你想做一个 Git 教学工具、沙盒或者提交图可视化，状态就是纯数据，直接画就行。

## 项目现状

- 30 个交互练习、18 篇教程（纯中文原生内容）、11 个动画场景、成就与统计系统
- 61 个测试、CI + 自动部署、GitHub + Gitee 双平台、MIT 协议
- 网站可一键部署到 Vercel（Fork 后零配置）

对这个项目的期待很简单：让下一个学 Git 的人，在遇到第一次推送被拒时，脑子里有个声音说"这题我练过"。

欢迎试用、提 issue、或者顺手点个 star ⭐ —— 每一个都算数。
