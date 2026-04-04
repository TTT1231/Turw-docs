<div align="center">

# Turw Docs

一个持续更新的技术学习博客与文档站点，围绕前端工程化、Vue/Nuxt、服务端、SQL 与代码规范展开。

[![VitePress](https://img.shields.io/badge/VitePress-1.6.4-5C73E7)](https://vitepress.dev/)
[![Vue](https://img.shields.io/badge/Vue-3.5-42b883)](https://vuejs.org/)
[![PNPM](https://img.shields.io/badge/PNPM-10-orange)](https://pnpm.io/)
[![Language](https://img.shields.io/badge/Language-Chinese-red)](https://github.com/TTT1231/Turw-docs)

<a href="#-english">English</a> · <a href="#-中文">中文</a>

</div>

---

## 🌍 中文

### 我在写什么

这个仓库是我的个人技术文档博客，核心目标是把日常学习中真正有用、能复用的知识沉淀下来，形成可以快速查阅和持续迭代的知识库。内容不只讲概念，更偏向“实战问题 + 解决方案 + 经验总结”。

### 博客有哪些内容

| 模块             | 内容方向                                           | 示例文档                                                                             |
| :--------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------- |
| 前端基础与进阶   | CSS 布局、ES6、Vite、移动端、WebAssembly、前端安全 | `docs/frontdesign/css-layout.md`、`docs/frontdesign/ES6.md`                          |
| Vue3 专题        | Vue 核心、路由、性能优化、开发问题排查             | `docs/frontdesign/vue3/vue-core.md`、`docs/frontdesign/vue3/performance-optimize.md` |
| Nuxt 全栈        | 目录结构、错误处理、SEO 与 SSR、配置 FAQ           | `docs/nuxt/catalog.md`、`docs/nuxt/error-handle.md`                                  |
| 服务端           | Node.js、NestJS、GraphQL、架构设计思路             | `docs/server/Nodejs.md`、`docs/server/Nestjs.md`                                     |
| SQL 与数据库     | Prisma、SQL 优化                                   | `docs/sql/sql-prisma.md`、`docs/sql/sql-optimize.md`                                 |
| 代码规范与工具链 | ESLint/Prettier、TS Schema、VSCode 设置、WSL2 代理 | `docs/code-style/eslint-format.md`、`docs/code-style/vscode-setting.md`              |
| AI 协作实践      | Claude 规则、工作流与经验                          | `docs/claude.md`                                                                     |

### 这个博客的特点

- 面向实战，强调可直接复用的知识沉淀。
- 文档结构清晰，按前端、Nuxt、服务端、SQL、规范分层组织。
- 支持本地全文检索，适合长期维护为个人技术手册。
- 持续更新，跟随实际开发中遇到的问题迭代。

### 本地启动

```bash
pnpm install
pnpm dev
```

默认访问地址：`http://localhost:5173/Turw-docs/`（以实际终端输出为准）。

### 常用命令

```bash
pnpm dev            # 本地开发
pnpm docs:build     # 生产构建
pnpm docs:preview   # 预览构建产物
pnpm format         # 格式化 docs 目录
pnpm check:cspell   # 拼写检查
```

### 项目结构（核心）

```text
docs/
├─ .vitepress/            # 站点配置与主题扩展
├─ frontdesign/           # 前端相关文档
├─ nuxt/                  # Nuxt 文档
├─ server/                # 服务端文档
├─ sql/                   # SQL 文档
├─ code-style/            # 代码风格与工程规范
└─ index.md               # 站点首页
```

### 技术栈

- VitePress
- Vue 3
- Ant Design Vue
- Tailwind CSS
- SCSS

### 说明

- 站点基础路径为 `/Turw-docs/`。
- 仓库当前未包含独立 `LICENSE` 文件，如需开源复用建议补充许可证文本。

<p align="right"><a href="#-english">Switch to English →</a></p>

---

## 🇬🇧 English

### What I am writing

This repository is my personal tech blog and documentation site. I use it to turn daily learning into reusable notes, practical guides, and troubleshooting records. It focuses on real-world implementation rather than theory-only content.

### What's inside this blog

| Area            | Topics                                                        | Example Docs                                                                         |
| :-------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| Frontend        | CSS layout, ES6, Vite, mobile, WebAssembly, frontend security | `docs/frontdesign/css-layout.md`, `docs/frontdesign/ES6.md`                          |
| Vue3            | Vue core, routing, performance optimization, common issues    | `docs/frontdesign/vue3/vue-core.md`, `docs/frontdesign/vue3/performance-optimize.md` |
| Nuxt Full-stack | project structure, error handling, SEO & SSR, config FAQ      | `docs/nuxt/catalog.md`, `docs/nuxt/error-handle.md`                                  |
| Backend         | Node.js, NestJS, GraphQL, architecture thinking               | `docs/server/Nodejs.md`, `docs/server/Nestjs.md`                                     |
| SQL & DB        | Prisma and SQL optimization                                   | `docs/sql/sql-prisma.md`, `docs/sql/sql-optimize.md`                                 |
| Code Standards  | ESLint/Prettier, TS schema, VSCode settings, WSL2 proxy       | `docs/code-style/eslint-format.md`, `docs/code-style/vscode-setting.md`              |
| AI Workflow     | Claude workflow and rule notes                                | `docs/claude.md`                                                                     |

### Highlights

- Practice-oriented documentation with reusable solutions.
- Clear information architecture by domain.
- Local search support for quick lookup.
- Continuously updated with real project experience.

### Quick Start

```bash
pnpm install
pnpm dev
```

Then open: `http://localhost:5173/Turw-docs/`.

### Tech Stack

- VitePress
- Vue 3
- Ant Design Vue
- Tailwind CSS
- SCSS

### Notes

- Site base path is `/Turw-docs/`.
- No standalone `LICENSE` file is included at the moment.

<p align="right"><a href="#-中文">切换到中文 →</a></p>
