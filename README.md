# Git Learning Platform 🚀

[![CI](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml/badge.svg)](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml)
[![Deploy](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/deploy.yml/badge.svg)](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/deploy.yml)

一个交互式的Git学习平台，通过动画演示和实战练习帮助用户更直观地理解Git版本控制的概念和操作。

> 中文 | [English](README.en.md)

## ✨ 特性

- 📚 **结构化教程** - 从入门到进阶的完整Git教程，包括分支管理与多人协作（Fork、Pull Request、代码审查）
- 🎮 **实战练习** - 交互式Git命令练习环境，模拟真实远程仓库：克隆、推送功能分支、同步队友更新、处理推送冲突
- 🥊 **合并冲突模拟** - 亲手体验冲突标记、做出取舍、完成合并——大多数交互式教程都没有这一课
- 👥 **虚拟队友** - 练习进行中队友会"突然"推送新提交，训练 push 前先 fetch 的肌肉记忆
- 🎬 **动画演示** - Git工作流程可视化动画，含"远程协作"场景演示 fetch → pull → push 同步闭环
- 📊 **学习统计** - GitHub 风格热力图、分主题掌握度、成就系统
- 🧩 **npm 包** - 核心模拟器已抽成零依赖包 [git-simulator-core](./packages/git-simulator)，可复用于任何教学工具
- 🌐 **开源免费** - MIT许可证，社区驱动，GitHub + Gitee 双平台

## 🛠️ 技术栈

- [Next.js 14](https://nextjs.org/) - React框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库

## 🚀 快速开始

### 环境要求

- Node.js 20.0 或更高版本
- npm 或 yarn

### 安装

```bash
# 从 GitHub 克隆
git clone https://github.com/StarrySea1412/git-learning-platform-.git git-learning-platform

# 或从 Gitee 克隆（国内访问更快）
git clone https://gitee.com/starry-sea-1412/git-learning-platform.git git-learning-platform

# 进入项目目录
cd git-learning-platform

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看网站。

## 📁 项目结构

```
git-learning-platform/
├── src/
│   ├── app/              # Next.js App Router页面
│   ├── components/       # React组件
│   ├── lib/              # 工具函数和数据
│   └── types/            # TypeScript类型定义
├── packages/
│   └── git-simulator/    # 独立 npm 包：零依赖 Git 模拟器核心
├── public/               # 静态资源
└── ...配置文件
```

## 📦 git-simulator-core

平台的 Git 模拟器已抽成独立的零依赖 npm 包（源码在 `packages/git-simulator`），
可直接安装用于自己的教学工具、沙盒或可视化项目：

```bash
npm install git-simulator-core
```

详见 [packages/git-simulator/README.md](./packages/git-simulator/README.md)。

## 🚢 部署

项目支持一键部署到 [Vercel](https://vercel.com)（免费）：

1. Fork 本仓库
2. 在 [vercel.com/new](https://vercel.com/new) 导入你的 Fork
3. 直接部署，零配置

仓库内置 GitHub Actions 自动部署流水线（`.github/workflows/deploy.yml`）。如需走自己的 CI 部署，在仓库 Settings → Secrets 添加 `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` 三个密钥（从 Vercel 项目设置获取），之后每次推送到 main 会自动部署。

## 🤝 贡献

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！
