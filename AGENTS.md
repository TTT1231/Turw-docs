# Turw-docs 项目概览

个人博客

## 📂 项目结构

```text
docs/
├── .vitepress/           ← 站点构建与主题样式
│   ├── config.mts        ← VitePress 配置 + 自定义 markdown 插件
│   ├── theme/            ← 自定义主题；components/ 为页面增强组件（代码查看/复制、图片预览、Flex/Grid 属性演示等）
│   └── css/              ← 自定义容器、代码组图标、mixins
├── program/
│   ├── frontend/         ← 前端合并单页：基础（CSS/ES6/移动端/安全）、Vue3、Nuxt、实战 FAQ、Monorepo/Electron/WebAssembly、NestJS
│   └── backend/          ← 服务端合并单页：Node.js 核心、SQL/Prisma、GraphQL、架构设计思路
├── harness.md            ← AI 协作工程化经验（LSP、团队协作模式、开发闭环、错误经验规则）
└── index.md              ← 首页
```

## ⚠ 重要说明

- **代码图标：** `public/assets/code-icon/` 中的 SVG 动态导入
- **包管理器：** Bun
- **样式：** 纯 SCSS（未使用 Tailwind，无 postcss.config.js，无需 autoprefixer）
