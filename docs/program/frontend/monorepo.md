---
outline: [2, 3]
---

# Monorepo

Monorepo 将多个相关项目放在同一个版本仓库中管理。应用和包可以共享代码、类型及工具配置，并通过工作区工具组织依赖与构建任务。

它有助于集中维护关联项目，但不会自动解决所有依赖和构建问题：仍需明确包的边界、版本策略及任务依赖。

## TSConfig

如果使用 TypeScript 的项目引用（`references`），被引用的项目需要启用 `composite`，并满足声明文件及源码包含范围的要求。项目引用通常依赖被引用项目生成的 `.d.ts`；不要一概设置 `noEmit: true`，否则可能无法提供引用方需要的输出。

单纯把共享 `tsconfig` 作为配置包发布或通过 `extends` 复用，不等同于项目引用，无需因此启用 `composite`。详见 [TypeScript 项目引用](https://www.typescriptlang.org/docs/handbook/project-references.html)。

## 构建

本节讨论工作区中库包的构建。选择工具时主要考虑：输出的模块格式、类型声明、静态资源、目录结构以及开发时如何看到包的更新。

`package.json` 的 `exports` 定义包的公开入口和条件导出；是否同时提供 `main`、`module` 等字段取决于需要兼容的工具和运行环境。

### 选型指南

下面以 tsup 和 unbuild 为例：tsup 适合以入口为中心打包；unbuild 还提供保留目录结构的 `mkdist` 和开发用的 stub 模式。具体能力和选项应以所用版本的文档为准。

### tsup

使用 [tsup](https://tsup.egoist.dev/#usage) 可以配置入口、模块格式和类型声明。例如：

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'], //入口文件
    splitting: false, //代码分割
    sourcemap: false, //源码地图
    clean: true, //构建前清理dist目录
    dts: true, //dts生成
    format: ['esm', 'cjs'], //格式
    publicDir: 'src/assets', //资源目录
    outExtension: ({ format }) => ({
        js: format === 'esm' ? '.mjs' : '.cjs',
        dts: '.d.ts'
    })
});
```

示例中的 `publicDir` 将指定目录的静态文件复制到输出目录；如果需要按文件映射并保留目录结构，可评估 unbuild 的 `mkdist`。

开发时可以使用 `tsup --watch` 持续构建。另一种方式是使用条件导出，让支持该条件和 TypeScript 源码的开发工具直接读取源码；需要在消费端启用对应条件，不能假设所有运行环境都会自动识别。

```json
{
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "development": "./src/index.ts",
            "import": "./dist/index.mjs",
            "require": "./dist/index.cjs"
        }
    }
}
```

#### 配置Options

[tsup完整配置](https://tsup.egoist.dev/#usage)

| 配置项       | 类型                                       | 默认值     | 说明                 |
| ------------ | ------------------------------------------ | ---------- | -------------------- |
| entry        | string[] \| Record<string, string>         | 自动推断   | 构建入口             |
| format       | 'cjs' \| 'esm' \| 'iife' \| Format[]       | ['cjs']    | 输出格式             |
| outExtension | ctx \=\> \{ js?: string; dts?: string \}   | -          | 自定义文件拓展名     |
| minify       | boolean \|'terser'                         | -          | 压缩代码             |
| dts          | boolean \| string \| DtsConfig             | -          | 类型声明文件         |
| splitting    | boolean                                    | ESM:`true` | 代码分割             |
| treeshake    | TreeshakingStrategy                        | -          | Rollup树摇           |
| sourcemap    | boolean \| 'inline'                        | -          | 源码地图             |
| watch        | boolean \| string \| (string \| boolean)[] | -          | 监听                 |
| ignoreWatch  | string[] \| string                         | -          | 忽略监听的文件       |
| clean        | boolean \| string[]                        | -          | 构建前清理输出目录   |
| silent       | boolean                                    | -          | 静默模式，不输出日志 |

### unbuild

unbuild 默认使用 Rollup 构建，也支持通过 `mkdist` 按文件处理并保留目录结构。下面的 `build.config.ts` 展示 Vue 和 TypeScript 入口：

```ts
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
    entries: [
        // 处理 Vue 文件，需要vue-tsc支持
        {
            builder: 'mkdist',
            input: './src',
            loaders: ['vue'],
            pattern: ['**/*.vue']
        },
        // TS->JS 转换
        {
            builder: 'mkdist',
            input: './src',
            format: 'esm',
            loaders: ['js'],
            pattern: ['**/*.ts']
        }
    ],
    declaration: true,
    clean: true
});
```

unbuild 的 stub 模式生成指向源码的开发入口，便于在支持的环境中查看源码更新。可在单个包中执行 `unbuild stub`，或在配置相应脚本后使用 `pnpm -r run stub --if-present`。

发布或生产构建前，确认包的导出指向正式构建产物，不要依赖开发用的 stub。

#### 配置Options

| 选项                                                     | 类型                 | 默认值   | 说明           |
| -------------------------------------------------------- | -------------------- | -------- | -------------- |
| entries                                                  | BuildEntry[]         | 自动推断 | 构建入口       |
| outDir                                                   | string               | "dist"   | 输出目录       |
| clean                                                    | boolean              | true     | 构建前清理     |
| declaration                                              | boolean \| string    | auto     | 类型声明       |
| sourcemap                                                | boolean              | false    | 生成 sourcemap |
| stub                                                     | boolean              | false    | 开发模式       |
| watch                                                    | boolean              | false    | 监听模式       |
| externals                                                | (string \| RegExp)[] | []       | 外部依赖       |
| alias                                                    | object               | {}       | 路径别名       |
| replace                                                  | object               | {}       | 文本替换       |
| failOnWarn                                               | boolean              | false    | 警告时失败     |
| parallel                                                 | boolean              | false    | 并行构建       |
| [rollup](https://cn.rollupjs.org/configuration-options/) | RollupBuildOptions   |          | rollup配置选项 |

## 依赖注意

工作区内不同工具可能依赖同一个包的不同版本；多版本本身不一定是错误，但对等依赖不兼容或已知漏洞需要排查。

先用 `pnpm why esbuild` 等命令查看依赖来源，再按兼容范围和实际问题决定是否使用 overrides。强制统一版本可能破坏依赖方的兼容性，修改后应运行相关测试。

```jsonc
// package.json：版本仅作示例
{
    "pnpm": {
        "overrides": {
            "esbuild": "^0.27.0"
        }
    }
}
```

## 速通

Turborepo 根据工作区包依赖和任务配置安排执行顺序，并根据输入计算缓存。

跨包调用优先通过包名及其 `exports` 定义的公开入口，避免直接依赖另一个包的内部文件。这样可以让包边界和依赖关系更清晰。

### 任务

`dependsOn` 中的写法决定任务依赖：

| 写法       | 含义                              |
| ---------- | --------------------------------- |
| `build`    | 当前包中的 `build` 任务           |
| `^build`   | 当前包所依赖的包中的 `build` 任务 |
| `ui#build` | 指定包 `ui` 中的 `build` 任务     |
| `//#build` | 仓库根目录的 `build` 任务         |

