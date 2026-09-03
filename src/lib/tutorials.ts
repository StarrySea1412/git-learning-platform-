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
        content: 'Git是一个分布式版本控制系统，由Linus Torvalds在2005年创建。它可以追踪文件的修改历史，让多人协作开发变得更加高效。',
        tips: ['Git是目前最流行的版本控制系统', '几乎所有的开源项目都使用Git进行管理']
      },
      {
        title: '为什么需要版本控制？',
        content: '版本控制可以帮助你：\n- 记录文件的修改历史\n- 回退到之前的版本\n- 多人协作开发\n- 创建分支进行功能开发',
      },
      {
        title: 'Git基本概念',
        content: '仓库(Repository)：存储项目文件和修改历史的地方\n提交(Commit)：保存修改的快照\n分支(Branch)：独立的开发线\n合并(Merge)：将分支的修改合并到一起',
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
        content: '根据你的操作系统选择合适的安装方式：',
        codeExample: `# Windows: 从官网下载安装包
# https://git-scm.com/download/win

# macOS: 使用Homebrew
brew install git

# Linux (Ubuntu/Debian):
sudo apt-get install git

# Linux (CentOS/RHEL):
sudo yum install git`,
      },
      {
        title: '配置Git',
        content: '安装完成后，需要配置你的用户名和邮箱：',
        codeExample: `# 设置用户名
git config --global user.name "Your Name"

# 设置邮箱
git config --global user.email "your.email@example.com"

# 查看配置
git config --list`,
        tips: ['--global 表示全局配置，对所有仓库生效', '也可以为单个仓库设置不同的配置']
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
        content: '在项目目录中创建新的Git仓库：',
        codeExample: `# 创建项目目录
mkdir my-project
cd my-project

# 初始化Git仓库
git init`,
        tips: ['git init 会在当前目录创建 .git 隐藏文件夹', '这个文件夹包含了所有的版本控制信息']
      },
      {
        title: '克隆现有仓库',
        content: '从远程服务器复制一个已有的仓库：',
        codeExample: `# 克隆仓库
git clone https://github.com/user/repo.git

# 克隆到指定目录
git clone https://github.com/user/repo.git my-folder`,
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
        content: '查看当前仓库的状态：',
        codeExample: `# 查看工作区状态
git status

# 简短格式
git status -s`,
      },
      {
        title: '添加到暂存区',
        content: '将修改的文件添加到暂存区：',
        codeExample: `# 添加单个文件
git add filename.txt

# 添加所有修改
git add .

# 添加所有.txt文件
git add *.txt`,
      },
      {
        title: '提交修改',
        content: '将暂存区的内容提交到仓库：',
        codeExample: `# 提交并添加消息
git commit -m "Add new feature"

# 添加并提交（已跟踪文件）
git commit -am "Update feature"`,
        tips: ['提交消息应该清晰描述本次修改的内容', '好的提交消息有助于团队协作']
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
        title: '创建分支',
        content: '分支让你可以在独立的开发线上工作：',
        codeExample: `# 创建新分支
git branch feature-login

# 创建并切换到新分支
git checkout -b feature-login

# 新语法（推荐）
git switch -c feature-login`,
      },
      {
        title: '切换分支',
        content: '在不同分支之间切换：',
        codeExample: `# 切换到已有分支
git checkout main
git switch main

# 查看所有分支
git branch -a`,
      },
      {
        title: '合并分支',
        content: '将分支的修改合并到当前分支：',
        codeExample: `# 切换到目标分支
git switch main

# 合并feature分支
git merge feature-login

# 删除已合并的分支
git branch -d feature-login`,
        tips: ['合并前确保目标分支是最新的', '解决冲突后再完成合并']
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
        title: '管理远程仓库',
        content: '查看和配置远程仓库：',
        codeExample: `# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin https://github.com/user/repo.git

# 修改远程仓库URL
git remote set-url origin https://github.com/user/new-repo.git`,
      },
      {
        title: '推送和拉取',
        content: '与远程仓库同步：',
        codeExample: `# 推送到远程
git push origin main

# 首次推送并设置上游
git push -u origin main

# 拉取远程更新
git pull origin main

# 获取远程更新（不合并）
git fetch origin`,
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
        title: '基本用法',
        content: '将当前分支的提交"移植"到目标分支的最新提交之后：',
        codeExample: `# 将当前分支变基到 main
git rebase main

# 变基前后的区别:
# merge:     A - B - C - M (main)
#                \\     /
#                  D - E (feature)
#
# rebase:    A - B - C - D' - E' (feature)`,
        tips: ['变基会改写提交历史，不要在公共分支上使用', '变基后原始的 D、E 提交会被丢弃，生成新的 D\'、E\'']
      },
      {
        title: '交互式变基',
        content: '交互式变基让你可以修改、合并、删除、重新排序提交：',
        codeExample: `# 对最近3个提交进行交互式变基
git rebase -i HEAD~3

# 交互式变基的命令:
# pick   保留该提交
# reword 修改提交信息
# edit   修改提交内容
# squash 合并到上一个提交
# drop   删除该提交`,
        tips: ['交互式变基是整理提交历史最强大的工具', '合并多个琐碎的提交可以让历史更清晰']
      },
      {
        title: '解决变基冲突',
        content: '变基过程中可能遇到冲突，需要手动解决：',
        codeExample: `# 变基过程中遇到冲突
git rebase main
# CONFLICT ...

# 1. 解决文件中的冲突标记
# 2. 添加解决后的文件
git add resolved-file.txt

# 3. 继续变基
git rebase --continue

# 放弃变基，回到原始状态
git rebase --abort`,
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
        title: '基本用法',
        content: '当你需要临时切换分支但又不想提交未完成的工作时：',
        codeExample: `# 暂存当前修改
git stash

# 暂存并添加描述
git stash push -m "正在开发登录功能"

# 查看所有暂存
git stash list

# 恢复最近的暂存并删除
git stash pop

# 恢复暂存但不删除
git stash apply`,
        tips: ['stash 只保存已跟踪文件的修改', '新文件需要加 -u 参数才会被暂存']
      },
      {
        title: '进阶用法',
        content: 'stash 还支持更多操作：',
        codeExample: `# 暂存包括未跟踪文件
git stash push -u -m "包含新文件"

# 暂存包括被忽略的文件
git stash push -a

# 查看暂存的具体内容
git stash show -p stash@{0}

# 从指定暂存创建分支
git stash branch new-branch stash@{0}

# 删除指定暂存
git stash drop stash@{0}

# 清空所有暂存
git stash clear`,
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
        title: '基本用法',
        content: 'cherry-pick 可以将某个分支上的特定提交复制到当前分支：',
        codeExample: `# 挑选单个提交
git cherry-pick abc1234

# 挑选多个连续提交
git cherry-pick abc1234..def5678

# 挑选多个不连续的提交
git cherry-pick abc1234 def5678 ghi9012`,
        tips: ['cherry-pick 会创建新的提交，hash 值不同', '适用于 hotfix 需要合并到多个分支的场景']
      },
      {
        title: '处理冲突和选项',
        content: 'cherry-pick 遇到冲突时的处理方式：',
        codeExample: `# 遇到冲突后
# 1. 解决冲突
# 2. 添加文件
git add .

# 继续 cherry-pick
git cherry-pick --continue

# 放弃 cherry-pick
git cherry-pick --abort

# 不自动提交，只应用修改到暂存区
git cherry-pick --no-commit abc1234`,
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
        title: '三种模式',
        content: 'git reset 有三种模式，区别在于对工作区和暂存区的影响：',
        codeExample: `# --soft: 只移动 HEAD，保留暂存区和工作区
git reset --soft HEAD~1

# --mixed (默认): 移动 HEAD，重置暂存区，保留工作区
git reset HEAD~1
git reset --mixed HEAD~1

# --hard: 移动 HEAD，重置暂存区和工作区（危险！）
git reset --hard HEAD~1`,
        tips: ['--soft 最安全，适合重新组织提交', '--hard 会丢失所有修改，使用前务必确认']
      },
      {
        title: '常见场景',
        content: 'reset 在实际开发中的常见用法：',
        codeExample: `# 撤销最近一次提交，保留修改在暂存区
git reset --soft HEAD~1

# 取消暂存的文件
git reset HEAD file.txt

# 回退到某个历史提交
git reset --hard abc1234

# 查看操作记录（可恢复误操作）
git reflog`,
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
        content: 'revert 和 reset 都能撤销提交，但方式不同：',
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
        title: '还原合并提交',
        content: '还原合并提交需要指定 parent 编号：',
        codeExample: `# 查看合并提交的 parent
git log --oneline -1 merge-commit-hash

# 还原合并提交（指定保留哪个 parent）
# -m 1 表示保留主分支的主线
git revert -m 1 merge-commit-hash

# 如果之后需要重新合并该分支
# 需要先还原之前的 revert 提交
git revert previous-revert-hash`,
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
        title: '基本用法',
        content: 'bisect 使用二分查找算法，快速定位哪个提交引入了 Bug：',
        codeExample: `# 开始二分查找
git bisect start

# 标记当前版本有 Bug
git bisect bad

# 标记已知正常的版本
git bisect good v1.0

# Git 会自动检出中间版本，测试后标记
git bisect good   # 这个版本正常
git bisect bad    # 这个版本有 Bug

# 重复以上过程直到找到第一个坏提交
# 结束后回到原来的分支
git bisect reset`,
        tips: ['bisect 可以自动测试：使用 git bisect run', '适合在大量提交中快速定位问题']
      },
      {
        title: '自动二分查找',
        content: '可以编写脚本让 bisect 自动运行：',
        codeExample: `# 使用测试脚本自动查找
# 脚本返回 0 表示 good，非 0 表示 bad
git bisect start
git bisect bad HEAD
git bisect good v1.0
git bisect run ./test-script.sh

# 示例 test-script.sh:
#!/bin/bash
make && ./run-tests
# exit 0 = good, exit 1 = bad`,
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
        content: 'reflog 记录了 HEAD 指针的所有移动，即使提交被 reset 或删除也能找回：',
        codeExample: `# 查看引用日志
git reflog

# 查看指定分支的引用日志
git reflog show main

# 输出示例:
# abc1234 HEAD@{0}: reset: moving to HEAD~2
# def5678 HEAD@{1}: commit: 添加新功能
# ghi9012 HEAD@{2}: checkout: moving from main to feature`,
        tips: ['reflog 是本地的，不会推送到远程', '默认保留 90 天的记录']
      },
      {
        title: '恢复误操作',
        content: 'reflog 是 Git 的"后悔药"，可以恢复几乎所有误操作：',
        codeExample: `# 恢复被 reset --hard 丢弃的提交
git reset --hard HEAD@{1}

# 恢复被删除的分支
git checkout -b recovered-branch abc1234

# 恢复被删除的提交
git cherry-pick abc1234

# 查看某次操作时的状态
git show HEAD@{5}`,
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
