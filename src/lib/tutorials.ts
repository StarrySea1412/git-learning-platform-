export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'intermediate' | 'advanced';
  difficulty: '入门' | '进阶' | '高级';
  duration: string;
  relatedPracticeIds: string[];
  content: TutorialSection[];
}

export interface TutorialSection {
  title: string;
  content: string;
  codeExample?: string;
  tips?: string[];
}

type TutorialSeed = Omit<Tutorial, 'relatedPracticeIds'> & {
  relatedPracticeIds?: string[];
};

const rawTutorials: TutorialSeed[] = [
  {
    id: 'git-intro',
    title: 'Git 简介',
    description: '了解什么是Git，为什么需要版本控制，以及Git的基本概念',
    category: 'basics',
    difficulty: '入门',
    duration: '10分钟',
    relatedPracticeIds: ['git-init', 'git-status'],
    content: [
      {
        title: '什么是Git？',
        content: 'Git是一个分布式版本控制系统（Distributed Version Control System），由 Linux 之父 Linus Torvalds 在 2005 年创建，最初是为了管理 Linux 内核源代码。\n\n"版本控制"记录的是文件的变化历史；"分布式"意味着每一个参与开发的电脑上都保存着完整的仓库副本——不只是文件，还包括全部提交历史。断网时你依然可以提交、切分支、查看历史，只有"和他人同步"这一步需要网络。\n\n这与 SVN 那种"只有中央服务器有完整历史"的中心化系统有本质区别，也是 Git 能成为开源世界标配的原因之一。',
        codeExample: `# 查看自己电脑上的 Git 版本，确认安装成功
git --version

# Git 与中心化版本控制的区别（示意）:
# SVN:  客户端只拿到文件的最新版本，历史在服务器手里
#        [中央服务器] --历史--> 客户端A / 客户端B
# Git:  每个客户端都克隆完整仓库（含全部历史）
#        [仓库A] <----同步----> [仓库B]`,
        tips: ['Git 读 /ɡɪt/，"一个音节，重读，硬G"', '目前绝大多数开源项目都托管在 Git 上，学会它等于拿到了开源世界的门票']
      },
      {
        title: '为什么需要版本控制？',
        content: '想象一个没有版本控制的开发场景：你可能会这样管理文件——\n\n项目-v1.zip、项目-v2-改字体.zip、项目-v3-最终版.zip、项目-v3-真的最终版.zip……\n\n这种"手工版本管理"的痛点大家都经历过：不知道每个版本改了什么、想回退只能靠猜、两个人同时改文件只能互相覆盖。版本控制正是为了解决这些问题：\n\n- 记录历史：每次提交都是一个存档点，谁在什么时候改了什么，一目了然\n- 随时回退：改坏了？一条命令回到任意存档点，不用翻回收站\n- 并行开发：分支让你和同事同时开发不同功能，互不干扰\n- 高效协作：多人改同一个项目，Git 能自动合并大部分改动，只把真正冲突的部分留给人判断\n\n哪怕是一个人写论文、写博客，版本控制也值得用——它的本质是给重要文件加上"时间机器"。',
        tips: ['不用等到团队协作才学 Git，单人项目就能受益', '"保存"和"提交"是两回事：保存是写到硬盘，提交是记录到历史']
      },
      {
        title: 'Git基本概念',
        content: '开始动手之前，先认识五个贯穿全课程的核心概念：\n\n工作区（Working Directory）：你正在编辑的文件夹，文件就躺在里面。\n\n暂存区（Staging Area / Index）：下次提交的"购物车"。改动先放进这里，攒齐了再一次性提交，让你能把相关改动组织成一个干净的提交。\n\n仓库（Repository）：项目的历史数据库，藏在目录下的 .git 文件夹里。提交后的快照永久保存在这里。\n\n提交（Commit）：一次快照，附带作者、时间、说明信息，并通过"父提交"指向前一次快照——整条历史就是这样串起来的链条。\n\n分支（Branch）：指向某个提交的可移动标签。默认分支通常叫 main。新建分支就像"从这里另开一条时间线"。\n\n三者协作流程：在工作区修改 → git add 放入暂存区 → git commit 记录为提交。这就是后面每一课反复出现的节奏。',
        codeExample: `# 三个区域与两条核心命令:
#
#  工作区  --git add-->  暂存区  --git commit-->  仓库（历史）
#  (你编辑)              (下次提交)             (永久快照)
#
# .git 文件夹就是仓库本体，删掉它 = 删除全部历史`,
        tips: ['"暂存区"是 Git 新手最大的困惑点，也是它比其他系统灵活的地方', '忘了也没关系，后面的课程会一遍遍实践这个流程']
      },
      {
        title: '课程怎么学',
        content: '这个平台的学习路径是"教程理解概念 → 练习形成肌肉记忆"：\n\n1. 每篇教程讲清楚"是什么、为什么"，命令都配了可直接复制的示例\n2. 每个关键操作都有配套的交互练习，在模拟终端里亲手敲一遍，平台会逐步校验你的操作\n3. "动画演示"页面用可视化的方式展示分支、合并、远程协作时仓库内部发生了什么\n4. 遇到忘了的命令，用自由沙盒随便试验——它是个不会弄坏任何东西的假仓库\n\n建议按左侧顺序学习，基础篇的每个练习都完成后再进入分支篇。准备好了就开始下一课吧！',
        tips: ['看懂 ≠ 会用，每个练习都值得亲手敲一遍', '练习里敲错完全没关系，出错信息本身就是最好的教材']
      }
    ]
  },
  {
    id: 'git-install',
    title: 'Git 安装与配置',
    description: '学习如何在不同操作系统上安装Git，并进行基本配置',
    category: 'basics',
    difficulty: '入门',
    duration: '15分钟',
    content: [
      {
        title: '安装Git',
        content: 'Git 支持所有主流操作系统。选择你的系统对应的安装方式：\n\nWindows：官网提供图形安装包，一路下一步即可。建议勾选"Git Bash Here"，你会得到一个好用的命令行环境。\n\nmacOS：推荐用 Homebrew 安装，方便后续升级。没有 Homebrew 的话，直接装官网 pkg 包也行。\n\nLinux：各发行版的包管理器里都有 Git，一条命令装完。\n\n安装完成后，打开终端输入 git --version 验证。',
        codeExample: `# Windows: 从官网下载安装包
# https://git-scm.com/download/win

# macOS: 使用Homebrew
brew install git

# Linux (Ubuntu/Debian):
sudo apt-get install git

# Linux (CentOS/RHEL):
sudo yum install git

# 验证安装
git --version
# 输出类似: git version 2.46.0`,
      },
      {
        title: '配置Git',
        content: 'Git 需要知道"这次提交是谁做的"——每次提交都会记录作者的用户名和邮箱。注意：这两个配置只是声明身份，不涉及任何密码或登录。\n\n配置分三个层级：--global 对当前用户的所有仓库生效（最常用）；--system 对整台机器生效（需要管理员权限）；不加参数则只对当前仓库生效，可以覆盖全局配置。\n\n团队协作的邮箱建议和 GitHub 账号保持一致，这样平台才能把提交关联到你的头像和贡献图表。',
        codeExample: `# 设置用户名（会显示在每个提交里）
git config --global user.name "Your Name"

# 设置邮箱（建议与 GitHub 账号一致）
git config --global user.email "your.email@example.com"

# 查看全部配置及其来源
git config --list --show-origin

# 单个仓库使用不同的身份（例如公司项目）
cd company-project
git config user.email "you@company.com"`,
        tips: ['--global 表示全局配置，对所有仓库生效', '提交记录里的作者信息一旦写入就很难改，第一次就配置对']
      },
      {
        title: '命令行的最小技能包',
        content: '这个平台以命令行为主要操作方式。你只需要掌握下面几条终端命令就能顺畅完成所有课程：\n\ncd 目录名：进入某个目录；cd .. 返回上一级\nls（Windows 用 dir）：列出当前目录的文件\nclear（Windows 用 cls）：清屏\n上下方向键：翻出之前输入过的命令，改一改重用\nTab 键：输入文件名前几个字母后按 Tab 自动补全\n\n另外两条心法：命令和参数之间要有空格；包含空格的参数要用引号包起来（比如提交信息）。遇到报错先看提示说了什么——Git 的错误信息通常都很具体。',
        codeExample: `# 一段典型的终端操作
cd projects           # 进入 projects 目录
mkdir demo && cd demo # 新建并进入 demo 目录
git init              # 把这个目录变成 Git 仓库
ls -a                 # -a 显示隐藏文件，能看到 .git/`,
        tips: ['终端就是"用打字代替点鼠标"来操作电脑， Git 是它的最佳拍档', '本平台的模拟终端里只能使用 git 命令，真实终端里这些辅助命令都能用']
      }
    ]
  },
  {
    id: 'git-init',
    title: '创建仓库',
    description: '学习如何创建新的Git仓库或克隆现有仓库',
    category: 'basics',
    difficulty: '入门',
    duration: '10分钟',
    relatedPracticeIds: ['git-init', 'git-clone'],
    content: [
      {
        title: '初始化新仓库',
        content: '把一个普通文件夹变成 Git 仓库，只需要在里面执行 git init。\n\n它会创建一个隐藏的 .git 文件夹——这就是仓库本体，所有的历史、配置、分支信息都存在里面。工作区里的其他文件不受任何影响，git init 只是"从现在开始记录"。\n\n两个常见疑问：\n1. 子文件夹能再 git init 吗？可以，但会变成独立仓库，通常不这么做。\n2. 不想要版本控制了？删掉 .git 文件夹即可，项目文件毫发无损。',
        codeExample: `# 创建项目目录
mkdir my-project
cd my-project

# 初始化Git仓库
git init
# 输出: Initialized empty Git repository in .../my-project/.git/

# 看看初始化后发生了什么
ls -a
# .  ..  .git/`,
        tips: ['git init 会在当前目录创建 .git 隐藏文件夹', '这个文件夹包含了所有的版本控制信息，删掉它等于"注销"仓库']
      },
      {
        title: '克隆现有仓库',
        content: 'git clone 把远程服务器上的整个仓库（包括全部提交历史）复制到本地，是参与已有项目的第一步。\n\nclone 和 init 的区别：init 是"从零开始一个新仓库"；clone 是"复制一份现成的仓库"，并且会自动配置好名为 origin 的远程地址，之后可以直接 push/pull。\n\nURL 可以是 https（适合公开项目、配 token 推送）或 SSH 格式（git@github.com:user/repo.git，配置过密钥后免密推送）。',
        codeExample: `# 克隆仓库
git clone https://github.com/user/repo.git

# 克隆到指定目录
git clone https://github.com/user/repo.git my-folder

# SSH 方式（推送时免输密码）
git clone git@github.com:user/repo.git

# 克隆后自动配置好远程仓库
cd repo
git remote -v
# origin  https://github.com/user/repo.git (fetch)
# origin  https://github.com/user/repo.git (push)`,
        tips: ['clone 下来的是完整仓库，断网也能看全部历史', 'clone 会自动设置 origin 远程，init 的仓库则需要手动 git remote add']
      },
      {
        title: '什么该被版本控制？.gitignore',
        content: '不是所有文件都该进历史。编译产物、依赖包、日志、含密码的配置——这些应该被忽略。\n\n在仓库根目录创建 .gitignore 文件，一行一条规则，Git 就不会追踪匹配的文件。这个文件本身应该提交到仓库里，让全团队共享同一套忽略规则。\n\n判断口诀：源代码要提交；能从源代码重新生成的东西不提交；本机环境、密钥坚决不提交。',
        codeExample: `# .gitignore 示例
node_modules/     # 依赖包，npm install 能重新生成
dist/             # 构建产物
*.log             # 所有日志文件
.env              # 环境变量，可能含密钥
.DS_Store         # macOS 的系统文件

# 反向技巧: 忽略所有 .log 但保留 important.log
*.log
!important.log`,
        tips: ['已被追踪的文件不受 .gitignore 影响，需要先 git rm --cached', 'GitHub 维护了各语言的 .gitignore 模板库，搜 github/gitignore']
      }
    ]
  },
  {
    id: 'git-commit',
    title: '提交修改',
    description: '学习如何添加文件到暂存区并提交修改',
    category: 'basics',
    difficulty: '入门',
    duration: '15分钟',
    relatedPracticeIds: ['git-status', 'git-add', 'git-commit', 'git-log'],
    content: [
      {
        title: '查看状态',
        content: 'git status 是使用频率最高的命令——它会告诉你当前在哪个分支、哪些文件改了、哪些在暂存区、下一步该做什么。\n\n养成"先 status 再动手"的习惯，能避免 90% 的误操作。输出分三段：已暂存的更改（会进入下次提交）、未暂存的更改（改了但没 add）、未跟踪的文件（Git 还不认识的新文件）。\n\n-s 显示短格式：第一列是暂存区状态，第二列是工作区状态，A=新增 M=修改 ??=未跟踪。熟练后看两个字母比读长句子快得多。',
        codeExample: `# 完整格式，带操作提示
git status

# 短格式：两列状态 + 文件名
git status -s
# M  index.html      ← 已暂存的修改
#  M style.css       ← 未暂存的修改
# ?? notes.txt       ← 未跟踪的新文件`,
        tips: ['status 从不修改任何东西，随便敲，当"探路灯"用', '提交前先 status，确认没有把无关文件带进去']
      },
      {
        title: '添加到暂存区',
        content: '暂存区（staging area）是 Git 特有的设计：它像一张"下次提交的清单"，让你精确控制每个提交里包含什么。\n\n为什么要多这一步？假设你改了两个不相关的功能，想把它们分成两个干净的提交——用 git add <file> 分别暂存，分两次提交即可。没有暂存区的系统只能整个项目一起提交。\n\ngit add 的对象可以是具体文件、目录、通配符，git add . 表示当前目录下所有改动。改完又后悔不提交了？git restore --staged <file> 把它移出清单。',
        codeExample: `# 添加单个文件
git add filename.txt

# 添加多个文件
git add file1.txt file2.txt

# 添加所有修改（最常用）
git add .

# 只把部分改动放进提交: 先加A提交，再加B提交
git add a.js && git commit -m "feat: A"
git add b.js && git commit -m "feat: B"

# 把文件移出暂存区（改动保留在工作区）
git restore --staged filename.txt`,
        tips: ['git add . 前先 git status 扫一眼，防止把垃圾文件加进来', '提交的原子性：一个提交只做一件事，靠暂存区实现']
      },
      {
        title: '提交修改',
        content: 'git commit 把暂存区的内容永久记录为一个快照。每个提交都有唯一 ID（哈希值）、作者、时间戳和提交信息。\n\n提交信息是写给三个月后的自己（和队友）看的。-m 直接在命令行里写信息；不加 -m 会打开编辑器写多行信息。好的提交信息说清楚"为什么改"，而不是复述"改了什么文件"——diff 自己会说话。\n\n另外 -a 是快捷方式：自动把所有已跟踪文件的修改暂存并提交（新文件仍然需要手动 add）。',
        codeExample: `# 提交并添加消息
git commit -m "Add new feature"

# 添加并提交（跳过 add，仅限已跟踪文件）
git commit -am "Update feature"

# 好的提交信息 vs 差的:
# ✗ "修改了一些文件"
# ✓ "fix: 修复登录页在移动端按钮溢出的问题"
# ✓ "feat: 新增导出 PDF 功能"

# 查看提交历史确认结果
git log --oneline`,
        tips: ['提交信息用现在时祈使句："fix xx" 而不是 "fixed xx"', '提交是快照不是差异——Git 存储的效率远比你想象的高']
      },
      {
        title: '查看提交历史',
        content: 'git log 展示当前分支的提交历史，默认从最新开始逐条显示完整信息。日常开发用得最多的是组合参数：\n\n--oneline：每个提交压缩成一行（哈希前7位 + 信息）\n--graph：用 ASCII 字符画出分支/合并的拓扑结构\n--all：显示所有分支的历史，不只是当前的\n\n三者组合 git log --oneline --graph --all 是查看仓库全貌的"全景镜头"。还能用 --author 过滤作者、-p 查看每次提交的具体改动、<path> 只看某个文件的历史。',
        codeExample: `# 完整历史（按 q 退出）
git log

# 单行 + 图形 + 所有分支（最常用组合）
git log --oneline --graph --all
# * f3a2b1c (HEAD -> main) feat: add search
# * 9c8d7e6 fix: navbar overflow
# |\\
# | * 1a2b3c4 (feature-login) wip: form
# |/
# * 5e6f7g8 initial commit

# 只看某个文件的修改历史
git log --oneline -- src/app/page.tsx`,
        tips: ['--graph 是理解分支合并的最好帮手，和动画页对照着看', '哈希前 7 位就足以唯一定位一个提交']
      }
    ]
  },
  {
    id: 'git-branch',
    title: '分支管理',
    description: '学习如何创建、切换和合并分支',
    category: 'intermediate',
    difficulty: '进阶',
    duration: '20分钟',
    relatedPracticeIds: ['create-branch', 'merge-branch'],
    content: [
      {
        title: '什么是分支？为什么要用它？',
        content: '分支的本质非常轻量：它只是指向某个提交的 41 字节文本文件——一个可移动的标签。创建分支几乎是零成本的，这正是 Git 与其他系统拉开差距的地方。\n\n为什么开发要用分支？在 main 上直接开发意味着：写一半的功能别人也会看到、想试试一个疯狂的想法会把主线弄乱、多人同时改动互相踩脚。分支让每条开发线互相隔离：feature 分支上随便折腾，稳定的主线始终可发布。\n\n典型节奏：从 main 拉出功能分支 → 在分支上开发提交 → 开发完合并回 main → 删除功能分支。这就是下一节合并要讲的内容。',
        codeExample: `# 分支不是"文件夹的复制"，而是指向提交的指针:
#
#           ┌─ C2 ── C4  (feature)
#  C1 ── C2?          ↑
#           └─ C3      (main)
#  新提交后，所在分支的指针向前移动`,
        tips: ['创建分支前后磁盘内容完全相同，别担心"复制整个项目"', '分支名建议用英文+短横线：feature-login、fix-header-padding']
      },
      {
        title: '创建分支',
        content: 'git branch 创建分支，git checkout 或 git switch 切换到分支，后者还能一步完成"创建并切换"。\n\n推荐使用新语法 git switch：它只负责切换分支这一件事，语义清晰不易误操作；老教程里的 checkout 是个"多面手"，既能切分支又能丢弃修改，新手容易搞混。两套语法在本平台沙盒里都支持。',
        codeExample: `# 创建新分支（只创建，不切换）
git branch feature-login

# 创建并切换到新分支（老语法）
git checkout -b feature-login

# 创建并切换到新分支（新语法，推荐）
git switch -c feature-login

# 查看分支，当前分支带 * 号
git branch
# * feature-login
#   main`,
      },
      {
        title: '切换分支',
        content: '切换分支时，Git 会把工作区的文件更新成目标分支指向的快照。你在这个分支上的新提交，只会记录在这条分支上。\n\n一个重要规则：切换前工作区最好保持干净。如果有未提交的修改，Git 会尝试带着它们一起切换，可能成功也可能拒绝——与其碰运气，不如先提交或先 stash（后面的课程会讲）。\n\nHEAD 是"你当前在哪个分支/提交上"的指针，git branch 输出里带 * 号的就是它。',
        codeExample: `# 切换到已有分支（两种写法等价）
git checkout main
git switch main

# 查看所有分支，* 标记当前位置
git branch -a

# 查看 HEAD 移动轨迹（后悔药，后面细讲）
git reflog`,
        tips: ['切换分支后文件内容会变，编辑器里的未保存文件要先处理', '分支之间的提交是隔离的：在 feature 上的提交不会出现在 main']
      },
      {
        title: '合并分支',
        content: '功能开发完，把分支上的成果"搬回"主线，这就是合并（merge）。注意方向：先切换到"要去"的分支（通常是 main），再把功能分支"合进来"。\n\n合并分两种情况：\n1. 快进（fast-forward）：main 在分叉后没有新提交，只需把 main 指针向前挪，历史仍是一条直线；\n2. 真合并：两边都有新提交，Git 会创建一个有两个父提交的合并提交（merge commit），把两条线汇成一股。\n\n如果两边改了同一行代码，Git 无法替你做决定，就会产生冲突——这不是出错，而是 Git 在说"这里需要人来拍板"。冲突处理的完整流程在"实战场景"的动画和后续课程中详细展开。',
        codeExample: `# 1. 先切换到目标分支
git switch main

# 2. 把feature分支合并进当前分支
git merge feature-login
# 输出可能是:
#   Fast-forward          ← 快进合并
#   Merge made by 'ort'   ← 真合并，产生合并提交

# 3. 合并完，删除已合并的分支（-d 会检查是否已合并，安全）
git branch -d feature-login`,
        tips: ['合并前确保目标分支是最新的', 'git branch -d 是安全删除，未合并的分支要用大写 -D 强删（想清楚再按）']
      }
    ]
  },
  {
    id: 'git-remote',
    title: '远程仓库操作',
    description: '学习如何与远程仓库进行交互',
    category: 'intermediate',
    difficulty: '进阶',
    duration: '20分钟',
    relatedPracticeIds: ['push-feature', 'pull-teammate-changes', 'push-rejected-recovery'],
    content: [
      {
        title: '远程仓库是什么',
        content: '远程仓库（remote）是托管在服务器上（GitHub、Gitee、公司 GitLab）的仓库副本，它是团队成员交换提交的"中转站"。\n\n关键认知：本地仓库和远程仓库是平等的复制关系，不是主从关系。你 push 是"把我的新提交上传给你"，pull 是"把你的新提交下载给我"，谁也不覆盖谁的历史。\n\norigin 不是命令也不是关键字，只是 clone 时 Git 给远程仓库起的默认名字（约定俗成）。一个仓库可以有多个远程——比如同时配 GitHub 和 Gitee。',
        codeExample: `# 查看远程仓库（-v 显示读写地址）
git remote -v

# 添加远程仓库，命名为 origin
git remote add origin https://github.com/user/repo.git

# 修改远程仓库URL
git remote set-url origin https://github.com/user/new-repo.git

# 删除远程配置（只是断开关联，不影响远程数据）
git remote remove origin`,
      },
      {
        title: '推送和拉取',
        content: '四个日常命令撑起所有远程交互：\n\npush：上传本地新提交。首次推送新分支时加 -u，建立本地分支与远程分支的跟踪关系，之后就能裸敲 git push/git pull 了。\n\nfetch：下载远程的新提交，但只更新"远程分支的本地镜像"（origin/main 这类引用），不动你的工作区——先看清远程发生了什么，再决定怎么整合，这是安全的做法。\n\npull = fetch + merge：下载并直接合并进当前分支，适合确定要同步的日常场景。\n\n推送被拒（non-fast-forward）说明远程有你本地没有的提交——先 pull 整合再重新推。完整处理流程见本课配套练习《推送被拒后的自救》。',
        codeExample: `# 推送到远程
git push origin main

# 首次推送并设置上游（-u 建立跟踪关系）
git push -u origin main

# 拉取远程更新（下载+合并一步到位）
git pull origin main

# 只下载不合并，先看看远程发生了什么
git fetch origin
git log main..origin/main --oneline   # 查看远程领先了哪些提交`,
        tips: ['push 前先 pull 是团队协作的好习惯，能把冲突消灭在本地', '被拒不可怕，可怕的是用 --force 强推——那会抹掉队友的提交']
      },
      {
        title: '分支的推送与跟踪',
        content: '本地创建的分支默认只有你自己知道，必须推送到远程队友才能看到。推送后远程会创建同名分支，并建立双向跟踪关系。\n\n跟踪关系（upstream）建立了本地分支和远程分支的对应：git status 能告诉你"领先/落后几个提交"；裸敲 git pull 不带参数也知道该拉谁。\n\n查看远程分支用 git branch -a，输出里 remotes/origin/xxx 开头的就是远程分支的本地镜像——它们只在 fetch 时更新，所以有时会"过时"。',
        codeExample: `# 推送新分支并建立跟踪（第一次）
git push -u origin feature-login

# 之后就可以简写
git push
git pull

# 查看所有分支，含远程分支镜像
git branch -a
# * main
#   feature-login
#   remotes/origin/main
#   remotes/origin/feature-login

# 查看跟踪关系和领先落后情况
git status -sb`,
        tips: ['删除远程分支：git push origin --delete feature-login', ' origin/main 只是镜像，fetch 前它不会自动更新']
      }
    ]
  },
  {
    id: 'git-collaboration',
    title: '多人协作',
    description: '学习如何与队友协作开发：Fork、Pull Request、代码审查和推送冲突的处理',
    category: 'intermediate',
    difficulty: '进阶',
    duration: '25分钟',
    relatedPracticeIds: ['push-feature', 'pull-teammate-changes', 'push-rejected-recovery'],
    content: [
      {
        title: '克隆与 Fork 的区别',
        content: '和他人协作的前提是把代码放到一个大家都能访问的地方（如 GitHub），然后各自复制一份：\n\n- Clone（克隆）：把远程仓库复制到本地。如果你对仓库有写权限，克隆下来就能直接推送。\n- Fork（复刻）：在 GitHub 上把别人的仓库复制一份到你自己的账号下。你没有原仓库的写权限时（参与开源项目），先 Fork，再克隆你自己的那份。',
        codeExample: `# 有写权限：直接克隆团队仓库
git clone https://github.com/team/project.git

# 没有写权限：先在 GitHub 页面上点 Fork
# 然后克隆你自己账号下的副本
git clone https://github.com/you/project.git

# 给自己的副本配置上游，方便以后同步原仓库
git remote add upstream https://github.com/team/project.git
git remote -v`,
        tips: ['Fork 是"服务器端的复制"，Clone 是"复制到本地"', 'Fork 别人的仓库后，记得用 upstream 指向原仓库，方便同步更新']
      },
      {
        title: '功能分支工作流（GitHub Flow）',
        content: '多人共用一个仓库时，最常见的约定是：谁也不要直接往 main 上提交，每个功能、每个修复都走自己的分支，完成后通过 Pull Request 合并：\n\n1. 从最新的 main 拉出功能分支\n2. 在分支上开发并提交\n3. 推送分支到远程\n4. 发起 Pull Request\n5. 队友审查（Review）通过后合并\n6. 删除功能分支',
        codeExample: `# 1. 从最新 main 拉出功能分支
git switch main
git pull origin main
git switch -c feature-search

# 2. 开发并提交（可多次）
git add .
git commit -m "feat: add search box"

# 3. 推送到远程并建立跟踪
git push -u origin feature-search

# 4. 打开 GitHub 仓库页面，点击
#    "Compare & pull request" 发起 PR`,
        tips: ['分支命名带上功能说明，如 feature-search、fix-login-bug', 'PR 保持小而聚焦，审查起来快，合并也快']
      },
      {
        title: 'Pull Request 与代码审查',
        content: 'Pull Request（PR）是"请求对方拉取并合并你的分支"，它把代码审查变成了协作的核心环节：\n\n- 审查者逐行评论，提出修改建议\n- 你根据意见继续提交，PR 会自动更新\n- 审查通过后由维护者合并：可以保留 merge commit，也可以 squash 压成一个提交\n- 合并后删除功能分支，保持仓库整洁',
        codeExample: `# 根据审查意见修改后，推送到同一个分支即可
git add .
git commit -m "refactor: address review comments"
git push

# PR 会自动包含新提交，不需要重新发起

# 如果希望 PR 历史更干净，可以整理后再推
git rebase -i main
git push --force-with-lease origin feature-search`,
        tips: ['改写已推送的历史要用 --force-with-lease，且只限自己的功能分支', '公共分支（main）永远不要 force push']
      },
      {
        title: '和队友同步：推送冲突的处理',
        content: '多人同时往同一个分支推送时，Git 会拒绝"会覆盖别人工作"的推送（non-fast-forward）。标准处理流程是：先 fetch 看清楚远程发生了什么，再 pull 整合，最后重新推送：',
        codeExample: `# 你的推送被拒绝了
git push origin main
# ! [rejected] main -> main (non-fast-forward)
# hint: 远程包含你本地还没有的工作

# 1. 先获取远程更新，看看队友改了什么
git fetch origin
git log --oneline main..origin/main

# 2. 把远程工作整合进来（产生合并提交）
git pull origin main
# 如果有冲突：解决冲突 -> git add -> git commit

# 3. 现在本地已经包含队友的提交，重新推送
git push origin main`,
        tips: ['推送被拒不是错误，是 Git 在保护队友的工作', '日常养成 push 前先 pull 的习惯，能把冲突消灭在本地', '永远不要用 --force 推送共享分支来"绕过"拒绝']
      }
    ]
  },
  {
    id: 'git-rebase',
    title: '变基 (Rebase)',
    description: '学习使用 rebase 整理提交历史，让历史更加线性和清晰',
    category: 'advanced',
    difficulty: '高级',
    duration: '25分钟',
    relatedPracticeIds: ['rebase-branch', 'finish-feature-workflow', 'rebase-onto'],
    content: [
      {
        title: 'merge 与 rebase 的区别',
        content: 'merge 和 rebase 都能把一条分支的成果整合进另一条，区别在于"怎么记历史"：\n\nmerge 问的是"把两条线汇合"：创建一个合并提交，历史保留真实的分叉与汇合轨迹——像一张地图，忠实记录了"这里曾经并行开发过"。\n\nrebase 问的是"把我的提交重新放一遍"：把当前分支的提交摘下来，逐个"重放"到目标分支末尾，历史变成一条直线。原来的提交被新提交（D\'、E\'）替代——内容相同，ID 不同。\n\n选择口诀：本地未推送的提交随便 rebase；已经推送给别人的提交用 merge 或 rebase 自己的私有分支。公共分支（main）永远不要 rebase。',
        codeExample: `# 将当前分支变基到 main
git rebase main

# 变基前后的区别:
# merge:     A - B - C - M (main)
#                \\     /
#                  D - E (feature)
#
# rebase:    A - B - C - D' - E' (feature)
# 历史变直了，但 D'、E' 是新生成的提交`,
        tips: ['变基会改写提交历史，不要在公共分支上使用', '黄金法则：rebase 只动"自己的、未共享的"提交']
      },
      {
        title: '交互式变基',
        content: 'git rebase -i（--interactive）打开一个提交清单编辑器，让你对一段历史做"手术"：改信息、合并、删除、调换顺序。\n\n每行开头的命令决定该提交的命运：pick 原样保留；reword 保留内容但改提交信息；edit 停下来让你修改提交内容；squash 把它并进上一个提交并保留两条信息；fixup 同样合并但丢弃本条信息；drop 直接删除。\n\n最常用的场景："提交了 5 次琐碎的 wip，合并成 1 个干净的提交再发 PR"。',
        codeExample: `# 对最近3个提交进行交互式变基
git rebase -i HEAD~3

# 编辑器打开后（把想改的行前的 pick 换成目标命令）:
# pick   a1b2c3d feat: login form
# fixup  e4f5g6h wip
# reword i7j8k9l feat: validate input
# 保存关闭后 Git 自动执行

# 交互式变基的完整命令表:
# pick   保留该提交
# reword 修改提交信息
# edit   修改提交内容
# squash 合并到上一个提交（保留信息）
# fixup  合并到上一个提交（丢弃信息）
# drop   删除该提交`,
        tips: ['交互式变基是整理提交历史最强大的工具', '怕搞砸？先 git branch backup 存个备份分支再动手']
      },
      {
        title: '解决变基冲突',
        content: '重放提交时如果和目标分支改动冲突，rebase 会暂停，等你解决。\n\n流程三步走：打开冲突文件，删除 <<<<<<< / ======= / >>>>>>> 标记，保留正确的最终内容；git add 标记已解决；git rebase --continue 继续重放下一个提交。如果冲突太多想撤退，git rebase --abort 一步回到变基前，什么都没发生过。\n\n和 merge 冲突的区别：rebase 可能连续遇到冲突（每个重放的提交各一次）。用 rerere（本篇后面有课）让 Git 记住解决方案，可以自动解决重复冲突。',
        codeExample: `# 变基过程中遇到冲突
git rebase main
# CONFLICT (content): Merge conflict in app.js

# 冲突文件里的标记:
# <<<<<<< HEAD
# main 分支的版本
# =======
# 你正在重放的提交的版本
# >>>>>>> a1b2c3d

# 1. 编辑文件，删除标记，保留最终内容
# 2. 标记已解决
git add resolved-file.txt

# 3. 继续变基
git rebase --continue

# 中途后悔？全部撤销，回到变基前
git rebase --abort`,
        tips: ['冲突时用 git status 能列出所有未解决的文件', '--abort 是变基的后悔药，随时可用']
      }
    ]
  },
  {
    id: 'git-stash',
    title: '暂存 (Stash)',
    description: '学习使用 stash 临时保存工作区的修改，方便切换任务',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    relatedPracticeIds: ['stash-changes'],
    content: [
      {
        title: '什么时候需要 stash',
        content: '场景：你在 feature 分支上写到一半，线上突然报错要立刻修——但是工作区里一堆改了一半的文件，直接 switch 要么带着脏修改过去污染别的分支，要么被 Git 拒绝。提交吧，又不想留下"wip"这种垃圾历史。\n\nstash 就是解决这个的：把当前工作区和暂存区的修改"收起来"，工作区瞬间变干净，随便切分支干别的事；回来再 stash pop，改动原封不动地回来。\n\n注意 stash 和 commit 的本质区别：commit 进入永久历史，stash 只是临时柜——它不会出现在 git log 里，长期不取容易忘。收起来是应急，不是存档。',
        codeExample: `# 收起当前所有修改，工作区立即变干净
git stash

# 收起时给自己留个字条（强烈推荐）
git stash push -m "登录表单做到一半"

# stash 不影响已提交的内容，只收"未提交的改动"`,
        tips: ['stash 只保存已跟踪文件的修改', '切分支被拒绝时，先想想是"提交"还是"stash"——一个是存档一个是应急']
      },
      {
        title: '基本用法',
        content: 'stash 的日常操作就五个动作：收、看、取、留、丢。\n\npop 和 apply 的区别是唯一容易混的点：pop = 恢复 + 删除记录（取完就扔）；apply = 恢复但保留记录（适合同一段改动要在多个分支应用的场景）。恢复时如果和当前工作区冲突，Git 会拒绝并保留 stash 原样。',
        codeExample: `# 暂存当前修改
git stash

# 暂存并添加描述
git stash push -m "正在开发登录功能"

# 查看所有暂存（最新在 stash@{0}）
git stash list
# stash@{0}: On feature: 正在开发登录功能

# 恢复最近的暂存并删除记录
git stash pop

# 恢复暂存但不删除记录
git stash apply stash@{1}`,
        tips: ['pop 恢复失败时 stash 不会丢，先解决冲突再重试', 'stash 是栈结构：最后收起的在 stash@{0}']
      },
      {
        title: '进阶用法',
        content: 'stash 默认只收"已跟踪文件的修改"，两个参数扩展它的范围：-u 连未跟踪的新文件一起收；-a 连被 .gitignore 忽略的文件一起收（慎用，可能会收进大量构建产物）。\n\n还有几个救急场景：改动收起来之后又想直接在独立分支上继续做——stash branch 一条命令搞定；想看某条 stash 具体改了什么——stash show -p。stash list 长了之后，用完的记得 drop，离职清柜用 clear。',
        codeExample: `# 暂存包括未跟踪文件（新写的文件也能收）
git stash push -u -m "包含新文件"

# 暂存包括被忽略的文件
git stash push -a

# 查看暂存的具体内容
git stash show -p stash@{0}

# 从指定暂存创建分支（改动直接带到新分支上）
git stash branch new-branch stash@{0}

# 删除指定暂存
git stash drop stash@{0}

# 清空所有暂存
git stash clear`,
        tips: ['新文件收不进去是最常见的困惑，记住 -u', 'stash branch 适合"收起来后发现工程量不小，值得单开分支"']
      }
    ]
  },
  {
    id: 'git-cherry-pick',
    title: '挑选提交 (Cherry-pick)',
    description: '学习使用 cherry-pick 将特定提交应用到当前分支',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    relatedPracticeIds: ['cherry-pick-commit'],
    content: [
      {
        title: 'cherry-pick 解决什么问题',
        content: '场景：hotfix 分支上修了一个线上 bug，其中有 3 个提交，但只有第 2 个（真正的修复）需要立刻上到 release 分支。merge 会把整条分支带过去，这时候需要的是"只摘这一个提交"——樱桃挑选取名就是字面意思：从一串提交里只挑那颗想要的。\n\ncherry-pick 的本质是"复制提交"：把指定提交的改动在当前分支重新应用一遍，生成一个内容相同的新提交——注意 ID 是新的，因为它有了不同的父提交和不同时间。\n\n典型场景：热修复同步到多个版本线、把误提交到错误分支的提交搬回来、从别人的 PR 里只借用某个改动。',
        codeExample: `# 挑选单个提交
git cherry-pick abc1234

# 挑选多个连续提交（左开右闭）
git cherry-pick abc1234..def5678

# 挑选多个不连续的提交
git cherry-pick abc1234 def5678 ghi9012`,
        tips: ['cherry-pick 会创建新的提交，hash 值不同', '一个提交被搬运多次时做好记录，否则两条分支会出现"内容相同ID不同"的提交']
      },
      {
        title: '基本用法',
        content: '找到目标提交的哈希（git log 里前 7 位就够），切到要放它的分支，cherry-pick 摘过来。\n\n范围语法 abc1234..def5678 是"从 abc1234 之后到 def5678"，左端不包含在内；想包含左端用 ^abc1234 开头或 A^..B 写法。摘错人了？git cherry-pick --abort 退回原状（还在进行中时），或 cherry-pick -n 后手工调整。',
        codeExample: `# 实战: 把 hotfix 上的修复摘到 release
git switch release-v2
git cherry-pick 9f3e2d1
# [release-v2 8a1b2c3] fix: login redirect
# 哈希从 9f3e2d1 变成了 8a1b2c3 —— 内容相同的新提交

# 找哈希: 看 hotfix 分支最近的提交
git log hotfix --oneline -5

# 不自动提交，只应用修改到暂存区（想拆分或修改时用）
git cherry-pick --no-commit abc1234`,
        tips: ['适用于 hotfix 需要合并到多个分支的场景', '摘之前先确认当前分支正确——摘错了也要 --abort 清理']
      },
      {
        title: '处理冲突和选项',
        content: 'cherry-pick 本质是"重放改动"，和 merge/rebase 一样可能遇到冲突：目标分支上同一处代码被改过时，Git 停下来等你决定。\n\n处理流程与 rebase 完全一致：解决冲突 → git add → --continue；中途放弃用 --abort。区别在于 abort 的恢复点：rebase 回到变基前，cherry-pick 回到摘取前。\n\n一个小陷阱：连续摘多个提交时，中途冲突后解决完要 --continue 而不是重新执行命令——否则之前的进度会乱。',
        codeExample: `# 遇到冲突后
# 1. 解决冲突（编辑文件删除标记）
# 2. 添加文件
git add .

# 继续 cherry-pick
git cherry-pick --continue

# 放弃 cherry-pick，回到摘取前
git cherry-pick --abort

# 查看当前摘取进度（进行中时）
git status`,
        tips: ['--continue 和 --abort 是处理顺序提交族的通用口诀', '冲突频繁说明两条分支差异太大，考虑直接 merge']
      }
    ]
  },
  {
    id: 'git-reset',
    title: '重置 (Reset)',
    description: '学习使用 reset 撤销提交和修改，理解三种模式的区别',
    category: 'advanced',
    difficulty: '高级',
    duration: '20分钟',
    relatedPracticeIds: ['soft-reset', 'rework-last-commit', 'reflog-recovery'],
    content: [
      {
        title: 'reset 到底动了什么',
        content: '理解 reset 只需要理解"三条线"：HEAD（当前提交指针）、暂存区（下次提交清单）、工作区（你的文件）。\n\ngit reset <commit> 做的事是"把当前分支的指针（连同 HEAD）挪到 <commit>"——注意是挪指针，不是删提交。被挪"过头"的提交从此不在分支历史上，但对象还在数据库里（reflog 能找回）。\n\n三种模式决定除了 HEAD 之外还"重置"什么：--soft 只动 HEAD，你的暂存和工作区原封不动；--mixed（默认）顺带重置暂存区，改动退回工作区；--hard 三条线全部对齐目标提交，未提交的改动直接抹掉——这是唯一真正危险的选项。',
        codeExample: `# --soft: 只动 HEAD（提交没了，改动还在暂存区）
git reset --soft HEAD~1

# --mixed (默认): 动 HEAD + 重置暂存区（改动退回工作区）
git reset HEAD~1

# --hard: 三条线全对齐（未提交改动一并消失，危险！）
git reset --hard HEAD~1`,
        tips: ['三种模式按"破坏力"排序：soft < mixed < hard', 'hard 之后后悔？立刻看下一节 reflog']
      },
      {
        title: '常见场景',
        content: '把三种模式映射到真实需求：\n\n提交信息写错了/想拆开重提：--soft 撤回，改动完整回到暂存区，重新组织提交。\n不小心 add 了不该加的文件：git reset <file>（等价 restore --staged），只把它移出暂存区。\n本地实验全不要了：--hard 回到某个提交，工作区一键回到干净状态。\n\n红线再强调一遍：--hard 和 reset 整个分支都是"改写历史"的操作，只对未推送的提交安全。已推送的提交想撤销，请用下一课的 revert。',
        codeExample: `# 撤销最近一次提交，保留修改在暂存区
git reset --soft HEAD~1

# 取消暂存的文件（改动还在工作区）
git reset HEAD file.txt

# 放弃本地所有未提交改动，回到远程最新状态
git fetch origin
git reset --hard origin/main

# 出事了？查看操作记录（可恢复误操作）
git reflog`,
        tips: ['--soft 最安全，适合重新组织提交', '--hard 会丢失所有修改，使用前务必 status 确认没有还要的改动']
      },
      {
        title: 'reset 的亲戚们：restore、checkout、revert',
        content: '围绕"撤销"这件事，Git 有一整个命令家族，新手最容易混。用"撤销的对象"来分类就清晰了：\n\nreset 撤销的是"分支历史"——移动分支指针，可以带提交一起消失。restore（新语法）只处理文件：restore <file> 丢弃工作区改动，restore --staged <file> 把文件移出暂存区，不会动历史。checkout 是老多面手，切分支和丢弃修改都用它，正因职责混杂才被拆成 switch 和 restore 两个新命令。revert 用新提交抵消旧提交，唯一对已推送提交安全的选项。\n\n一句话决策：撤销未推送的提交用 reset；丢弃文件改动用 restore；撤销已推送的提交用 revert。',
        codeExample: `# 家族分工速查:
#
# 改动还在工作区,想丢弃:
git restore file.txt
# add 错了,想移出暂存区:
git restore --staged file.txt
# 未推送的提交想撤回:
git reset --soft HEAD~1
# 已推送的提交想撤销:
git revert abc1234`,
        tips: ['新项目优先用 switch/restore，职责单一不易误操作', 'checkout 在老教程里无处不在，认得它但不必再用它']
      }
    ]
  },
  {
    id: 'git-revert',
    title: '还原提交 (Revert)',
    description: '学习使用 revert 安全地撤销已发布的提交',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    relatedPracticeIds: ['revert-commit'],
    content: [
      {
        title: 'Revert vs Reset',
        content: 'reset 靠"挪指针"撤销提交，历史被改写——提交从分支上消失。这在本地区分安全，一旦提交已经推送到远程，别人可能已经基于它开发，改写历史会造成混乱甚至丢代码。\n\nrevert 的思路完全不同：不改历史，而是"向前补救"——计算目标提交的逆改动，作为一个新提交追加到历史末尾。旧提交还在，但它的效果被新提交抵消了。\n\n选择口诀：未推送的本地提交 → reset（历史干净）；已推送/公共分支上的提交 → revert（历史安全）。',
        codeExample: `# reset: 移动 HEAD 指针，改写历史
# 适合本地未推送的提交

# revert: 创建新提交来撤销修改
# 适合已推送到远程的提交（不改写历史）

# 还原最近一次提交
git revert HEAD

# 还原指定提交
git revert abc1234

# 还原多个提交
git revert HEAD~3..HEAD`,
        tips: ['公共分支上应该用 revert 而不是 reset', 'revert 产生的是一个新提交，不会破坏历史']
      },
      {
        title: 'revert 的使用细节',
        content: 'revert 会立即打开编辑器让你确认提交信息（默认 Revert "原信息"），这是给你留一次反悔的机会——直接关闭编辑器就按默认执行。\n\n两个常见问题：1）还原的改动和当前代码冲突——说明后面的提交动过同一处，按冲突流程解决即可；2）只想撤销某个提交里的部分文件——用 --no-commit 先不提交，手工调整后自己 commit。\n\n有冲突时同样是"解决 → add → --continue"三连，放弃用 --abort，和其他顺序操作族一致。',
        codeExample: `# 默认行为: 生成 Revert 提交并立即打开编辑器
git revert abc1234

# 多个提交一次性还原
git revert HEAD~3..HEAD --no-edit

# 只还原不提交，检查后再自己提交
git revert --no-commit abc1234

# 冲突时的标准三连
git add . && git revert --continue
git revert --abort   # 全部撤销`,
        tips: ['--no-edit 跳过编辑器，适合批量还原', 'revert 可以嵌套：revert 一个 revert = 恢复原改动']
      },
      {
        title: '还原合并提交',
        content: '还原合并提交（merge commit）有个特殊问题：它有两个父提交，"撤销它"意味着要回到其中一条线上，Git 不知道你选哪条，所以必须用 -m 指定 parent 编号。\n\n-m 1 表示保留第一个父提交（合并时你所在的分支，通常是 main）那侧的历史，撤销另一侧带来的所有改动。\n\n最大的坑在这里：如果之后你重新 merge 同一条分支，Git 会认为"这些改动已经在历史里了"（revert 提交还在），直接跳过——合并结果和你的预期不符。正确做法是先 revert 那个 revert，再重新合并。',
        codeExample: `# 查看合并提交的 parent
git log --oneline -1 merge-commit-hash
# commit a1b2c3d
# Merge: 9f8e7d6 5e4d3c2   ← 第一个是 parent 1（主线），第二个是 parent 2

# 还原合并提交（-m 1 = 保留主线一侧）
git revert -m 1 merge-commit-hash

# 之后重新合并该分支前，先撤销之前的 revert
git revert previous-revert-hash
git merge feature-branch`,
        tips: ['-m 1 是 99% 场景的答案：保留你合并时所在的主线', '"revert 完再 merge 不生效"是 merge 提交还原的头号陷阱']
      }
    ]
  },
  {
    id: 'git-bisect',
    title: '二分查找 (Bisect)',
    description: '学习使用 bisect 快速定位引入 Bug 的提交',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    content: [
      {
        title: 'bisect 解决什么问题',
        content: '场景：测试报告"搜索功能坏了"，但你不知道从哪次提交开始坏的。最近 100 次提交，一次一次 checkout 回去测？最多要测 100 次。\n\nbisect 把这个问题变成二分查找：你只提供两个信息——"这个提交是好的"和"那个提交是坏的"，Git 自动检出中间的提交，你测完告诉它好坏，它继续对半缩圈。100 个提交只需约 7 次（2^7 = 128 > 100）就能锁定第一个坏提交。\n\n它对"回归 bug"（以前是好的，最近坏了）这类问题效果最好，前提是能明确回答"这个版本好不好"。',
        codeExample: `# bisect 的缩圈过程（100 个提交 → 7 步）:
#
# bad: HEAD ──────────────────┐
# good: v1.0 ───────────┐     │
#            Git 检出中间点 → 测 → 再对半 → ...
# 最终报告: "xxx 是第一个坏提交"`,
        tips: ['开始前确认两件事：一个明确坏的范围，一个明确好的版本', '问题必须在"每次测试"里都能给出确定的好坏答案']
      },
      {
        title: '基本用法',
        content: '完整流程五步：start 进入二分模式 → 标记 bad（通常是当前 HEAD）→ 标记 good（一个已知正常的版本，可以是 tag、哈希）→ 在 Git 检出的中间版本上测试并反复标记 good/bad → 找到后 reset 退出。\n\n每次标记后 Git 会立刻检出下一个待测点并告诉你"还剩几步"。结束后必须 git bisect reset——它会带你回到 bisect 前的分支，否则你会一直停留在历史中间的某个提交上。',
        codeExample: `# 开始二分查找
git bisect start

# 标记当前版本有 Bug
git bisect bad

# 标记已知正常的版本
git bisect good v1.0
# Bisecting: 17 revisions left to test

# Git 自动检出中间版本，测试后标记
git bisect good   # 这个版本正常
git bisect bad    # 这个版本有 Bug
# ... 直到输出: xxx is the first bad commit

# 结束后回到原来的分支
git bisect reset`,
        tips: ['bisect 可以自动测试：使用 git bisect run', '查到"第一个坏提交"后，结合该提交的信息就能定位原因']
      },
      {
        title: '自动二分查找',
        content: '如果项目有自动化测试，好坏判断可以让脚本代劳——git bisect run <命令> 会自动完成整个缩圈：命令退出码 0 记 good，非 0 记 bad（125 跳过该提交）。\n\n人肉测 7 次和脚本自动测 7 次的差别在于：后者你可以去泡杯咖啡。配合 CI 里已经维护好的测试套件，定位回归 bug 通常只需要几十秒。\n\n实用技巧：run 后面可以直接跟测试命令，比如 git bisect run npm test；找不到好边界时，先用 tag 或发布版本号作为 good 起点。',
        codeExample: `# 使用测试脚本自动查找
# 脚本返回 0 表示 good，非 0 表示 bad
git bisect start
git bisect bad HEAD
git bisect good v1.0
git bisect run npm test
# Git 自动完成全部缩圈，输出第一个坏提交

# 示例 test-script.sh:
#!/bin/bash
make && ./run-tests
# exit 0 = good, exit 1 = bad`,
        tips: ['有测试套件的项目，bisect run 几乎零人工参与', '退出码 125 表示"此提交无法测试"，Git 会跳过它']
      }
    ]
  },
  {
    id: 'git-reflog',
    title: '引用日志 (Reflog)',
    description: '学习使用 reflog 找回丢失的提交和恢复误操作',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    relatedPracticeIds: ['view-reflog', 'reflog-recovery', 'detached-head-rescue'],
    content: [
      {
        title: '什么是 Reflog',
        content: 'git log 记录的是"提交历史"，git reflog 记录的是"你的操作历史"——每次 HEAD 移动（提交、切换、重置、合并……）都会在本地记一笔。\n\n它和 log 的本质区别：log 只显示"从当前提交能走到"的历史；reflog 显示"你去过的每一个地方"。reset --hard 丢弃的提交从 log 里消失了，但只要它出现在你的 reflog 里，就还能找回——这就是 Git 几乎不会真正丢数据的原因。\n\nHEAD@{n} 语法是"n 次 HEAD 移动之前的位置"：HEAD@{0} 是现在，HEAD@{1} 是上一步，以此类推。',
        codeExample: `# 查看引用日志
git reflog

# 输出示例（最新的在最上面）:
# a1b2c3d HEAD@{0}: reset: moving to HEAD~2
# def5678 HEAD@{1}: commit: 添加新功能
# ghi9012 HEAD@{2}: checkout: moving from main to feature

# 查看指定分支的引用日志
git reflog show main`,
        tips: ['reflog 是本地的，不会推送到远程', '默认保留 90 天的记录——找回动作别拖太久']
      },
      {
        title: '恢复误操作',
        content: 'reflog 的使用模式固定：出事后先 git reflog 找到"出事前"那条记录的哈希，然后用 reset --hard HEAD@{n} 回到那里，或 cherry-pick / 新建分支把提交捞回来。\n\n几个经典救援：reset --hard 丢弃了提交 → reflog 里还有它，reset 回去即可；分支删了没合并 → git reflog 找到分支最后的提交，checkout -b 重建；detached HEAD 里的实验提交想保留 → 在那个位置建分支（本课配套练习完整走一遍）。\n\n唯一救不回的情况：从未提交过的改动被 --hard 清掉（reflog 只记提交级操作，不记工作区）。所以重要改动尽早 commit。',
        codeExample: `# 恢复被 reset --hard 丢弃的提交
git reflog                        # 找到丢弃前的 HEAD@{1}
git reset --hard HEAD@{1}

# 恢复被删除的分支（找到它最后的提交）
git checkout -b recovered-branch abc1234

# 把丢失的提交直接摘到当前分支
git cherry-pick abc1234

# 查看某次操作时的状态
git show HEAD@{5}`,
        tips: ['reflog 是 Git 的"后悔药"，可以恢复几乎所有已提交的误操作', '先 git reflog 再说话——出事后第一步永远是看它']
      },
      {
        title: 'Detached HEAD 是什么',
        content: '正常情况下 HEAD 指向某个分支；当你 checkout 一个具体提交时，HEAD 直接指向提交本身，不挂在任何分支上——这就是 detached HEAD（分离头指针）。\n\n它不是错误状态，只是"时间旅行"：可以查看旧代码、跑旧版本做实验。危险在于：此时的新提交不属于任何分支，切回分支后它们会"悬空"——不处理最终会被 Git 回收。\n\n正确姿势：在 detached HEAD 里做了想保留的事，立刻用 git switch -c 新分支（或 checkout -b）把当前位置固定下来。本平台的《Detached HEAD 救援》练习让你完整经历一次。',
        codeExample: `# 切到旧提交，进入 detached HEAD
git checkout abc1234
# 提示: You are in 'detached HEAD' state...

# 此时提交不会属于任何分支!
git commit -m "experiment"    # 悬空提交

# 想保留? 立刻建分支固定住
git switch -c my-experiment

# 不想保留? 直接切回去，悬空提交最终被回收
git switch main`,
        tips: ['看到 detached HEAD 提示不用慌，先想清楚"要不要保留接下来的改动"', 'checkout 提交只用于查看和实验，开发请走分支']
      }
    ]
  },
  {
    id: 'git-submodule',
    title: '子模块 (Submodule)',
    description: '学习使用 submodule 在项目中管理外部仓库依赖',
    category: 'advanced',
    difficulty: '高级',
    duration: '25分钟',
    content: [
      {
        title: '添加子模块',
        content: '子模块允许你将一个 Git 仓库作为另一个仓库的子目录：',
        codeExample: `# 添加子模块到指定目录
git submodule add https://github.com/lib/lib.git vendor/lib

# 添加子模块到指定分支
git submodule add -b develop https://github.com/lib/lib.git vendor/lib

# 添加后会生成 .gitmodules 文件:
[submodule "vendor/lib"]
  path = vendor/lib
  url = https://github.com/lib/lib.git`,
        tips: ['子模块默认检出特定的 commit，而不是分支', '首次克隆含子模块的项目需要额外步骤']
      },
      {
        title: '克隆与初始化',
        content: '克隆包含子模块的项目：',
        codeExample: `# 方式一: 克隆后初始化子模块
git clone https://github.com/user/project.git
cd project
git submodule init
git submodule update

# 方式二: 一步完成（推荐）
git clone --recurse-submodules https://github.com/user/project.git

# 如果已经克隆了，更新所有子模块
git submodule update --init --recursive`,
      },
      {
        title: '更新子模块',
        content: '子模块的更新需要特殊处理：',
        codeExample: `# 拉取子模块的最新代码
cd vendor/lib
git pull origin main
cd ../..

# 回到主项目提交子模块的更新
git add vendor/lib
git commit -m "更新子模块 lib 到最新版本"

# 更新所有子模块到远程最新
git submodule update --remote

# 更新指定子模块
git submodule update --remote vendor/lib`,
      },
      {
        title: '常见问题',
        content: '处理子模块的常见场景：',
        codeExample: `# 删除子模块（Git 2.18+）
git rm vendor/lib

# 删除子模块（旧版本）
# 1. 删除 .gitmodules 中的条目
# 2. 删除 .git/config 中的条目
# 3. 删除目录和缓存
git rm --cached vendor/lib
rm -rf vendor/lib .git/modules/vendor/lib

# 查看子模块状态
git submodule status

# 在每个子模块中执行命令
git submodule foreach 'git status'`,
        tips: ['子模块坑很多，大型项目可考虑 git subtree 替代方案', 'CI/CD 中记得加 --recurse-submodules']
      }
    ]
  },
  {
    id: 'git-worktree',
    title: '工作树 (Worktree)',
    description: '学习使用 worktree 在多个目录中同时检出同一仓库的不同分支',
    category: 'advanced',
    difficulty: '高级',
    duration: '20分钟',
    content: [
      {
        title: '基本用法',
        content: 'worktree 允许你在同一仓库中同时维护多个工作目录，不需要切换分支：',
        codeExample: `# 创建新的工作树并检出指定分支
git worktree add ../hotfix hotfix-branch

# 创建新的工作树并创建新分支
git worktree add -b feature-auth ../auth main

# 创建一个 detached HEAD 的工作树
git worktree add --detach ../experiment HEAD~3

# 查看所有工作树
git worktree list`,
        tips: ['worktree 共享同一个 .git 目录', '适合同时在多个分支上工作而不需频繁 stash']
      },
      {
        title: '管理工作树',
        content: '管理和清理工作树：',
        codeExample: `# 删除工作树（会保留目录）
git worktree remove ../hotfix

# 清理已删除的工作树记录
git worktree prune

# 锁定工作树（防止被 prune 清理）
git worktree lock ../hotfix

# 解锁工作树
git worktree unlock ../hotfix`,
      },
      {
        title: '实际场景',
        content: 'worktree 的典型使用场景：',
        codeExample: `# 场景1: 修复紧急 bug 时不影响当前工作
git worktree add ../bugfix release-v2
cd ../bugfix
# 修复 bug 并提交
git commit -am "fix: 紧急修复登录问题"
# 回到主工作区继续开发
cd ../project

# 场景2: 同时查看和测试另一个分支
git worktree add ../review feature-branch
cd ../review && npm test
cd ../project

# 场景3: 在不同目录运行不同版本的应用
git worktree add ../v1-stable v1.0
git worktree add ../v2-beta v2.0`,
      }
    ]
  },
  {
    id: 'git-rebase-onto',
    title: 'Rebase --onto 与高级用法',
    description: '掌握 rebase --onto、--exec、squash 等高级变基技巧',
    category: 'advanced',
    difficulty: '高级',
    duration: '30分钟',
    relatedPracticeIds: ['rebase-onto'],
    content: [
      {
        title: 'rebase --onto',
        content: '--onto 可以指定将提交变基到任意目标，而不仅仅是当前分支的起点：',
        codeExample: `# 将 feature 分支基于 main 的提交移到 develop 上
# 语法: git rebase --onto <newbase> <oldbase> <branch>
git rebase --onto develop main feature

# 可视化:
# 之前:  main: A - B - C
#            feature: A - D - E (基于 main)
# 之后:  develop: A - B - C - X
#            feature: A - B - C - X - D' - E' (基于 develop)

# 只移除 feature 上基于 main 的部分提交
git rebase --onto main~3 main feature`,
        tips: ['--onto 是 rebase 最强大的用法', '可以用来"剪切"历史中的某段提交']
      },
      {
        title: '交互式变基进阶',
        content: '交互式变基的高级技巧：',
        codeExample: `# 对最近5个提交进行交互式变基
git rebase -i HEAD~5

# 编辑器中可以使用的命令:
# pick   保留提交
# reword 修改提交信息
# edit   暂停以修改提交内容
# squash 合并到上一个提交（保留两个消息）
# fixup  合并到上一个提交（丢弃本提交消息）
# exec   在该提交后执行命令
# break  暂停变基
# drop   删除提交

# 使用 exec 在每个提交后运行测试
git rebase -i --exec "npm test" HEAD~3`,
      },
      {
        title: '自动 squash',
        content: '将多个提交自动合并为一个：',
        codeExample: `# 自动 squash 最近3个提交（只保留第一个的消息）
git rebase -i --autosquash HEAD~3

# 使用 fixup! 前缀标记需要合并的提交
git commit --fixup=abc1234
# 然后 rebase 时会自动将 fixup 提交合并到目标提交

# 使用 squash! 前缀
git commit --squash=abc1234

# 合并后 rebase 时自动排序 fixup/squash 提交
git rebase -i --autosquash`,
        tips: ['fixup 比 squash 更常用，因为它丢弃琐碎提交的消息', '配合 --autosquash 可以在提交时就标记好合并关系']
      },
      {
        title: '变基策略与选项',
        content: 'rebase 的各种策略选项：',
        codeExample: `# 保留合并提交的结构
git rebase --rebase-merges main

# 空提交策略: 保留变基后的空提交
git rebase --keep-empty main

# 忽略空白差异
git rebase --ignore-whitespace main

# 使用指定的合并策略
git rebase -X ours main     # 冲突时保留当前分支
git rebase -X theirs main   # 冲突时保留目标分支

# 强制推送变基后的分支
git push --force-with-lease origin feature`,
        tips: ['--force-with-lease 比 --force 更安全', '--rebase-merges 保留原始的合并结构']
      }
    ]
  },
  {
    id: 'git-rerere',
    title: '冲突自动解决 (Rerere)',
    description: '学习使用 rerere 自动记住并复用冲突解决方案',
    category: 'advanced',
    difficulty: '高级',
    duration: '15分钟',
    content: [
      {
        title: '启用 Rerere',
        content: 'rerere (reuse recorded resolution) 会自动记录你解决冲突的方式，下次遇到相同冲突时自动解决：',
        codeExample: `# 全局启用 rerere
git config --global rerere.enabled true

# 当前仓库启用
git config rerere.enabled true

# 查看 rerere 缓存的冲突解决方案
git rerere status

# 查看具体的解决方案
git rerere diff`,
        tips: ['rerere 非常适合频繁 rebase 或 merge 的工作流', '解决方案保存在 .git/rr-cache/ 目录']
      },
      {
        title: '工作流程',
        content: 'rerere 的完整工作流程：',
        codeExample: `# 第一次遇到冲突:
git merge feature-branch
# CONFLICT ...

# 手动解决冲突并添加
vim conflict-file.txt
git add conflict-file.txt
git commit

# rerere 自动记录了这次解决方案

# 下次遇到相同冲突（如 rebase）:
git rebase main
# CONFLICT ...
# 自动解决！只需要:
git add conflict-file.txt
git rebase --continue
# rerere 自动应用了之前记录的方案`,
      },
      {
        title: '管理记录',
        content: '管理 rerere 的冲突记录：',
        codeExample: `# 查看所有记录的冲突
git rerere status

# 查看具体差异
git rerere diff

# 忘记某个文件的冲突记录
git rerere forget path/to/file

# 清理不再需要的记录
git rerere gc

# 查看缓存目录
ls .git/rr-cache/`,
        tips: ['如果 rerere 的自动解决方案不对，重新解决后会更新记录', '可以将 .git/rr-cache/ 加入备份']
      }
    ]
  }
];

export const tutorials: Tutorial[] = rawTutorials.map((tutorial) => ({
  relatedPracticeIds: [],
  ...tutorial,
}));

export function getTutorialById(id: string): Tutorial | undefined {
  return tutorials.find(t => t.id === id);
}

export function getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
  return tutorials.filter(t => t.category === category);
}

export function getTutorialsForPracticeTask(practiceId: string): Tutorial[] {
  return tutorials.filter((tutorial) =>
    tutorial.relatedPracticeIds.includes(practiceId)
  );
}
