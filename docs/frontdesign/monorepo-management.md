# Monorepo架构

将多个项目集中化、关联到一个Git仓库，公共模块抽离，自动构建流程优化。  

- 将多个项目代码存储在一个单一版本仓库的架构模式。（**单一仓库**）。  
- 所有项目共享同一个仓库，且所有版本控制都存储在同一个**Git**仓库中。
- 项目共享相同依赖库，不同项目之间可以共享和重用代码（**通过pnpm软链接**）

## 传统分布式单一项目缺点
- 项目分散，集中管理困难
- 每次要运行都要分开运行
- 打包构建也要分开构建打包部署
- 最终要一点是**代码逻辑重复**，特别是类型、还有依赖

## package.json配置字段

| 分类              | 字段                         | 类型        | 典型值/示例                                 | pnpm 专属特性说明                   |
| --------------- | -------------------------- | --------- | -------------------------------------- | ----------------------------- |
| **基础标识**        | `name`                     | string    | `"@scope/pkg"`                         | 子包命名需要`@[name]/sub-package`      |
|                 | `version`                  | string    | `"1.0.0"` 或 `"workspace:*"`            | 使用 `workspace:*` 同步本地包版本      |
|                 | `private`                  | boolean   | `true`                                 | 根目录包必须设置为 `true`              |
| **Monorepo 架构** | `workspaces`               | string\[] | `["packages/*", "apps/*"]`             | 相当于 `pnpm-workspace.yaml` 配置，分开比较好  |
|                 | `scripts`                  | object    | `{"build": "vite build"}`              | 推荐使用 `pnpm -r run build` 批量执行 |
| **依赖控制**        | `dependencies`             | object    | `{"react": "^18.2.0"}`                 | 自动提升到根 `node_modules`         |
|                 | `devDependencies`          | object    | `{"typescript": "^5.0.0"}`             | 开发工具链建议放在根目录                  |
|                 | `peerDependencies`         | object    | `{"react": ">=16.8.0"}`                | pnpm 7+ 版本会自动安装 peerDeps      |
|                 | `peerDependenciesMeta`     | object    | `{"optional": true}`                   | 用来标记可选的 peerDeps              |
| **pnpm 强化**     | `pnpm.overrides`           | object    | `{"lodash": "4.17.21"}`                | 强制锁定版本（优先级最高）                 |
|                 | `pnpm.patchedDependencies` | object    | `{"lodash@4.17.21": "patches/lodash"}` | 记录通过 `pnpm patch` 修改的依赖       |
|                 | `pnpm.allowedVersions`     | object    | `{"react": "18.x"}`                    | 限制依赖的版本范围                     |
| **模块规范**        | `main`                     | string    | `"dist/index.cjs"`                     | CommonJS 入口文件路径               |
|                 | `module`                   | string    | `"dist/index.mjs"`                     | ESM 入口文件路径                    |
|                 | `types`                    | string    | `"dist/index.d.ts"`                    | 类型定义文件路径                      |
|                 | `exports`                  | object    | 条件导出对象                                 | 现代包的标准，支持子路径                  |
| **发布配置**        | `files`                    | string\[] | `["dist/**", "!**/__tests__"]`         | 控制发布的文件内容（支持 glob 排除）         |
|                 | `publishConfig`            | object    | `{"access": "public"}`                 | 覆盖发布时的 registry 配置            |
| **环境约束**        | `engines`                  | object    | `{"node": ">=18.0.0"}`                 | 运行时环境要求                       |
|                 | `os`                       | string\[] | `["darwin", "linux"]`                  | 限制支持的操作系统                     |
| **工程信息**        | `repository`               | object    | GitHub 链接                              | 便于团队协作与定位                     |
|                 | `license`                  | string    | `"MIT"`                                | 开源协议声明                        |


**注：**为符合现代标准，**main**指向commonJs入口，而**module**指向esmodule入口  
【这里的双入口是为了适配require或者es格式，其实都差不多】