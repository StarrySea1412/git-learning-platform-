# Git Learning Platform 🚀

[![CI](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml/badge.svg)](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/ci.yml)
[![Deploy](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/deploy.yml/badge.svg)](https://github.com/StarrySea1412/git-learning-platform-/actions/workflows/deploy.yml)

An interactive Git learning platform — understand how Git actually works through visual animations and hands-on practice in a simulated terminal.

> 中文 | [English](README.en.md)

## ✨ Features

- 📚 **Structured tutorials** — Complete Git curriculum from basics to advanced, including branching and team collaboration (Fork, Pull Request, code review)
- 🎮 **Interactive practice** — 30 hands-on exercises in a simulated terminal backed by a real remote-repository model: clone, push feature branches, sync with teammates, recover from rejected pushes
- 🥊 **Merge conflict simulation** — Experience conflict markers, weigh both sides, and resolve for real — a lesson most interactive tutorials skip
- 👥 **Virtual teammate** — Mid-exercise, your teammate "suddenly" pushes to origin/main, training the fetch-before-push reflex
- 🎬 **Visual animations** — Git workflow animations including a remote-collaboration scenario walking through the fetch → pull → push loop
- 📊 **Learning stats** — GitHub-style activity heatmap, per-topic mastery bars, achievements
- 🧩 **npm package** — The core simulator ships as a zero-dependency package, [git-simulator-core](./packages/git-simulator), reusable in any teaching tool
- 🌐 **Free & open source** — MIT license, mirrored on GitHub and Gitee

## Why another Git learning site?

Most interactive Git tutorials stop at branching. This platform goes further:

- A **two-repository model** (local + origin) that simulates teammates racing you to push — including realistic `non-fast-forward` rejections and the fetch → pull → push recovery loop
- A **file-content model** that makes merge conflicts actually happen, with conflict markers you inspect and resolve (`resolve-conflict ours|theirs|both`)
- **Chinese-first content** — the most complete native Chinese interactive Git curriculum, with English on the way

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/) — React framework
- [TypeScript](https://www.typescriptlang.org/) — type safety
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Framer Motion](https://www.framer.com/motion/) — animations

## 🚀 Getting Started

### Requirements

- Node.js 20.0+
- npm or yarn

### Install

```bash
# Clone from GitHub
git clone https://github.com/StarrySea1412/git-learning-platform-.git git-learning-platform

# Or from Gitee (faster in mainland China)
git clone https://gitee.com/starry-sea-1412/git-learning-platform.git git-learning-platform

cd git-learning-platform

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
git-learning-platform/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and content data
│   └── types/            # TypeScript types
├── packages/
│   └── git-simulator/    # Standalone npm package: zero-dependency Git simulator core
├── public/               # Static assets
└── ...config files
```

## 📦 git-simulator-core

The simulator behind this platform is extracted into a standalone zero-dependency npm package (source in `packages/git-simulator`). Use it in your own teaching tools, sandboxes, or visualizations:

```bash
npm install git-simulator-core
```

See [packages/git-simulator/README.md](./packages/git-simulator/README.md).

## 🚢 Deployment

One-click deploy to [Vercel](https://vercel.com) (free):

1. Fork this repository
2. Import your fork at [vercel.com/new](https://vercel.com/new)
3. Deploy with zero configuration

A GitHub Actions deploy pipeline is included (`.github/workflows/deploy.yml`). To deploy from your own CI, add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` under Settings → Secrets; every push to main then deploys automatically.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgements

Thanks to everyone who contributes to this project!
