# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个使用 VitePress 构建的个人博客和文档站点。`docs/` 目录中的 markdown 文件包含学习材料和技术文档,涵盖前端开发、服务端技术和编码最佳实践。

## 开发命令

### 基础命令

- `pnpm dev` - 启动 VitePress 开发服务器
- `pnpm docs:build` - 构建生产环境的静态站点
- `pnpm docs:preview` - 本地预览生产构建
- `pnpm format` - 使用 Prettier 格式化 `docs/` 中的文件
- `pnpm check:cspell` - 运行项目拼写检查

### 部署命令

- `pnpm build-zip-upload` - 构建站点、创建 ZIP 并上传到服务器 (git push hook 使用)
- `pnpm upload-zip` - 上传现有的 `docs/.vitepress/dist.zip` 到服务器

> [!TIP] 提示
> 上面命令之所以在本地电脑构建然后上传到服务器，是因为服务器cpu内存容量不大，打包会造成内存溢出而中断。

**注意:** Git push 会通过 Husky pre-push hook (`/.husky/pre-push`) 触发自动部署。可以通过 `.env` 中的 `GIT_PUSH_BUILD_ZIP_REQUIRE` 环境变量控制。

## 架构

### 项目结构

````
docs/
├── .vitepress/
│   ├── config.mts           # VitePress 配置
│   ├── theme/               # 自定义主题扩展
│   │   ├── index.ts         # 主题入口和 Vue 组件注册
│   │   ├── components/      # 自定义 Vue 组件
│   │   └── style.scss       # 主题样式
│   ├── css/
│   │   ├── custom-.-.scss   # 这是vitepress中code-group代码自定义图标样式
│   │   ├── code-.-.scss     # 这是vitepress中代码图标，就是```ts/js/md...图标
│   │   ├── mixins.scss      # mixins混入文件，专门存放逻辑函数处
│   │   └── tailwind.css     # Tailwind CSS 导入
│   └── dist/                # 构建输出 (自动生成)，gitignore
├── frontdesign/             # 前端文档
├── nuxt/                    # Nuxt.js 文档
├── server/                  # 服务端文档
├── code-style/              # 代码风格和规范以及vscode配置文档
├── sql/                     # SQL 文档
└── index.md                 # 首页
````

### 核心技术

- **VitePress** - 静态站点生成器
- **Vue 3** - 前端框架
- **Ant Design Vue** - UI 组件库 (用于自定义组件)
- **Tailwind CSS** - 实用优先的 CSS 框架
- **SCSS** - CSS 预处理器 (使用现代编译器 API)

### 自定义主题架构

项目扩展了默认的 VitePress 主题。自定义 Vue 组件在 [`docs/.vitepress/theme/index.ts`](docs/.vitepress/theme/index.ts) 中注册,可以在 markdown 文件中使用。示例包括:

- `FlexProperty.vue` css flex布局属性展示组件
- `GridProperty.vue` css grid布局属性展示组件
- `JwtValProcess.vue` nuxtjs中jwt验证流程图片展示组件
- `NuxterrorHandling.vue` nuxtjs中错误处理展示组件
- `CopyBtn.vue` 全局复制按钮组件，为代码复制提供支持

### 部署策略

项目使用两阶段部署来处理低内存服务器限制:

1. **本地构建** - VitePress 在本地构建站点 (避免服务器 OOM)
2. **ZIP 上传** - 构建输出被压缩并通过 SSH 上传
3. **服务器解压** - 独立的服务器脚本解压并部署

SSH 部署由 `/scripts/` 中的脚本处理:

- `build-zip-upload.mjs` - 编排构建、ZIP 和上传
- `upload-zip.mjs` - 处理 SSH/SFTP 上传并显示进度
- `deploy-cloud.sh` - 服务器端解压和部署 (已废弃,使用 cron)

## Git 提交规范

### Commit Message 格式

项目遵循语义化提交规范 (Conventional Commits):

```
<type>: <subject>
```

### Type 类型

- `feat` - 新功能
- `fix` - 修复 bug
- `docs` - 文档更新
- `style` - 代码格式调整 (不影响代码运行)
- `refactor` - 重构 (既不是新功能也不是修复 bug)
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建过程或辅助工具的变动
- `revert` - 回滚之前的 commit

### 示例

```bash
git commit -m "feat: 添加 Vue3 响应式原理文档"
git commit -m "fix: 修复部署脚本路径错误"
git commit -m "docs: 更新 README 说明"
git commit -m "style: 格式化代码"
```

### 提交前检查

- 运行 `pnpm format` 确保代码格式正确
- 运行 `pnpm check:cspell` 检查拼写
- 确保 commit message 清晰描述变更内容

## 代码风格

### Prettier 配置

位于 [`/.prettierrc.json`](/.prettierrc.json):

- 3 空格缩进
- JS/TS 使用单引号
- 100 字符行宽
- LF 换行符
- 无尾随逗号
- JSON、YAML、CSS 和 Markdown 文件的特殊覆盖

### 环境变量

部署所需 (在项目根目录创建 `.env`):

- `SERVER_USER` - SSH 用户名
- `SERVER_HOST` - SSH 主机
- `SERVER_PATH` - 远程部署目录
- `SERVER_PRIVATE_KEY_PATH` 或 `SERVER_PASSWORD` - 认证方式
- `SERVER_TEMP_ZIP_PATH` - 上传临时目录 (默认: "temp")
- `GIT_PUSH_BUILD_ZIP_REQUIRE` - 启用/禁用推送时自动部署 (默认: "true")

## 重要说明

- **基础路径**: 站点在 VitePress 配置中配置的基础路径为 `/Turw-docs/`
- **代码图标**: `public/assets/code-icon/` 中的 SVG 图标是动态导入的 - 关于未使用文件的警告已在 vite 配置中过滤
- **包管理器**: 使用 `pnpm` (在 package.json 中指定)
- **Git 钩子**: 配置了 Husky - pre-push hook 触发部署