任务按依赖图执行，互不依赖的任务可并行。`inputs` 参与缓存哈希，默认根据包中的文件和 Git 忽略规则确定；配置 `inputs` 会覆盖默认行为，可用 `$TURBO_DEFAULT$` 保留默认输入。`outputs` 指定缓存命中时要恢复的文件；未配置时不会恢复文件产物，日志仍可缓存。

```jsonc
// turbo.json
{
    "tasks": {
        "build": {
            "dependsOn": ["^build"],
            "inputs": ["$TURBO_DEFAULT$", "**/*.md"],
            "outputs": ["dist/**"]
        }
    }
}
```

根任务使用 `//#任务名` 注册并引用，例如 `//#build` 对应根目录 `package.json` 中的 `build` 脚本。

### 依赖关系

| 命令                         | 作用       |
| :--------------------------- | :--------- |
| `turbo build --filter=...ui` | 谁用了ui库 |
| `turbo build --filter=ui...` | ui库用了谁 |

查看任务依赖图：

```sh
turbo run build --graph
# 或输出为 SVG
turbo run build --graph="build-deps.svg"
```

### Options

`globalDependencies` 将指定文件纳入所有任务的全局缓存哈希，适合声明会影响整个工作区的配置文件。文件变化后，相关任务会产生新的缓存键。

### Commands

[Turborepo Commands](https://turborepo.com/docs/reference/run)
