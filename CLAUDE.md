# AGENTS.md

此文件为 AI 编码工具在此代码库中工作时提供指导。

## 项目概述

这是一个使用 VitePress 构建的个人博客和文档站点。`docs/` 目录中的 markdown 文件包含学习材料和技术文档,涵盖前端开发、服务端技术和编码最佳实践。

## 开发命令

- `bun run dev` - 启动 VitePress 开发服务器
- `bun run docs:build` - 构建生产环境的静态站点
- `bun run docs:preview` - 本地预览生产构建
- `bun run format` - 使用 Prettier 格式化 `docs/` 中的文件
- `bun run check:cspell` - 运行项目拼写检查
- `bun run generate-manifest` - 生成 SVG 图标清单文件

## 架构

### 项目结构

```
docs/
├── .vitepress/
│   ├── config.mts           # VitePress 配置
│   ├── theme/               # 自定义主题扩展
│   │   ├── index.ts         # 主题入口和 Vue 组件注册
│   │   ├── components/      # 自定义 Vue 组件
│   │   └── style.scss       # 主题样式
│   ├── css/
│   │   ├── custom-container.scss  # 自定义容器块样式 (tip/warning/danger/info 等)
│   │   ├── code-group-icon.scss   # 代码块语言图标样式
│   │   ├── mixins.scss      # mixins 混入文件
│   │   └── tailwind.css     # Tailwind CSS v4 入口 (仅 @import "tailwindcss")
│   └── dist/                # 构建输出 (自动生成)，gitignore
├── frontdesign/             # 前端文档
├── nuxt/                    # Nuxt.js 文档
├── server/                  # 服务端文档
├── code-style/              # 代码风格和规范以及 vscode 配置文档
├── sql/                     # SQL 文档
├── wsl/                     # WSL 相关文档
└── index.md                 # 首页
```

### 核心技术

- **VitePress** - 静态站点生成器
- **Vue 3** - 前端框架
- **Tailwind CSS v4** - CSS 原生配置（无 tailwind.config.js），使用 `@tailwindcss/postcss`
- **Ant Design Vue** - UI 组件库（仅 3 个组件使用 Select/Image/Skeleton）
- **CodeMirror 6** - 代码查看器（用于 CodeMirrorCodeViewer 组件）
- **SCSS** - CSS 预处理器（使用 modern-compiler API）

### 自定义主题架构

项目扩展了默认的 VitePress 主题。自定义 Vue 组件在 [`docs/.vitepress/theme/index.ts`](docs/.vitepress/theme/index.ts) 中注册,可以在 markdown 文件中使用:

- `FlexProperty.vue` - CSS flex 布局属性展示组件
- `GridProperty.vue` - CSS grid 布局属性展示组件
- `ImgPreview.vue` - 图片预览组件
- `NuxterrorHandling.vue` - Nuxt.js 错误处理展示组件
- `CopyBtn.vue` - 全局复制按钮组件
- `CodeMirrorCodeViewer.vue` - CodeMirror 6 代码查看器组件
- `FoldCodeBlock.vue` - 基于 CodeMirror 6 的可折叠代码块，带复制按钮
- `FoldCodeGroup.vue` - 带标签的可折叠代码组，带标签切换和共享复制

## 代码风格

### Prettier 配置

位于 [`/.prettierrc.json`](/.prettierrc.json):

- 3 空格缩进
- JS/TS 使用单引号
- 100 字符行宽
- LF 换行符
- 无尾随逗号
- JSON、YAML、CSS 和 Markdown 文件的特殊覆盖

### 提交前检查

- 运行 `bun run format` 确保代码格式正确
- 运行 `bun run check:cspell` 检查拼写
- 确保 commit message 清晰描述变更内容

## 重要说明

- **基础路径**: 站点在 VitePress 配置中配置的基础路径为 `/Turw-docs/`
- **代码图标**: `public/assets/code-icon/` 中的 SVG 图标是动态导入的
- **包管理器**: 使用 `bun`
- **PostCSS**: 使用 `@tailwindcss/postcss`，无需单独的 `autoprefixer`（Tailwind v4 已内置）
